"""
Microgrid Real-Time SCADA Simulator & Telemetry State
Maintains live electrical state, bus frequency/voltage dynamics, and breaker interlocks
Classroom microgrid simulation using reference equipment limits
"""

import math
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional
from app.core.config import settings
from app.models.schemas import TelemetryPoint, SystemAlert, WeatherObservation
from app.services.weather_service import weather_service
from app.services.forecasting_service import forecasting_service
from app.services.optimization_service import optimization_service
from app.services.demo_state import demo_state


class MicrogridSimulator:
    def __init__(self):
        self.battery_soc_pct = 68.5
        self.battery_temp_c = 27.2
        self.battery_soh_pct = 98.4
        self.breaker_solar = "CLOSED"
        self.breaker_bess = "CLOSED"
        self.breaker_grid = "CLOSED"
        self.microgrid_mode = "OPTIMAL_AUTONOMOUS"
        self._last_telemetry_wall_at = datetime.now(timezone.utc)
        self.alerts: List[SystemAlert] = []
        self._seed_initial_alerts()

    def reset_telemetry_clock(self):
        self._last_telemetry_wall_at = datetime.now(timezone.utc)

    def _seed_initial_alerts(self):
        now = demo_state.now()
        self.alerts.append(
            SystemAlert(
                id=str(uuid.uuid4())[:8],
                timestamp=now,
                severity="INFO",
                component="EMS",
                message="GreenSync Microgrid Controller v1.0.0 initialized in Autonomous Optimal Dispatch mode.",
                acknowledged=True
            )
        )

    def get_live_telemetry(self) -> TelemetryPoint:
        now = demo_state.now()
        weather: WeatherObservation = weather_service.get_weather_observation(now)

        # Get expected solar and load from forecast model
        p10_s, exp_solar, p90_s, ghi = forecasting_service._predict_solar_generation(
            now, weather.cloud_cover_pct, weather.temperature_c
        )
        if self.breaker_solar != "CLOSED":
            exp_solar = 0.0

        p10_l, exp_load, p90_l = forecasting_service._predict_facility_load(
            now, weather.temperature_c
        )

        # Microgrid power balancing logic for the immediate moment
        net_demand = exp_load - exp_solar
        wall_now = datetime.now(timezone.utc)
        elapsed_hours = max(0.0, min(60.0, (wall_now - self._last_telemetry_wall_at).total_seconds())) / 3600.0
        bat_power = 0.0 # + charging, - discharging
        grid_power = 0.0

        if self.breaker_grid == "OPEN":
            # Islanded operation
            if self.breaker_bess == "CLOSED":
                if net_demand > 0:
                    # Discharging to supply load
                    bat_power = -min(net_demand, settings.BATTERY_MAX_POWER_KW)
                else:
                    # Charging with surplus solar
                    surplus = abs(net_demand)
                    bat_power = min(surplus, settings.BATTERY_MAX_POWER_KW)
            grid_power = 0.0
        else:
            # Grid-connected
            if self.breaker_bess != "CLOSED":
                # With the battery isolated, the grid supplies any net deficit.
                # Solar surplus is exported; it cannot be silently absorbed.
                grid_power = net_demand
            elif self.microgrid_mode == "FORCE_CHARGE":
                bat_power = settings.BATTERY_MAX_POWER_KW * 0.8
                grid_power = exp_load + bat_power - exp_solar
            elif self.breaker_bess == "CLOSED":
                tariff = settings.get_tariff_rate(now.hour)
                if net_demand > 0:
                    if tariff >= settings.PEAK_RATE or weather.ramp_event_detected:
                        # Peak shaving / ramp cushioning
                        bat_power = -min(net_demand, settings.BATTERY_MAX_POWER_KW)
                        grid_power = max(0.0, net_demand + bat_power)
                    else:
                        grid_power = net_demand
                else:
                    # Solar surplus
                    surplus = abs(net_demand)
                    bat_power = min(surplus, settings.BATTERY_MAX_POWER_KW)
                    grid_power = -(surplus - bat_power) # export

        # Integrate simulated battery energy over elapsed wall-clock time while
        # respecting the configured SoC window and charge/discharge efficiency.
        if elapsed_hours > 0.0 and bat_power > 0.0:
            available_charge_kw = (
                (settings.BATTERY_MAX_SOC - self.battery_soc_pct / 100.0)
                * settings.BATTERY_CAPACITY_KWH
                / math.sqrt(settings.BATTERY_ROUNDTRIP_EFFICIENCY)
                / elapsed_hours
            )
            bat_power = min(bat_power, available_charge_kw)
            self.battery_soc_pct += (
                bat_power
                * math.sqrt(settings.BATTERY_ROUNDTRIP_EFFICIENCY)
                * elapsed_hours
                / settings.BATTERY_CAPACITY_KWH
                * 100.0
            )
        elif elapsed_hours > 0.0 and bat_power < 0.0:
            available_discharge_kw = (
                (self.battery_soc_pct / 100.0 - settings.BATTERY_MIN_SOC)
                * settings.BATTERY_CAPACITY_KWH
                * math.sqrt(settings.BATTERY_ROUNDTRIP_EFFICIENCY)
                / elapsed_hours
            )
            bat_power = -min(abs(bat_power), available_discharge_kw)
            self.battery_soc_pct -= (
                abs(bat_power)
                / math.sqrt(settings.BATTERY_ROUNDTRIP_EFFICIENCY)
                * elapsed_hours
                / settings.BATTERY_CAPACITY_KWH
                * 100.0
            )

        self.battery_soc_pct = max(
            settings.BATTERY_MIN_SOC * 100.0,
            min(settings.BATTERY_MAX_SOC * 100.0, self.battery_soc_pct),
        )
        if self.breaker_grid == "CLOSED":
            grid_power = net_demand + bat_power
        else:
            grid_power = 0.0
        self._last_telemetry_wall_at = wall_now

        # Slight voltage & frequency micro-fluctuations
        # Frequency dips slightly under heavy load, rises with solar surplus (droop characteristic)
        freq_offset = -0.04 * (grid_power / 200.0) + 0.02 * math.sin(now.minute * 0.5)
        bus_freq = round(50.0 + freq_offset, 2)
        
        volt_offset = -1.8 * (grid_power / 150.0) + 0.8 * math.sin(now.second * 0.1)
        bus_volt = round(415.0 + volt_offset, 1)

        # Thermal inertia of battery pack
        if abs(bat_power) > 40.0:
            self.battery_temp_c = min(38.0, self.battery_temp_c + 0.05)
        else:
            self.battery_temp_c = max(24.5, self.battery_temp_c - 0.02)

        # Sync optimization service state of charge
        optimization_service.update_current_soc(self.battery_soc_pct / 100.0)

        # Check ramp event alert
        if weather.ramp_event_detected and not any(a.message.startswith("Cloud Ramp Event Detected") for a in self.alerts[-3:]):
            self.alerts.append(
                SystemAlert(
                    id=str(uuid.uuid4())[:8],
                    timestamp=now,
                    severity="WARNING",
                    component="SOLAR",
                    message=f"Cloud Ramp Event Detected: Irradiance dropped to {weather.solar_irradiance_ghi} W/m² (rate {weather.ramp_delta_ghi} W/m²/min). BESS switched to fast-cushioning.",
                    acknowledged=False
                )
            )

        return TelemetryPoint(
            timestamp=now,
            solar_output_kw=round(exp_solar, 1),
            facility_load_kw=round(exp_load, 1),
            battery_soc_pct=round(self.battery_soc_pct, 1),
            battery_power_kw=round(bat_power, 1),
            battery_temp_c=round(self.battery_temp_c, 1),
            battery_soh_pct=round(self.battery_soh_pct, 1),
            grid_power_kw=round(grid_power, 1),
            bus_voltage_v=bus_volt,
            bus_frequency_hz=bus_freq,
            breaker_solar_status=self.breaker_solar,
            breaker_bess_status=self.breaker_bess,
            breaker_grid_status=self.breaker_grid,
            microgrid_mode=self.microgrid_mode,
            net_facility_load_kw=round(exp_load - exp_solar, 1)
        )

    def inject_scenario(self, scenario_type: str, severity: float, duration_hours: float) -> str:
        now = demo_state.now()
        if scenario_type == "CLOUD_RAMP_DROP":
            # Cloud cover leaps to 85%+, irradiance drops sharply
            weather_service.set_cloud_override(cloud_pct=88.0, duration_hours=duration_hours)
            self.alerts.append(
                SystemAlert(
                    id=str(uuid.uuid4())[:8],
                    timestamp=now,
                    severity="WARNING",
                    component="SOLAR",
                    message="SCENARIO INJECTED: Sudden severe cloud front detected (>85% cloud coverage). Irradiance plunging.",
                    acknowledged=False
                )
            )
            return "Scenario CLOUD_RAMP_DROP active: Cloud cover set to 88%, BESS auto-cushioning engaged."

        elif scenario_type == "GRID_INTERRUPTION":
            # Grid transformer trip, breaker opens, islanding mode
            self.breaker_grid = "OPEN"
            self.microgrid_mode = "ISLANDED"
            optimization_service.set_mode("ISLANDED")
            self.alerts.append(
                SystemAlert(
                    id=str(uuid.uuid4())[:8],
                    timestamp=now,
                    severity="CRITICAL",
                    component="GRID",
                    message="SCENARIO INJECTED: Grid point-of-common-coupling breaker 52-GRID tripped! Microgrid transitioned to seamless Islanded mode.",
                    acknowledged=False
                )
            )
            return "Scenario GRID_INTERRUPTION active: Breaker 52-GRID opened. Autonomous islanded dispatch engaged."

        elif scenario_type == "DEMAND_SURGE":
            # Industrial motors / chillers sudden 120 kW start
            surge_val = 60.0 + (severity * 80.0) # up to 140 kW surge
            forecasting_service.inject_demand_surge(surge_val, duration_hours)
            self.alerts.append(
                SystemAlert(
                    id=str(uuid.uuid4())[:8],
                    timestamp=now,
                    severity="WARNING",
                    component="EMS",
                    message=f"SCENARIO INJECTED: Facility heavy motor startup surge (+{round(surge_val, 1)} kW). Peak shaving optimizer reacting.",
                    acknowledged=False
                )
            )
            return f"Scenario DEMAND_SURGE active: +{round(surge_val, 1)} kW injected into load profile."

        elif scenario_type == "RESET":
            weather_service.clear_override()
            forecasting_service.reset_demand_surge()
            self.breaker_grid = "CLOSED"
            self.breaker_solar = "CLOSED"
            self.breaker_bess = "CLOSED"
            self.microgrid_mode = "OPTIMAL_AUTONOMOUS"
            self.battery_soc_pct = 68.5
            self.reset_telemetry_clock()
            demo_state.configure(None, None, None, None)
            optimization_service.set_mode("OPTIMAL_AUTONOMOUS")
            self.alerts.append(
                SystemAlert(
                    id=str(uuid.uuid4())[:8],
                    timestamp=now,
                    severity="INFO",
                    component="EMS",
                    message="SCADA Reset: All breakers closed, standard autonomous optimal dispatch restored.",
                    acknowledged=True
                )
            )
            return "System returned to normal nominal baseline."

        return f"Unknown scenario: {scenario_type}"

    def update_controls(
        self, 
        mode: Optional[str] = None, 
        breaker_solar: Optional[str] = None,
        breaker_bess: Optional[str] = None,
        breaker_grid: Optional[str] = None
    ):
        if mode:
            self.microgrid_mode = mode
            optimization_service.set_mode(mode)
            if mode == "ISLANDED":
                self.breaker_grid = "OPEN"
            elif self.breaker_grid == "OPEN":
                self.breaker_grid = "CLOSED"
        if breaker_solar:
            self.breaker_solar = breaker_solar
        if breaker_bess:
            self.breaker_bess = breaker_bess
        if breaker_grid:
            self.breaker_grid = breaker_grid
            if breaker_grid == "OPEN":
                self.microgrid_mode = "ISLANDED"
                optimization_service.set_mode("ISLANDED")
            elif self.microgrid_mode == "ISLANDED":
                self.microgrid_mode = "OPTIMAL_AUTONOMOUS"
                optimization_service.set_mode("OPTIMAL_AUTONOMOUS")


microgrid_simulator = MicrogridSimulator()
