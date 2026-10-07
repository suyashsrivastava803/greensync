"""
Dispatch Planning Endpoints: Rule-based schedule & switching recommendations
"""

from typing import Optional
from fastapi import APIRouter, Query
from app.models.schemas import DispatchPlan, DispatchComparisonResponse
from app.services.forecasting_service import forecasting_service
from app.services.optimization_service import optimization_service
from app.services.microgrid_simulator import microgrid_simulator
from app.services.dynamic_programming_service import dynamic_programming_service

router = APIRouter()


@router.get("/schedule", response_model=DispatchPlan)
def get_optimal_dispatch_schedule(
    horizon_hours: int = Query(6, ge=1, le=24),
    step_minutes: int = Query(15, ge=5, le=60),
    override_mode: Optional[str] = Query(None, description="Force temporary operating mode")
):
    """
    Solves multi-period constrained economic dispatch for solar, BESS, and grid interconnection.
    Outputs step-by-step dispatch actions and financial ROI metrics.
    """
    forecast = forecasting_service.generate_rolling_forecast(
        horizon_hours=horizon_hours,
        step_minutes=step_minutes
    )
    
    plan = optimization_service.solve_dispatch(
        forecast_response=forecast,
        current_soc=microgrid_simulator.battery_soc_pct / 100.0,
        force_mode=override_mode or microgrid_simulator.microgrid_mode
    )
    return plan


@router.get("/compare", response_model=DispatchComparisonResponse)
def compare_dispatch_methods(
    horizon_hours: int = Query(6, ge=1, le=24),
    step_minutes: int = Query(15, ge=5, le=60),
):
    """Compare the existing heuristic to a discrete horizon optimizer."""
    forecast = forecasting_service.generate_rolling_forecast(
        horizon_hours=horizon_hours,
        step_minutes=step_minutes,
    )
    current_soc = microgrid_simulator.battery_soc_pct / 100.0
    mode = microgrid_simulator.microgrid_mode
    heuristic = optimization_service.solve_dispatch(
        forecast_response=forecast,
        current_soc=current_soc,
        force_mode=mode,
    )
    optimizer = dynamic_programming_service.solve(
        forecast_response=forecast,
        current_soc=current_soc,
        mode=mode,
    )
    return DispatchComparisonResponse(
        heuristic=heuristic,
        optimizer=optimizer,
        assumptions=dynamic_programming_service.assumptions,
    )
