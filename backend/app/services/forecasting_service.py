"""
Physics-informed synthetic rolling forecasting engine for GreenSync
Predicts facility load demand and solar generation over a rolling 6-hour horizon
Includes diurnal harmonic decomposition, weather-HVAC coupling, and solar PV cell physics
"""

import math
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.models.schemas import ForecastHorizonItem, RollingForecastResponse
from app.services.weather_service import weather_service
from app.services.demo_state import demo_state


class ForecastingService:
    def __init__(self):
        self.solar_capacity_kw = settings.SOLAR_CAPACITY_KW
        self.inverter_efficiency = 0.965
        self.temp_coefficient = -0.0038  # -0.38% per °C above 25°C
        self.noct = 45.0  # Nominal Operating Cell Temp (°C)
        self.demand_surge_kw: float = 0.0
        self.demand_surge_expiry: float = 0.0

    def inject_demand_surge(self, surge_kw: float, duration_hours: float):
        self.demand_surge_kw = max(0.0, surge_kw)
        self.demand_surge_expiry = datetime.now(timezone.utc).timestamp() + (duration_hours * 3600)

    def reset_demand_surge(self):
        self.demand_surge_kw = 0.0
        self.demand_surge_expiry = 0.0

    def _predict_facility_load(self, dt: datetime, temp_c: float) -> Tuple[float, float, float]:
        """
        Multivariate regression model for commercial/industrial microgrid load.
        Outputs (P10, P50, P90) in kW.
        """
        hour = dt.hour + (dt.minute / 60.0)
        weekday = dt.weekday() < 5 # True if Mon-Fri

        # Base diurnal commercial curve (kW)
        # Night base: ~35kW, Morning ramp: 08:00->90kW, Midday HVAC: 13:00->115kW, Evening: 18:00->85kW
        if weekday:
            base_load = (
                40.0 
                + 35.0 * (1.0 / (1.0 + math.exp(-0.8 * (hour - 7.5)))) # morning startup
                + 40.0 * math.exp(-0.5 * math.pow((hour - 14.0) / 3.0, 2)) # afternoon HVAC & operations
                - 25.0 * (1.0 / (1.0 + math.exp(-0.8 * (hour - 19.5)))) # evening winddown
            )
        else:
            # Weekend lighter load
            base_load = 28.0 + 25.0 * math.exp(-0.5 * math.pow((hour - 13.0) / 4.0, 2))

        # Temperature coupling (HVAC cooling load for temp > 22°C)
        cooling_deg = max(0.0, temp_c - 22.0)
        hvac_demand = cooling_deg * 2.2 # 2.2 kW per °C of cooling demand

        p50 = base_load + hvac_demand
        manual_load = demo_state.facility_load_kw is not None
        if manual_load:
            p50 = demo_state.facility_load_kw

        # Add active scenario surge if present
        now_ts = datetime.now(timezone.utc).timestamp()
        if self.demand_surge_expiry > now_ts:
            p50 += self.demand_surge_kw

        # Add realistic microgrid random perturbation (±3%)
        seed_noise = 0.0 if manual_load else 2.5 * math.sin(dt.hour * 3.7 + dt.minute * 0.4)
        p50 = max(15.0, p50 + seed_noise)

        # Confidence intervals: P10 = -8%, P90 = +12% (contingency margin)
        p10 = round(p50 * 0.92, 1)
        p50 = round(p50, 1)
        p90 = round(p50 * 1.12, 1)
        return p10, p50, p90

    def _predict_solar_generation(
        self, 
        dt: datetime, 
        cloud_cover_pct: float, 
        temp_c: float
    ) -> Tuple[float, float, float, float]:
        """
        Physics-informed solar photovoltaic generation prediction.
        Returns (P10, P50, P90, GHI).
        """
        elev = weather_service._calculate_solar_elevation(dt)
        if elev <= 1.0:
            return 0.0, 0.0, 0.0, 0.0

        clear_ghi = weather_service.calculate_clear_sky_ghi(elev)
        expected_ghi = weather_service.apply_cloud_attenuation(clear_ghi, cloud_cover_pct)

        # Cell temperature calculation
        t_cell = temp_c + ((self.noct - 20.0) / 800.0) * expected_ghi
        temp_derating = 1.0 + self.temp_coefficient * (t_cell - 25.0)
        temp_derating = max(0.80, min(1.05, temp_derating))

        # Raw PV power
        expected_kw = self.solar_capacity_kw * (expected_ghi / 1000.0) * temp_derating * self.inverter_efficiency
        expected_kw = max(0.0, min(self.solar_capacity_kw, expected_kw))

        # Cloud volatility margins:
        # P10 accounts for sudden heavy cloud shadow (-25% to -40%)
        p10 = expected_kw * (0.65 if cloud_cover_pct > 30 else 0.85)
        # P90 accounts for cloud-edge irradiance enhancement / clear sky (+10%)
        p90 = min(self.solar_capacity_kw, expected_kw * 1.10)

        return round(p10, 1), round(expected_kw, 1), round(p90, 1), round(expected_ghi, 1)

    def generate_rolling_forecast(self, horizon_hours: int = 6, step_minutes: int = 15) -> RollingForecastResponse:
        """
        Computes 6-hour rolling forecast at 15-minute intervals.
        """
        start_dt = demo_state.now()
        items: List[ForecastHorizonItem] = []
        total_steps = int((horizon_hours * 60) / step_minutes)

        for step in range(total_steps):
            step_dt = start_dt + timedelta(minutes=step * step_minutes)
            hour_offset = round(step * (step_minutes / 60.0), 2)
            
            # Predict weather at this future timestamp
            weather_obs = weather_service.get_weather_observation(step_dt)
            
            # Predict load & solar
            load_p10, load_p50, load_p90 = self._predict_facility_load(step_dt, weather_obs.temperature_c)
            solar_p10, solar_p50, solar_p90, ghi = self._predict_solar_generation(
                step_dt, 
                weather_obs.cloud_cover_pct, 
                weather_obs.temperature_c
            )

            tariff = settings.get_tariff_rate(step_dt.hour)

            items.append(
                ForecastHorizonItem(
                    timestamp=step_dt,
                    hour_offset=hour_offset,
                    demand_p10_kw=load_p10,
                    demand_p50_kw=load_p50,
                    demand_p90_kw=load_p90,
                    solar_p10_kw=solar_p10,
                    solar_p50_kw=solar_p50,
                    solar_p90_kw=solar_p90,
                    cloud_cover_pct=weather_obs.cloud_cover_pct,
                    solar_irradiance_ghi=ghi,
                    predicted_tariff=round(tariff, 3)
                )
            )

        return RollingForecastResponse(
            generated_at=start_dt,
            horizon_hours=horizon_hours,
            resolution_minutes=step_minutes,
            forecast=items,
            model_version="Physics-Diurnal-v1"
        )


forecasting_service = ForecastingService()
