"""
Telemetry Endpoints: Live microgrid sensor feeds, bus parameters, and recent telemetry history
"""

import time
import logging
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import TelemetryRecord
from app.models.schemas import TelemetryPoint, TelemetryHistoryPoint, SystemAlert
from app.services.microgrid_simulator import microgrid_simulator
from app.services.demo_state import demo_state
from app.services.weather_service import weather_service

router = APIRouter()
logger = logging.getLogger(__name__)
_last_persisted_at = 0.0


@router.get("/live", response_model=TelemetryPoint)
def get_live_telemetry(db: Session = Depends(get_db)):
    """Returns instant SCADA telemetry from microgrid bus sensors."""
    global _last_persisted_at
    point = microgrid_simulator.get_live_telemetry()
    now_monotonic = time.monotonic()
    if now_monotonic - _last_persisted_at >= 60:
        db.add(TelemetryRecord(
            timestamp=point.timestamp.astimezone(timezone.utc).replace(tzinfo=None),
            solar_output_kw=point.solar_output_kw,
            facility_load_kw=point.facility_load_kw,
            battery_soc_pct=point.battery_soc_pct,
            battery_power_kw=point.battery_power_kw,
            battery_temp_c=point.battery_temp_c,
            grid_power_kw=point.grid_power_kw,
            bus_voltage_v=point.bus_voltage_v,
            bus_frequency_hz=point.bus_frequency_hz,
            microgrid_mode=point.microgrid_mode,
            source="LIVE_SIMULATION",
        ))
        try:
            db.commit()
            _last_persisted_at = now_monotonic
        except Exception:
            db.rollback()
            logger.exception("Unable to persist a live simulation telemetry sample")
    return point


@router.get("/history", response_model=List[TelemetryHistoryPoint])
def get_telemetry_history(
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(1200, ge=10, le=5000),
    db: Session = Depends(get_db),
):
    """Returns seeded and live-simulation readings for the selected time range."""
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=hours)
    rows = (
        db.query(TelemetryRecord)
        .filter(TelemetryRecord.timestamp >= cutoff)
        .order_by(TelemetryRecord.timestamp.desc())
        .limit(limit)
        .all()
    )
    rows.reverse()
    return [
        TelemetryHistoryPoint(
            timestamp=row.timestamp.replace(tzinfo=timezone.utc),
            solar_output_kw=row.solar_output_kw,
            facility_load_kw=row.facility_load_kw,
            battery_soc_pct=row.battery_soc_pct,
            grid_power_kw=row.grid_power_kw,
            battery_power_kw=row.battery_power_kw,
            source=row.source,
        )
        for row in rows
    ]


@router.get("/alerts", response_model=List[SystemAlert])
def get_system_alerts():
    """Returns active SCADA alarm log."""
    return microgrid_simulator.alerts[-15:] # Most recent 15 alerts


@router.get("/status")
def get_data_status():
    return {
        "api": "connected",
        "telemetry_source": "SIMULATED",
        "weather_source": weather_service.last_source,
        "last_updated": demo_state.now(),
    }
