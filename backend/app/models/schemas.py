"""
Pydantic Data Contracts & Schemas for GreenSync SCADA
Designed for IEEE 2030.7 microgrid controller interoperability
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class WeatherObservation(BaseModel):
    timestamp: datetime
    temperature_c: float = Field(..., description="Ambient temperature in Celsius")
    cloud_cover_pct: float = Field(..., description="Cloud coverage percentage [0-100%]")
    solar_irradiance_ghi: float = Field(..., description="Global Horizontal Irradiance in W/m²")
    wind_speed_ms: float = Field(..., description="Wind speed in m/s")
    condition: str = Field(..., description="Weather summary description")
    ramp_event_detected: bool = Field(False, description="True if sudden cloud transient is occurring")
    ramp_severity: str = Field("NONE", description="NONE | MODERATE | CRITICAL")
    ramp_delta_ghi: float = Field(0.0, description="Rate of GHI drop in W/m²/minute")
    is_live_api: bool = Field(False, description="True if derived from live OpenWeatherMap API")


class TelemetryPoint(BaseModel):
    timestamp: datetime
    solar_output_kw: float
    facility_load_kw: float
    battery_soc_pct: float = Field(..., description="State of Charge percentage [20-95%]")
    battery_power_kw: float = Field(..., description="+ for charging, - for discharging")
    battery_temp_c: float
    battery_soh_pct: float = Field(98.5, description="State of Health %")
    grid_power_kw: float = Field(..., description="+ for import, - for export")
    bus_voltage_v: float
    bus_frequency_hz: float
    breaker_solar_status: str = Field("CLOSED", description="CLOSED | OPEN | TRIPPED")
    breaker_bess_status: str = Field("CLOSED", description="CLOSED | OPEN | TRIPPED")
    breaker_grid_status: str = Field("CLOSED", description="CLOSED | OPEN | TRIPPED")
    microgrid_mode: str = Field("OPTIMAL_AUTONOMOUS", description="OPTIMAL_AUTONOMOUS | ISLANDED | PEAK_SHAVING | FORCE_CHARGE")
    net_facility_load_kw: float = Field(..., description="Load after direct solar offset")


class TelemetryHistoryPoint(BaseModel):
    timestamp: datetime
    solar_output_kw: float
    facility_load_kw: float
    battery_soc_pct: float
    grid_power_kw: float
    battery_power_kw: float
    source: str


class DemoControlsRequest(BaseModel):
    time_of_day: Optional[str] = Field(None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    starting_soc_pct: Optional[float] = Field(None, ge=20, le=95)
    cloud_cover_pct: Optional[float] = Field(None, ge=0, le=100)
    temperature_c: Optional[float] = Field(None, ge=-20, le=60)
    facility_load_kw: Optional[float] = Field(None, ge=0, le=200)


class DemoControlsResponse(BaseModel):
    time_of_day: Optional[str]
    starting_soc_pct: float
    cloud_cover_pct: Optional[float]
    temperature_c: Optional[float]
    facility_load_kw: Optional[float]
    data_mode: str = "SIMULATED"


class ForecastHorizonItem(BaseModel):
    timestamp: datetime
    hour_offset: float
    demand_p10_kw: float
    demand_p50_kw: float
    demand_p90_kw: float
    solar_p10_kw: float
    solar_p50_kw: float
    solar_p90_kw: float
    cloud_cover_pct: float
    solar_irradiance_ghi: float
    predicted_tariff: float


class RollingForecastResponse(BaseModel):
    generated_at: datetime
    horizon_hours: int
    resolution_minutes: int
    forecast: List[ForecastHorizonItem]
    model_version: str = "Physics-Diurnal-v1"


class DispatchDecisionItem(BaseModel):
    timestamp: datetime
    hour_offset: float
    solar_kw: float
    demand_kw: float
    battery_charge_kw: float
    battery_discharge_kw: float
    unserved_load_kw: float = 0.0
    battery_soc_pct: float
    grid_import_kw: float
    grid_export_kw: float
    curtailment_kw: float
    tariff_rate: float
    step_cost_usd: float
    baseline_cost_usd: float
    savings_usd: float
    dispatch_action: str
    action_rationale: str


class DispatchPlan(BaseModel):
    generated_at: datetime
    horizon_hours: int
    schedule: List[DispatchDecisionItem]
    total_cost_usd: float
    total_baseline_cost_usd: float
    total_savings_usd: float
    savings_pct: float
    carbon_abated_kg: float
    curtailed_energy_kwh: float
    battery_throughput_kwh: float
    battery_degradation_cost_usd: float
    microgrid_mode: str
    objective_status: str = "OPTIMAL_SOLVED"
    solver_name: str = "Rule-based dispatch"
    assumptions: List[str] = Field(default_factory=list)


class DispatchComparisonResponse(BaseModel):
    heuristic: DispatchPlan
    optimizer: DispatchPlan
    assumptions: List[str]


class ScenarioInjectRequest(BaseModel):
    scenario_type: str = Field(
        ..., 
        description="CLOUD_RAMP_DROP | GRID_INTERRUPTION | DEMAND_SURGE | TARIFF_SPIKE | RESET"
    )
    severity: float = Field(0.8, description="Severity factor from 0.0 to 1.0")
    duration_hours: float = Field(2.0, description="Duration of scenario in hours")


class ScadaControlRequest(BaseModel):
    mode: Optional[str] = Field(None, description="OPTIMAL_AUTONOMOUS | ISLANDED | PEAK_SHAVING | FORCE_CHARGE")
    force_charge_kw: Optional[float] = None
    breaker_solar: Optional[str] = None
    breaker_bess: Optional[str] = None
    breaker_grid: Optional[str] = None


class SystemAlert(BaseModel):
    id: str
    timestamp: datetime
    severity: str = Field(..., description="INFO | WARNING | CRITICAL")
    component: str = Field(..., description="SOLAR | BESS | GRID | INVERTER | EMS")
    message: str
    acknowledged: bool = False
