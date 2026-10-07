"""
Forecasting Endpoints: Rolling 6-hour load and solar predictions with uncertainty quantiles
"""

from fastapi import APIRouter, Query
from app.models.schemas import RollingForecastResponse
from app.services.forecasting_service import forecasting_service

router = APIRouter()


@router.get("/rolling", response_model=RollingForecastResponse)
def get_rolling_forecast(
    horizon_hours: int = Query(6, ge=1, le=24, description="Forecast horizon in hours"),
    step_minutes: int = Query(15, ge=5, le=60, description="Step resolution in minutes")
):
    """
    Computes rolling load demand and solar generation forecast
    using multivariate diurnal time-series regression and atmospheric solar physics.
    """
    return forecasting_service.generate_rolling_forecast(
        horizon_hours=horizon_hours,
        step_minutes=step_minutes
    )
