"""
Weather Endpoints: Live weather observations, irradiance parameters, and cloud ramp detection
"""

from fastapi import APIRouter
from app.models.schemas import WeatherObservation
from app.services.weather_service import weather_service
from app.services.demo_state import demo_state

router = APIRouter()


@router.get("/current", response_model=WeatherObservation)
async def get_current_weather():
    """
    Returns live weather observations. Attempts OpenWeatherMap query first,
    falling back seamlessly to the clear-sky physics simulation engine.
    """
    if any(value is not None for value in (demo_state.cloud_cover_pct, demo_state.temperature_c)):
        weather_service.last_source = "SIMULATED"
        sim_obs = weather_service.get_weather_observation()
        weather_service.update_telemetry_snapshot(sim_obs)
        return sim_obs

    live_obs = await weather_service.fetch_live_openweather()
    if live_obs:
        weather_service.update_telemetry_snapshot(live_obs)
        return live_obs
    
    sim_obs = weather_service.get_weather_observation()
    weather_service.update_telemetry_snapshot(sim_obs)
    return sim_obs
