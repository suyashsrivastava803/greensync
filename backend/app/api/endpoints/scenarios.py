"""
What-If Scenario Simulation Endpoints: Injects sudden cloud drops, outages, and load spikes
"""

from fastapi import APIRouter
from app.models.schemas import ScenarioInjectRequest
from app.services.microgrid_simulator import microgrid_simulator

router = APIRouter()


@router.post("/inject")
def inject_scenario(payload: ScenarioInjectRequest):
    """
    Injects a transient perturbation into the microgrid environment to test
    automated optimizer resilience and fast BESS switching.
    """
    message = microgrid_simulator.inject_scenario(
        scenario_type=payload.scenario_type,
        severity=payload.severity,
        duration_hours=payload.duration_hours
    )
    return {
        "status": "SCENARIO_APPLIED",
        "scenario": payload.scenario_type,
        "detail": message,
        "active_mode": microgrid_simulator.microgrid_mode
    }
