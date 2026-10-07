"""
API v1 Router aggregation
"""

from fastapi import APIRouter
from app.api.endpoints import telemetry, forecast, dispatch, weather, scenarios, scada, demo

api_router = APIRouter()

api_router.include_router(telemetry.router, prefix="/telemetry", tags=["SCADA Telemetry"])
api_router.include_router(forecast.router, prefix="/forecast", tags=["Synthetic Forecasting"])
api_router.include_router(dispatch.router, prefix="/dispatch", tags=["Dispatch Optimization"])
api_router.include_router(weather.router, prefix="/weather", tags=["Weather & Irradiance"])
api_router.include_router(scenarios.router, prefix="/scenarios", tags=["What-If Scenarios"])
api_router.include_router(scada.router, prefix="/scada", tags=["SCADA Supervisory Controls"])
api_router.include_router(demo.router, prefix="/demo", tags=["Repeatable Demo Controls"])
