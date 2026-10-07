export interface TelemetryPoint {
  timestamp: string;
  solar_output_kw: number;
  facility_load_kw: number;
  battery_soc_pct: number;
  battery_power_kw: number; // + for charging, - for discharging
  battery_temp_c: number;
  battery_soh_pct: number;
  grid_power_kw: number; // + for import, - for export
  bus_voltage_v: number;
  bus_frequency_hz: number;
  breaker_solar_status: "CLOSED" | "OPEN" | "TRIPPED";
  breaker_bess_status: "CLOSED" | "OPEN" | "TRIPPED";
  breaker_grid_status: "CLOSED" | "OPEN" | "TRIPPED";
  microgrid_mode: "OPTIMAL_AUTONOMOUS" | "ISLANDED" | "PEAK_SHAVING" | "FORCE_CHARGE";
  net_facility_load_kw: number;
}

export interface TelemetryHistoryPoint {
  timestamp: string;
  solar_output_kw: number;
  facility_load_kw: number;
  battery_soc_pct: number;
  grid_power_kw: number;
  battery_power_kw: number;
  source: "SEEDED_DEMO" | "LIVE_SIMULATION";
}

export interface DemoControls {
  time_of_day: string | null;
  starting_soc_pct: number;
  cloud_cover_pct: number | null;
  temperature_c: number | null;
  facility_load_kw: number | null;
  data_mode: "SIMULATED";
}

export interface WeatherObservation {
  timestamp: string;
  temperature_c: number;
  cloud_cover_pct: number;
  solar_irradiance_ghi: number;
  wind_speed_ms: number;
  condition: string;
  ramp_event_detected: boolean;
  ramp_severity: "NONE" | "MODERATE" | "CRITICAL";
  ramp_delta_ghi: number;
  is_live_api: boolean;
}

export interface ForecastHorizonItem {
  timestamp: string;
  hour_offset: number;
  demand_p10_kw: number;
  demand_p50_kw: number;
  demand_p90_kw: number;
  solar_p10_kw: number;
  solar_p50_kw: number;
  solar_p90_kw: number;
  cloud_cover_pct: number;
  solar_irradiance_ghi: number;
  predicted_tariff: number;
}

export interface RollingForecastResponse {
  generated_at: string;
  horizon_hours: number;
  resolution_minutes: number;
  forecast: ForecastHorizonItem[];
  model_version: string;
}

export interface DispatchDecisionItem {
  timestamp: string;
  hour_offset: number;
  solar_kw: number;
  demand_kw: number;
  battery_charge_kw: number;
  battery_discharge_kw: number;
  unserved_load_kw?: number;
  battery_soc_pct: number;
  grid_import_kw: number;
  grid_export_kw: number;
  curtailment_kw: number;
  tariff_rate: number;
  step_cost_usd: number;
  baseline_cost_usd: number;
  savings_usd: number;
  dispatch_action: string;
  action_rationale: string;
}

export interface DispatchPlan {
  generated_at: string;
  horizon_hours: number;
  schedule: DispatchDecisionItem[];
  total_cost_usd: number;
  total_baseline_cost_usd: number;
  total_savings_usd: number;
  savings_pct: number;
  carbon_abated_kg: number;
  curtailed_energy_kwh: number;
  battery_throughput_kwh: number;
  battery_degradation_cost_usd: number;
  microgrid_mode: string;
  objective_status: string;
  solver_name: string;
  assumptions: string[];
}

export interface DispatchComparison {
  heuristic: DispatchPlan;
  optimizer: DispatchPlan;
  assumptions: string[];
}

export interface ScenarioSummary {
  name: string;
  explanation: string;
  before: TelemetryPoint;
  after: TelemetryPoint;
  dispatch: DispatchPlan;
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  component: "SOLAR" | "BESS" | "GRID" | "INVERTER" | "EMS";
  message: string;
  acknowledged: boolean;
}
