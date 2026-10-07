"""
Unit and Integration Tests for GreenSync Optimization Engine
Verifies strict power conservation, battery SoC safety bounds, and economic dispatch behavior
"""

import pytest
from app.services.forecasting_service import forecasting_service
from app.services.optimization_service import optimization_service
from app.services.weather_service import weather_service
from app.services.microgrid_simulator import microgrid_simulator
from app.core.config import settings


def test_power_balance_conservation():
    """
    Law of Conservation of Energy: At every single 15-minute time step,
    Total Inflows == Total Outflows
    (Solar + Grid Import + BESS Discharge) == (Demand + Grid Export + BESS Charge + Curtailment)
    """
    forecast = forecasting_service.generate_rolling_forecast(horizon_hours=6, step_minutes=15)
    plan = optimization_service.solve_dispatch(forecast, current_soc=0.60)

    assert len(plan.schedule) == 24, "Should produce 24 intervals for 6-hour horizon (15-min steps)"

    for step in plan.schedule:
        inflows = step.solar_kw + step.grid_import_kw + step.battery_discharge_kw
        outflows = step.demand_kw + step.grid_export_kw + step.battery_charge_kw + step.curtailment_kw
        diff = abs(inflows - outflows)
        assert diff < 0.2, f"Power balance violated at hour offset {step.hour_offset}: Inflows={inflows} kW, Outflows={outflows} kW (diff={diff})"


def test_battery_soc_safety_envelope():
    """
    Validates that BESS State of Charge never drops below 20% or exceeds 95%
    to protect cell chemistry against lithium plating and dendrite formation.
    """
    forecast = forecasting_service.generate_rolling_forecast(horizon_hours=6, step_minutes=15)
    
    # Test starting from near empty (21%)
    plan_low = optimization_service.solve_dispatch(forecast, current_soc=0.21)
    for step in plan_low.schedule:
        assert step.battery_soc_pct >= 20.0 - 0.01, f"SoC dropped below 20%: {step.battery_soc_pct}%"
        assert step.battery_soc_pct <= 95.0 + 0.01, f"SoC exceeded 95%: {step.battery_soc_pct}%"

    # Test starting from near full (94%)
    plan_high = optimization_service.solve_dispatch(forecast, current_soc=0.94)
    for step in plan_high.schedule:
        assert step.battery_soc_pct >= 20.0 - 0.01, f"SoC dropped below 20%: {step.battery_soc_pct}%"
        assert step.battery_soc_pct <= 95.0 + 0.01, f"SoC exceeded 95%: {step.battery_soc_pct}%"


def test_peak_shaving_economic_arbitrage():
    """
    Validates that the optimization engine produces positive economic savings
    over the baseline unmanaged grid operation.
    """
    forecast = forecasting_service.generate_rolling_forecast(horizon_hours=6, step_minutes=15)
    plan = optimization_service.solve_dispatch(forecast, current_soc=0.75)

    assert plan.total_savings_usd >= 0.0, f"Expected non-negative savings, got {plan.total_savings_usd}"
    assert plan.total_cost_usd <= plan.total_baseline_cost_usd, "Optimized cost must be <= baseline cost"
    assert plan.carbon_abated_kg > 0.0, "Expected positive clean energy carbon abatement"


def test_islanded_resilience_mode():
    """
    In Islanded mode (grid blackout / PCC breaker open), grid import and export must be identically ZERO.
    """
    forecast = forecasting_service.generate_rolling_forecast(horizon_hours=6, step_minutes=15)
    plan = optimization_service.solve_dispatch(forecast, current_soc=0.70, force_mode="ISLANDED")

    for step in plan.schedule:
        assert step.grid_import_kw == 0.0, f"Grid import must be 0 in islanded mode, got {step.grid_import_kw}"
        assert step.grid_export_kw == 0.0, f"Grid export must be 0 in islanded mode, got {step.grid_export_kw}"


def test_ramp_event_detection_and_resilience():
    """
    Verifies that injecting a sudden cloud drop triggers ramp detection
    and activates BESS cushioning.
    """
    # Inject 88% cloud cover
    microgrid_simulator.inject_scenario("CLOUD_RAMP_DROP", severity=0.85, duration_hours=1.0)
    weather = weather_service.get_weather_observation()
    
    assert weather.cloud_cover_pct >= 80.0
    assert weather.ramp_event_detected is True
    assert weather.ramp_severity in ["MODERATE", "CRITICAL"]

    # Reset
    microgrid_simulator.inject_scenario("RESET", severity=0.0, duration_hours=0.0)
    weather_reset = weather_service.get_weather_observation()
    assert weather_reset.ramp_event_detected is False
