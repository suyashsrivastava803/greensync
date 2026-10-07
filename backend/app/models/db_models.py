"""
SQLAlchemy ORM models for GreenSync SCADA logging and audit trail
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, JSON
from app.core.database import Base


class TelemetryRecord(Base):
    __tablename__ = "telemetry_records"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    solar_output_kw = Column(Float, nullable=False)
    facility_load_kw = Column(Float, nullable=False)
    battery_soc_pct = Column(Float, nullable=False)
    battery_power_kw = Column(Float, nullable=False)
    battery_temp_c = Column(Float, default=26.5)
    grid_power_kw = Column(Float, nullable=False)
    bus_voltage_v = Column(Float, default=415.0)
    bus_frequency_hz = Column(Float, default=50.0)
    microgrid_mode = Column(String(50), default="OPTIMAL_AUTONOMOUS")
    source = Column(String(32), nullable=False, default="SEEDED_DEMO")


class DispatchLogRecord(Base):
    __tablename__ = "dispatch_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    horizon_hours = Column(Integer, default=6)
    total_cost_usd = Column(Float)
    total_savings_usd = Column(Float)
    carbon_abated_kg = Column(Float)
    schedule_json = Column(JSON)
    mode = Column(String(50))


class AlertRecord(Base):
    __tablename__ = "system_alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    severity = Column(String(20)) # INFO, WARNING, CRITICAL
    component = Column(String(50))
    message = Column(String(255))
    acknowledged = Column(Boolean, default=False)
