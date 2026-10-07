"""Shared, repeatable inputs for the classroom simulation."""

from datetime import datetime, timedelta, timezone
from typing import Optional
LOCAL_ZONE = timezone(timedelta(hours=5, minutes=30), name="IST")


class DemoState:
    def __init__(self):
        self.time_base: Optional[datetime] = None
        self.time_set_at: Optional[datetime] = None
        self.cloud_cover_pct: Optional[float] = None
        self.temperature_c: Optional[float] = None
        self.facility_load_kw: Optional[float] = None

    def now(self) -> datetime:
        current = datetime.now(LOCAL_ZONE)
        if self.time_base is None or self.time_set_at is None:
            return current
        return self.time_base + (current - self.time_set_at)

    def configure(
        self,
        time_of_day: Optional[str],
        cloud_cover_pct: Optional[float],
        temperature_c: Optional[float],
        facility_load_kw: Optional[float],
    ) -> None:
        self.time_base = None
        self.time_set_at = None
        if time_of_day:
            current = datetime.now(LOCAL_ZONE)
            hour, minute = (int(value) for value in time_of_day.split(":"))
            self.time_base = current.replace(hour=hour, minute=minute, second=0, microsecond=0)
            self.time_set_at = current
        self.cloud_cover_pct = cloud_cover_pct
        self.temperature_c = temperature_c
        self.facility_load_kw = facility_load_kw

    def time_of_day(self) -> Optional[str]:
        return self.now().astimezone(LOCAL_ZONE).strftime("%H:%M") if self.time_base is not None else None


demo_state = DemoState()
