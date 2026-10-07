"""
GreenSync Microgrid Energy Management System (EMS) Configuration
GreenSync classroom microgrid simulation configuration
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "GreenSync Microgrid EMS"
    VERSION: str = "1.0.0-catalyst"
    API_V1_STR: str = "/api/v1"
    
    # Database Configuration (SQLite default with PostgreSQL pluggable)
    DATABASE_URL: str = "sqlite:///./greensync_scada.db"
    
    # Weather Integration
    OPENWEATHER_API_KEY: str = Field(default="", description="OpenWeatherMap API Key (optional, defaults to physics model)")
    MICROGRID_LATITUDE: float = 28.6139
    MICROGRID_LONGITUDE: float = 77.2090
    MICROGRID_ALTITUDE_M: float = 216.0
    MICROGRID_NAME: str = "Catalyst North Campus Substation Microgrid #04"
    
    # Asset Specifications (IEEE 1547 Interconnection Standards)
    SOLAR_CAPACITY_KW: float = 120.0            # 120 kWp Bifacial Monocrystalline Solar PV
    BATTERY_CAPACITY_KWH: float = 240.0         # 240 kWh LiFePO4 Commercial Battery Pack
    BATTERY_MAX_POWER_KW: float = 80.0          # Max charge/discharge rate (0.33C nominal)
    BATTERY_MIN_SOC: float = 0.20               # 20% minimum reserve (DoD 80%)
    BATTERY_MAX_SOC: float = 0.95               # 95% maximum safe charge limit
    BATTERY_ROUNDTRIP_EFFICIENCY: float = 0.92  # 92% combined inverter/cell round-trip
    BATTERY_DEGRADATION_COST_PER_KWH: float = 0.035 # Estimated wear & tear per throughput kWh
    
    GRID_INTERCONNECT_MAX_KW: float = 200.0     # Maximum allowable point-of-common-coupling (PCC) import/export
    NOMINAL_BUS_VOLTAGE_V: float = 415.0        # 415V 3-phase industrial bus
    NOMINAL_FREQUENCY_HZ: float = 50.0          # 50 Hz grid frequency
    
    # Dynamic Time-of-Use (ToU) Tariffs ($/kWh)
    OFF_PEAK_RATE: float = 0.085    # 23:00 - 07:00
    STANDARD_RATE: float = 0.175    # 07:00 - 17:00 & 21:00 - 23:00
    PEAK_RATE: float = 0.340        # 17:00 - 21:00 (Evening stress hours)
    FEED_IN_TARIFF: float = 0.070   # Utility buyback rate for excess clean export
    CURTAILMENT_PENALTY: float = 0.025 # Penalty for spilling renewable generation
    
    # Rolling Forecasting Window
    FORECAST_HORIZON_HOURS: int = 6
    TIMESTEP_MINUTES: int = 15
    
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

    def get_tariff_rate(self, hour: int) -> float:
        """Determines Time-of-Use tariff for a given hour of day (0-23)."""
        if 17 <= hour < 21:
            return self.PEAK_RATE
        elif 7 <= hour < 17 or 21 <= hour < 23:
            return self.STANDARD_RATE
        else:
            return self.OFF_PEAK_RATE


settings = Settings()
