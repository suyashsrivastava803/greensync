"""
SCADA Manual Control Endpoints: Breaker overrides and microgrid operating mode selection
"""

from fastapi import APIRouter
from app.models.schemas import ScadaControlRequest
from app.services.microgrid_simulator import microgrid_simulator

router = APIRouter()


@router.post("/control")
def update_scada_controls(request: ScadaControlRequest):
    """
    Executes operator supervisory overrides for breakers and operating modes.
    """
    microgrid_simulator.update_controls(
        mode=request.mode,
        breaker_solar=request.breaker_solar,
        breaker_bess=request.breaker_bess,
        breaker_grid=request.breaker_grid
    )
    return {
        "status": "COMMAND_EXECUTED",
        "current_mode": microgrid_simulator.microgrid_mode,
        "breaker_solar": microgrid_simulator.breaker_solar,
        "breaker_bess": microgrid_simulator.breaker_bess,
        "breaker_grid": microgrid_simulator.breaker_grid
    }
