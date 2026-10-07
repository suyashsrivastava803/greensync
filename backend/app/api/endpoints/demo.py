"""Repeatable presenter controls for the in-memory microgrid simulation."""

from fastapi import APIRouter
from app.models.schemas import DemoControlsRequest, DemoControlsResponse
from app.services.demo_state import demo_state
from app.services.microgrid_simulator import microgrid_simulator
from app.services.optimization_service import optimization_service

router = APIRouter()


def get_controls() -> DemoControlsResponse:
    return DemoControlsResponse(
        time_of_day=demo_state.time_of_day(),
        starting_soc_pct=round(microgrid_simulator.battery_soc_pct, 1),
        cloud_cover_pct=demo_state.cloud_cover_pct,
        temperature_c=demo_state.temperature_c,
        facility_load_kw=demo_state.facility_load_kw,
    )


@router.get("/controls", response_model=DemoControlsResponse)
def read_demo_controls():
    return get_controls()


@router.put("/controls", response_model=DemoControlsResponse)
def update_demo_controls(payload: DemoControlsRequest):
    demo_state.configure(
        time_of_day=payload.time_of_day,
        cloud_cover_pct=payload.cloud_cover_pct,
        temperature_c=payload.temperature_c,
        facility_load_kw=payload.facility_load_kw,
    )
    if payload.starting_soc_pct is not None:
        microgrid_simulator.battery_soc_pct = payload.starting_soc_pct
        optimization_service.update_current_soc(payload.starting_soc_pct / 100.0)
    else:
        optimization_service.update_current_soc(microgrid_simulator.battery_soc_pct / 100.0)
    microgrid_simulator.reset_telemetry_clock()
    return get_controls()


@router.post("/reset", response_model=DemoControlsResponse)
def reset_demo_controls():
    microgrid_simulator.inject_scenario("RESET", severity=0.0, duration_hours=0.0)
    return get_controls()
