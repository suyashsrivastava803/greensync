"""Discrete dynamic-programming dispatch optimizer for demo comparisons."""

from datetime import datetime, timezone
from typing import Dict, List, Tuple

from app.core.config import settings
from app.models.schemas import (
    DispatchDecisionItem,
    DispatchPlan,
    ForecastHorizonItem,
    RollingForecastResponse,
)


class DynamicProgrammingService:
    """Minimize horizon energy cost over discretized SoC and battery actions."""

    SOC_STEP_PCT = 1
    POWER_STEP_KW = 10
    UNSERVED_LOAD_PENALTY_USD_PER_KWH = 1000.0
    TERMINAL_SOC_PENALTY_USD_PER_KWH = 0.20

    @property
    def assumptions(self) -> List[str]:
        return [
            "Uses the P50 demand and solar forecast for each interval.",
            "Battery actions are selected in 10 kW increments; SoC states use 1% increments.",
            "Ends near the starting SoC, with a $0.20/kWh terminal deviation penalty.",
            f"Battery limits: {settings.BATTERY_CAPACITY_KWH:g} kWh, {settings.BATTERY_MAX_POWER_KW:g} kW, SoC {settings.BATTERY_MIN_SOC:.0%}–{settings.BATTERY_MAX_SOC:.0%}, {settings.BATTERY_ROUNDTRIP_EFFICIENCY:.0%} round-trip efficiency.",
            f"Grid import/export are limited to {settings.GRID_INTERCONNECT_MAX_KW:g} kW per interval.",
            "Unserved energy costs $1,000/kWh; export and degradation use configured tariffs.",
            "This is a discrete dynamic-programming optimizer, not a continuous LP or equipment controller.",
        ]

    def solve(
        self,
        forecast_response: RollingForecastResponse,
        current_soc: float,
        mode: str = "OPTIMAL_AUTONOMOUS",
    ) -> DispatchPlan:
        items = forecast_response.forecast
        if not items:
            raise ValueError("The optimizer requires at least one forecast interval.")

        dt = forecast_response.resolution_minutes / 60.0
        min_soc = round(settings.BATTERY_MIN_SOC * 100)
        max_soc = round(settings.BATTERY_MAX_SOC * 100)
        states = range(min_soc, max_soc + 1, self.SOC_STEP_PCT)
        initial_state = min(max(round(current_soc * 100), min_soc), max_soc)
        eta = settings.BATTERY_ROUNDTRIP_EFFICIENCY ** 0.5
        actions = [0] + [value for power in range(self.POWER_STEP_KW, int(settings.BATTERY_MAX_POWER_KW) + 1, self.POWER_STEP_KW) for value in (power, -power)]

        def terminal_cost(soc_pct: int) -> float:
            drift_kwh = abs(soc_pct - initial_state) / 100.0 * settings.BATTERY_CAPACITY_KWH
            return drift_kwh * self.TERMINAL_SOC_PENALTY_USD_PER_KWH

        next_values: Dict[int, float] = {soc: terminal_cost(soc) for soc in states}
        policies: List[Dict[int, Tuple[int, int, float, float, float, float, float, str, str]]] = [
            {} for _ in items
        ]

        for index in range(len(items) - 1, -1, -1):
            step = items[index]
            values: Dict[int, float] = {}
            for soc in states:
                best_cost = float("inf")
                best_choice = None
                for action_kw in actions:
                    charge = float(max(action_kw, 0))
                    discharge = float(max(-action_kw, 0))
                    if mode == "FORCE_CHARGE" and discharge > 0:
                        continue
                    next_soc_exact = soc + (charge * eta - discharge / eta) * dt / settings.BATTERY_CAPACITY_KWH * 100.0
                    if next_soc_exact < min_soc - 1e-8 or next_soc_exact > max_soc + 1e-8:
                        continue
                    next_soc = int(round(next_soc_exact / self.SOC_STEP_PCT) * self.SOC_STEP_PCT)
                    next_soc = min(max(next_soc, min_soc), max_soc)

                    residual = step.demand_p50_kw - step.solar_p50_kw + charge - discharge
                    if mode == "ISLANDED":
                        grid_import = grid_export = 0.0
                        unserved = max(0.0, residual)
                        curtailment = max(0.0, -residual)
                    else:
                        grid_import = min(max(0.0, residual), settings.GRID_INTERCONNECT_MAX_KW)
                        grid_export = min(max(0.0, -residual), settings.GRID_INTERCONNECT_MAX_KW)
                        unserved = max(0.0, residual - settings.GRID_INTERCONNECT_MAX_KW)
                        curtailment = max(0.0, -residual - settings.GRID_INTERCONNECT_MAX_KW)

                    immediate_cost = dt * (
                        grid_import * step.predicted_tariff
                        - grid_export * settings.FEED_IN_TARIFF
                        + (charge + discharge) * settings.BATTERY_DEGRADATION_COST_PER_KWH
                        + curtailment * settings.CURTAILMENT_PENALTY
                        + unserved * self.UNSERVED_LOAD_PENALTY_USD_PER_KWH
                    )
                    if mode == "FORCE_CHARGE":
                        charge_target = min(
                            settings.BATTERY_MAX_POWER_KW,
                            max(0.0, (max_soc - soc) / 100.0 * settings.BATTERY_CAPACITY_KWH / eta / dt),
                        )
                        immediate_cost += max(0.0, charge_target - charge) * 10.0 * dt
                    cost = immediate_cost + next_values[next_soc]
                    if cost < best_cost:
                        if unserved > 0.05:
                            action = "LOAD_NOT_SERVED"
                            rationale = f"Available battery and interconnection capacity leave {unserved:.1f} kW of forecast demand unmet."
                        elif mode == "ISLANDED":
                            action = "ISLAND_BATTERY_SUPPORT" if discharge else "ISLAND_SOLAR_CHARGE"
                            rationale = "Grid import/export disabled; dispatch keeps battery SoC within the configured envelope."
                        elif charge:
                            action = "OPTIMIZER_BATTERY_CHARGE"
                            rationale = "Horizon optimizer charges only when projected tariff and future demand justify it."
                        elif discharge:
                            action = "OPTIMIZER_BATTERY_DISCHARGE"
                            rationale = "Horizon optimizer discharges when avoided grid cost exceeds wear and terminal SoC cost."
                        else:
                            action = "OPTIMIZER_GRID_BALANCE"
                            rationale = "Horizon optimizer preserves battery energy when grid supply is the lower-cost option."
                        best_cost = cost
                        best_choice = (next_soc, action_kw, grid_import, grid_export, curtailment, unserved, immediate_cost, action, rationale)
                if best_choice is None:
                    raise RuntimeError(f"No feasible dispatch action at interval {index}, SoC {soc}%.")
                values[soc] = best_cost
                policies[index][soc] = best_choice
            next_values = values

        schedule: List[DispatchDecisionItem] = []
        soc = initial_state
        total_cost = total_baseline = total_carbon = total_curtailed = total_throughput = total_degradation = 0.0
        for index, step in enumerate(items):
            next_soc, action_kw, grid_import, grid_export, curtailment, unserved, step_cost, action, rationale = policies[index][soc]
            charge = float(max(action_kw, 0))
            discharge = float(max(-action_kw, 0))
            baseline = max(0.0, step.demand_p50_kw - step.solar_p50_kw) * step.predicted_tariff * dt
            baseline -= max(0.0, step.solar_p50_kw - step.demand_p50_kw) * settings.FEED_IN_TARIFF * dt
            savings = baseline - step_cost
            total_cost += step_cost
            total_baseline += baseline
            total_curtailed += curtailment * dt
            total_throughput += (charge + discharge) * dt
            total_degradation += (charge + discharge) * settings.BATTERY_DEGRADATION_COST_PER_KWH * dt
            total_carbon += min(step.demand_p50_kw, step.solar_p50_kw + discharge) * dt * 0.71
            schedule.append(DispatchDecisionItem(
                timestamp=step.timestamp,
                hour_offset=step.hour_offset,
                solar_kw=round(step.solar_p50_kw, 1),
                demand_kw=round(step.demand_p50_kw, 1),
                battery_charge_kw=charge,
                battery_discharge_kw=discharge,
                unserved_load_kw=round(unserved, 1),
                battery_soc_pct=float(next_soc),
                grid_import_kw=round(grid_import, 1),
                grid_export_kw=round(grid_export, 1),
                curtailment_kw=round(curtailment, 1),
                tariff_rate=step.predicted_tariff,
                step_cost_usd=round(step_cost, 2),
                baseline_cost_usd=round(baseline, 2),
                savings_usd=round(savings, 2),
                dispatch_action=action,
                action_rationale=rationale,
            ))
            soc = next_soc

        savings = total_baseline - total_cost
        return DispatchPlan(
            generated_at=datetime.now(timezone.utc),
            horizon_hours=forecast_response.horizon_hours,
            schedule=schedule,
            total_cost_usd=round(total_cost, 2),
            total_baseline_cost_usd=round(total_baseline, 2),
            total_savings_usd=round(savings, 2),
            savings_pct=round(savings / total_baseline * 100.0, 1) if total_baseline else 0.0,
            carbon_abated_kg=round(total_carbon, 1),
            curtailed_energy_kwh=round(total_curtailed, 1),
            battery_throughput_kwh=round(total_throughput, 1),
            battery_degradation_cost_usd=round(total_degradation, 2),
            microgrid_mode=mode,
            objective_status="DP_OPTIMAL_DISCRETE",
            solver_name="Dynamic programming (discrete horizon optimizer)",
            assumptions=self.assumptions,
        )


dynamic_programming_service = DynamicProgrammingService()
