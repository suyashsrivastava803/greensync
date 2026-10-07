"""
Weather Service: OpenWeatherMap Integration & Physics-Based Solar Irradiance Engine
Compliant with Haurwitz Clear-Sky & Perez Cloud Attenuation Models
"""

import math
from datetime import datetime, timezone
from typing import Optional, Tuple
import httpx
from app.core.config import settings
from app.services.demo_state import demo_state
from app.models.schemas import WeatherObservation


class WeatherService:
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
        self.lat = settings.MICROGRID_LATITUDE
        self.lon = settings.MICROGRID_LONGITUDE
        self.previous_ghi = 750.0
        self.previous_timestamp = datetime.now(timezone.utc)
        self.active_cloud_override: Optional[float] = None
        self.override_expiry: Optional[datetime] = None
        self.last_source = "SIMULATED"

    def set_cloud_override(self, cloud_pct: float, duration_hours: float):
        """Allows SCADA 'What-If' simulation to inject sudden cloud events."""
        self.active_cloud_override = max(0.0, min(100.0, cloud_pct))
        self.override_expiry = datetime.now(timezone.utc).timestamp() + (duration_hours * 3600)

    def clear_override(self):
        self.active_cloud_override = None
        self.override_expiry = None
        self.previous_ghi = None

    def _calculate_solar_elevation(self, dt: datetime) -> float:
        """
        Calculates solar elevation angle in degrees for the microgrid location.
        """
        hour = dt.hour + (dt.minute / 60.0) + (dt.second / 3600.0)
        # Approximate solar noon at 12:30 PM local
        hour_angle = (hour - 12.5) * 15.0  # degrees
        
        # Approximate solar declination for spring/autumn equinox baseline
        day_of_year = dt.timetuple().tm_yday
        declination = 23.45 * math.sin(math.radians(360 / 365 * (284 + day_of_year)))
        
        lat_rad = math.radians(self.lat)
        dec_rad = math.radians(declination)
        ha_rad = math.radians(hour_angle)
        
        sin_elevation = (math.sin(lat_rad) * math.sin(dec_rad)) + \
                        (math.cos(lat_rad) * math.cos(dec_rad) * math.cos(ha_rad))
        
        elevation = math.degrees(math.asin(max(-1.0, min(1.0, sin_elevation))))
        return elevation

    def calculate_clear_sky_ghi(self, elevation_deg: float) -> float:
        """
        Estimates Global Horizontal Irradiance (GHI) in W/m² under clear sky.
        Haurwitz atmospheric formulation.
        """
        if elevation_deg <= 0.5:
            return 0.0
        sin_elev = math.sin(math.radians(elevation_deg))
        # Clear sky irradiance (nominal 1098 W/m² peak at zenith with air mass extinction)
        ghi = 1098.0 * sin_elev * math.exp(-0.057 / sin_elev)
        return max(0.0, ghi)

    def apply_cloud_attenuation(self, clear_sky_ghi: float, cloud_cover_pct: float) -> float:
        """
        Cloud transmission attenuation: GHI = GHI_clear * (1 - 0.75 * (cloud_fraction)^3.4)
        """
        if clear_sky_ghi <= 0:
            return 0.0
        cf = cloud_cover_pct / 100.0
        transmittance = 1.0 - (0.75 * math.pow(cf, 3.4))
        # Diffuse component always provides at least 8% ambient diffuse light even under deep overcast
        transmittance = max(0.08, transmittance)
        return clear_sky_ghi * transmittance

    async def fetch_live_openweather(self) -> Optional[WeatherObservation]:
        """Queries OpenWeatherMap API if a key is provided."""
        if not self.api_key:
            self.last_source = "SIMULATED"
            return None

        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": self.lat,
            "lon": self.lon,
            "appid": self.api_key,
            "units": "metric"
        }
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    now = demo_state.now()
                    temp_c = data.get("main", {}).get("temp", 28.0)
                    clouds = float(data.get("clouds", {}).get("all", 20.0))
                    wind_speed = float(data.get("wind", {}).get("speed", 3.2))
                    weather_desc = data.get("weather", [{}])[0].get("description", "Clear").title()

                    elev = self._calculate_solar_elevation(now)
                    clear_ghi = self.calculate_clear_sky_ghi(elev)
                    ghi = self.apply_cloud_attenuation(clear_ghi, clouds)
                    
                    self.last_source = "CONNECTED"
                    return WeatherObservation(
                        timestamp=now,
                        temperature_c=round(temp_c, 1),
                        cloud_cover_pct=round(clouds, 1),
                        solar_irradiance_ghi=round(ghi, 1),
                        wind_speed_ms=round(wind_speed, 1),
                        condition=weather_desc,
                        ramp_event_detected=False,
                        ramp_severity="NONE",
                        ramp_delta_ghi=0.0,
                        is_live_api=True
                    )
        except Exception:
            self.last_source = "SIMULATED"
        return None

    def get_weather_observation(self, target_dt: Optional[datetime] = None) -> WeatherObservation:
        """
        Retrieves weather observation. Falls back gracefully to the physics engine
        if no live API key is present or if offline.
        """
        now = target_dt or demo_state.now()
        hour = now.hour + (now.minute / 60.0)
        
        # Diurnal temperature curve (peaking at 14:30)
        base_temp = 25.0 + 8.0 * math.sin(math.radians((hour - 8.0) / 16.0 * 180.0 if 6 <= hour <= 20 else -30))
        if demo_state.temperature_c is not None:
            base_temp = demo_state.temperature_c
        
        # Base cloud cover cycle (mild diurnal cloud formation around midday)
        base_clouds = 18.0 + 12.0 * math.sin(math.radians(hour * 15.0))
        base_clouds = max(5.0, min(85.0, base_clouds))

        # Check for active operator simulation override
        if demo_state.cloud_cover_pct is not None:
            cloud_cover = demo_state.cloud_cover_pct
        elif self.override_expiry and datetime.now(timezone.utc).timestamp() < self.override_expiry:
            cloud_cover = self.active_cloud_override or base_clouds
        else:
            cloud_cover = base_clouds

        elev = self._calculate_solar_elevation(now)
        clear_ghi = self.calculate_clear_sky_ghi(elev)
        ghi = self.apply_cloud_attenuation(clear_ghi, cloud_cover)

        # Ramp rate calculation (W/m² per minute)
        if self.previous_ghi is None:
            delta_ghi_per_min = 0.0
        else:
            dt_seconds = max(5.0, (now - self.previous_timestamp).total_seconds())
            delta_ghi_per_min = (ghi - self.previous_ghi) / (dt_seconds / 60.0)

        ramp_detected = False
        severity = "NONE"
        
        # Cloud ramp event triggered if irradiance drops sharply (>15 W/m²/min) or heavy cloud transient override
        if (self.active_cloud_override and self.active_cloud_override >= 70.0) or delta_ghi_per_min < -15.0:
            ramp_detected = True
            severity = "CRITICAL" if ((self.active_cloud_override and self.active_cloud_override >= 80.0) or delta_ghi_per_min < -30.0) else "MODERATE"

        cond = "Sunny & Clear"
        if cloud_cover > 75:
            cond = "Overcast / Heavy Front"
        elif cloud_cover > 45:
            cond = "Scattered Clouds"
        elif cloud_cover > 20:
            cond = "Partly Cloudy"

        return WeatherObservation(
            timestamp=now,
            temperature_c=round(base_temp, 1),
            cloud_cover_pct=round(cloud_cover, 1),
            solar_irradiance_ghi=round(ghi, 1),
            wind_speed_ms=round(3.4 + 1.2 * math.sin(hour), 1),
            condition=cond,
            ramp_event_detected=ramp_detected,
            ramp_severity=severity,
            ramp_delta_ghi=round(delta_ghi_per_min, 1),
            is_live_api=False
        )

    def update_telemetry_snapshot(self, obs: WeatherObservation):
        self.previous_ghi = obs.solar_irradiance_ghi
        self.previous_timestamp = obs.timestamp


weather_service = WeatherService()
