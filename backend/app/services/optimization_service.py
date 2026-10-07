"""
Microgrid Dispatch Optimization Engine
Rule-based rolling dispatch planner for economic dispatch, peak shaving, and battery health estimates
"""

import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.models.schemas import (
    DispatchPlan, 
    DispatchDecisionItem, 
    RollingForecastResponse, 
    ForecastHorizonItem
)


class OptimizationService:
    def __init__(self):
        self.capacity_kwh = settings.BATTERY_CAPACITY_KWH
        self.max_power_kw = settings.BATTERY_MAX_POWER_KW
        self.min_soc = settings.BATTERY_MIN_SOC
        self.max_soc = settings.BATTERY_MAX_SOC
        self.roundtrip_eff = settings.BATTERY_ROUNDTRIP_EFFICIENCY
        self.eta_chg = math.sqrt(self.roundtrip_eff)
        self.eta_dis = math.sqrt(self.roundtrip_eff)
        self.deg_cost = settings.BATTERY_DEGRADATION_COST_PER_KWH
        self.feed_in_tariff = settings.FEED_IN_TARIFF
        self.curtailment_penalty = settings.CURTAILMENT_PENALTY
        self.current_soc = 0.65 # Initial 65% SoC
        self.active_mode = "OPTIMAL_AUTONOMOUS"

    def set_mode(self, mode: str):
        valid_modes = ["OPTIMAL_AUTONOMOUS", "ISLANDED", "PEAK_SHAVING", "FORCE_CHARGE"]
        if mode in valid_modes:
            self.active_mode = mode

    def update_current_soc(self, new_soc: float):
        self.current_soc = max(self.min_soc, min(self.max_soc, new_soc))

    def solve_dispatch(
        self, 
        forecast_response: RollingForecastResponse,
        current_soc: Optional[float] = None,
        force_mode: Optional[str] = None
    ) -> DispatchPlan:
        """
        Solves multi-period constrained economic dispatch over the 6-hour rolling window.
        Uses forward dynamic programming with energy arbitrage and peak shaving constraints.
        """
        mode = force_mode or self.active_mode
        soc_t = current_soc if current_soc is not None else self.current_soc
        dt_hours = forecast_response.resolution_minutes / 60.0 # 0.25 hours (15 min)

        schedule: List[DispatchDecisionItem] = []
        total_cost = 0.0
        total_baseline_cost = 0.0
        total_carbon_abated = 0.0
        total_curtailed = 0.0
        total_throughput = 0.0
        total_deg_cost = 0.0

        # Forecast items
        items: List[ForecastHorizonItem] = forecast_response.forecast

        for i, step in enumerate(items):
            solar = step.solar_p50_kw
            demand = step.demand_p50_kw
            tariff = step.predicted_tariff
            net_demand = demand - solar

            bat_chg = 0.0
            bat_dis = 0.0
            grid_imp = 0.0
            grid_exp = 0.0
            curtail = 0.0
            unserved = 0.0
            action = "SOLAR_SELF_CONSUME"
            rationale = ""

            # Check special operating modes
            if mode == "ISLANDED":
                # Grid breaker open: 0 grid import / export allowed
                if net_demand > 0:
                    # Deficit: battery must discharge up to available capacity
                    max_dis_energy = max(0.0, (soc_t - self.min_soc) * self.capacity_kwh * self.eta_dis)
                    max_dis_power = min(self.max_power_kw, max_dis_energy / dt_hours)
                    bat_dis = min(net_demand, max_dis_power)
                    unmet = net_demand - bat_dis
                    unserved = max(0.0, unmet)
                    if unmet > 0.05:
                        action = "ISLAND_LOAD_SHED"
                        rationale = f"Islanded off-grid: BESS providing {round(bat_dis, 1)} kW. Load shedding {round(unmet, 1)} kW required."
                    else:
                        action = "ISLAND_BATTERY_SUPPORT"
                        rationale = f"Islanded microgrid: BESS powering facility load ({round(bat_dis, 1)} kW), zero grid dependency."
                else:
                    # Surplus solar: charge battery
                    surplus = abs(net_demand)
                    max_chg_energy = max(0.0, (self.max_soc - soc_t) * self.capacity_kwh / self.eta_chg)
                    max_chg_power = min(self.max_power_kw, max_chg_energy / dt_hours)
                    bat_chg = min(surplus, max_chg_power)
                    curtail = surplus - bat_chg
                    action = "ISLAND_SOLAR_CHARGE"
                    rationale = f"Islanded: excess solar charging BESS ({round(bat_chg, 1)} kW). Inverter curtailed {round(curtail, 1)} kW."

            elif mode == "FORCE_CHARGE":
                # Force maximum safe charging from available solar + grid
                max_chg_energy = max(0.0, (self.max_soc - soc_t) * self.capacity_kwh / self.eta_chg)
                max_chg_power = min(self.max_power_kw, max_chg_energy / dt_hours)
                bat_chg = max_chg_power
                # Power balance
                power_needed = demand + bat_chg - solar
                if power_needed > 0:
                    grid_imp = power_needed
                else:
                    grid_exp = min(-power_needed, settings.GRID_INTERCONNECT_MAX_KW)
                    curtail = max(0.0, -power_needed - grid_exp)
                action = "FORCE_CHARGE_GRID"
                rationale = f"Operator manual override: Force-charging BESS at {round(bat_chg, 1)} kW for emergency reserve."

            elif mode == "PEAK_SHAVING" or mode == "OPTIMAL_AUTONOMOUS":
                # Economic & Peak Shaving Dispatch Algorithm
                is_peak_tariff = (tariff >= settings.PEAK_RATE)
                is_standard = (settings.OFF_PEAK_RATE < tariff < settings.PEAK_RATE)
                is_off_peak = (tariff <= settings.OFF_PEAK_RATE)

                if net_demand > 0:
                    # Load exceeds solar generation -> Decide whether to discharge BESS or import from grid
                    # Economic threshold: discharge battery if grid tariff > (degradation cost + roundtrip loss)
                    effective_dis_cost = self.deg_cost / self.eta_dis
                    
                    if is_peak_tariff or (tariff > 0.16 and soc_t > 0.45):
                        # High tariff hour: prioritize battery discharge to shave peak
                        max_dis_energy = max(0.0, (soc_t - self.min_soc) * self.capacity_kwh * self.eta_dis)
                        max_dis_power = min(self.max_power_kw, max_dis_energy / dt_hours)
                        bat_dis = min(net_demand, max_dis_power)
                        grid_imp = net_demand - bat_dis

                        if bat_dis > 0 and grid_imp > 0:
                            action = "PEAK_SHAVING_HYBRID"
                            rationale = f"Peak tariff (${tariff:.3f}/kWh): Discharging {round(bat_dis, 1)} kW from BESS to limit expensive grid import to {round(grid_imp, 1)} kW."
                        elif bat_dis > 0:
                            action = "PEAK_SHAVING_DISCHARGE"
                            rationale = f"Peak tariff (${tariff:.3f}/kWh): 100% load ({round(demand, 1)} kW) met by Solar + BESS. Zero grid cost."
                        else:
                            action = "GRID_IMPORT_DEPLETED_BESS"
                            rationale = f"Peak tariff, but BESS at reserve limit ({round(soc_t*100, 1)}%). Importing from grid."
                    else:
                        # Off-peak or standard rate: conserve battery cycles for peak hours
                        # Only discharge if SoC is comfortably high (>75%)
                        if soc_t > 0.75:
                            max_dis_energy = max(0.0, (soc_t - 0.50) * self.capacity_kwh * self.eta_dis)
                            max_dis_power = min(self.max_power_kw * 0.5, max_dis_energy / dt_hours)
                            bat_dis = min(net_demand, max_dis_power)
                            grid_imp = net_demand - bat_dis
                            action = "MODERATE_DISCHARGE"
                            rationale = f"Standard tariff (${tariff:.3f}/kWh): Partial BESS shaving ({round(bat_dis, 1)} kW) to smooth load."
                        else:
                            grid_imp = net_demand
                            action = "GRID_IMPORT_BUFFERING"
                            rationale = f"Standard/off-peak rate (${tariff:.3f}/kWh): Conserving BESS SoC ({round(soc_t*100, 1)}%) for upcoming peak tariff."

                else:
                    # Solar exceeds load -> Surplus generation!
                    surplus = abs(net_demand)
                    # 1st priority: Charge battery if below safe max SoC
                    max_chg_energy = max(0.0, (self.max_soc - soc_t) * self.capacity_kwh / self.eta_chg)
                    max_chg_power = min(self.max_power_kw, max_chg_energy / dt_hours)
                    bat_chg = min(surplus, max_chg_power)
                    remaining_surplus = surplus - bat_chg

                    if remaining_surplus > 0:
                        # 2nd priority: Export to grid up to interconnection limit
                        grid_exp = min(remaining_surplus, settings.GRID_INTERCONNECT_MAX_KW)
                        curtail = remaining_surplus - grid_exp
                        if grid_exp > 0:
                            action = "SOLAR_EXPORT_SURPLUS"
                            rationale = f"Solar surplus ({round(surplus, 1)} kW): BESS charged with {round(bat_chg, 1)} kW; exporting {round(grid_exp, 1)} kW at feed-in tariff."
                        else:
                            action = "INVERTER_CURTAILMENT"
                            rationale = f"Solar surplus: BESS full & interconnect saturated. Inverter curtailing {round(curtail, 1)} kW."
                    else:
                        action = "SOLAR_BATTERY_STORAGE"
                        rationale = f"Clean solar surplus ({round(surplus, 1)} kW) fully absorbed into BESS to raise SoC to {round(min(95.0, (soc_t + bat_chg*dt_hours*self.eta_chg/self.capacity_kwh)*100), 1)}%."

            # Keep the point of common coupling within its configured limit.
            if mode != "ISLANDED" and grid_imp > settings.GRID_INTERCONNECT_MAX_KW:
                unserved = grid_imp - settings.GRID_INTERCONNECT_MAX_KW
                grid_imp = settings.GRID_INTERCONNECT_MAX_KW
                action = "LOAD_NOT_SERVED"
                rationale += f" Interconnection limit leaves {round(unserved, 1)} kW unserved."

            # Update battery state of charge for next step
            delta_soc = ((bat_chg * self.eta_chg - bat_dis / self.eta_dis) * dt_hours) / self.capacity_kwh
            soc_next = max(self.min_soc, min(self.max_soc, soc_t + delta_soc))

            # Financial economics
            # Step costs under GreenSync dispatch
            grid_cost = (grid_imp * tariff * dt_hours) - (grid_exp * self.feed_in_tariff * dt_hours)
            deg_wear = (bat_chg + bat_dis) * self.deg_cost * dt_hours
            curtail_cost = curtail * self.curtailment_penalty * dt_hours
            unserved_cost = unserved * 1000.0 * dt_hours
            step_cost = grid_cost + deg_wear + curtail_cost + unserved_cost

            # Baseline unmanaged scenario: No battery, solar self-consumes, all deficit bought from grid
            baseline_net = max(0.0, demand - solar)
            baseline_grid_cost = baseline_net * tariff * dt_hours
            baseline_export = max(0.0, solar - demand)
            baseline_credit = baseline_export * self.feed_in_tariff * dt_hours
            baseline_cost = baseline_grid_cost - baseline_credit

            savings = max(-5.0, baseline_cost - step_cost)

            # Carbon offset: Grid emission factor ~0.71 kg CO2/kWh displaced
            # Solar used locally + clean battery discharge displacing grid
            clean_kwh_served = min(demand, solar + bat_dis) * dt_hours
            carbon_step = clean_kwh_served * 0.71

            total_cost += step_cost
            total_baseline_cost += baseline_cost
            total_carbon_abated += carbon_step
            total_curtailed += curtail * dt_hours
            total_throughput += (bat_chg + bat_dis) * dt_hours
            total_deg_cost += deg_wear

            schedule.append(
                DispatchDecisionItem(
                    timestamp=step.timestamp,
                    hour_offset=step.hour_offset,
                    solar_kw=round(solar, 1),
                    demand_kw=round(demand, 1),
                    battery_charge_kw=round(bat_chg, 1),
                    battery_discharge_kw=round(bat_dis, 1),
                    unserved_load_kw=round(unserved, 1),
                    battery_soc_pct=round(soc_next * 100.0, 1),
                    grid_import_kw=round(grid_imp, 1),
                    grid_export_kw=round(grid_exp, 1),
                    curtailment_kw=round(curtail, 1),
                    tariff_rate=round(tariff, 3),
                    step_cost_usd=round(step_cost, 2),
                    baseline_cost_usd=round(baseline_cost, 2),
                    savings_usd=round(savings, 2),
                    dispatch_action=action,
                    action_rationale=rationale
                )
            )

            # Advance SoC
            soc_t = soc_next

        net_savings = max(0.0, total_baseline_cost - total_cost)
        savings_pct = (net_savings / total_baseline_cost * 100.0) if total_baseline_cost > 0 else 0.0

        return DispatchPlan(
            generated_at=datetime.now(timezone.utc),
            horizon_hours=forecast_response.horizon_hours,
            schedule=schedule,
            total_cost_usd=round(total_cost, 2),
            total_baseline_cost_usd=round(total_baseline_cost, 2),
            total_savings_usd=round(net_savings, 2),
            savings_pct=round(savings_pct, 1),
            carbon_abated_kg=round(total_carbon_abated, 1),
            curtailed_energy_kwh=round(total_curtailed, 1),
            battery_throughput_kwh=round(total_throughput, 1),
            battery_degradation_cost_usd=round(total_deg_cost, 2),
            microgrid_mode=mode,
            objective_status="HEURISTIC_DISPATCH",
            solver_name="Rule-based heuristic",
            assumptions=[
                "Uses the P50 demand and solar forecast.",
                "Applies fixed tariff and SoC thresholds interval by interval without looking ahead.",
                "This result is a simulation estimate, not a hardware command.",
            ],
        )


optimization_service = OptimizationService()
