"""
Historical SCADA Telemetry Generator & Database Seeder
Seeds 30 days of realistic 15-minute resolution load, solar, and dispatch logs
"""

import math
import random
from datetime import datetime, timedelta, timezone
from app.core.database import SessionLocal, Base, engine, ensure_sqlite_schema
from app.models.db_models import TelemetryRecord, AlertRecord
from app.core.config import settings
from app.services.demo_state import LOCAL_ZONE


def seed_historical_scada():
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_schema()
    db = SessionLocal()

    existing_count = db.query(TelemetryRecord).count()
    if existing_count > 100:
        print(f"[i] SCADA database already contains {existing_count} records. Skipping seed.")
        db.close()
        return

    print("[*] Generating 30 days of historical SCADA time-series telemetry...")
    now = datetime.now(timezone.utc)
    start_time = now - timedelta(days=30)
    step = timedelta(minutes=15)
    current = start_time

    records = []
    current_soc = 65.0

    while current < now:
        local_time = current.astimezone(LOCAL_ZONE)
        hour = local_time.hour + local_time.minute / 60.0
        day_of_week = local_time.weekday()

        # Load profile
        is_weekday = day_of_week < 5
        base_load = 40.0 + (35.0 if is_weekday else 15.0) * math.exp(-0.5 * math.pow((hour - 14.0) / 4.0, 2))
        noise = random.uniform(-4.0, 4.0)
        facility_load = max(18.0, base_load + noise)

        # Solar profile (daylight 06:00 - 18:30)
        solar = 0.0
        if 6.0 <= hour <= 18.5:
            sin_peak = math.sin(math.radians((hour - 6.0) / 12.5 * 180.0))
            # Cloud variability
            cloud_factor = random.uniform(0.75, 1.0) if random.random() > 0.15 else random.uniform(0.15, 0.45)
            solar = max(0.0, settings.SOLAR_CAPACITY_KW * sin_peak * cloud_factor)

        # Battery & Grid balancing
        net = facility_load - solar
        tariff = settings.get_tariff_rate(current.hour)
        bat_power = 0.0
        grid_power = 0.0

        if net > 0:
            if tariff >= settings.PEAK_RATE and current_soc > 25.0:
                # Peak shaving discharge
                bat_power = -min(net, 60.0)
                grid_power = net + bat_power
                current_soc -= (abs(bat_power) * 0.25 / settings.BATTERY_CAPACITY_KWH) * 100.0
            else:
                grid_power = net
        else:
            surplus = abs(net)
            if current_soc < 92.0:
                bat_power = min(surplus, 50.0)
                grid_power = -(surplus - bat_power)
                current_soc += (bat_power * 0.25 / settings.BATTERY_CAPACITY_KWH) * 100.0
            else:
                grid_power = -surplus

        current_soc = max(20.0, min(95.0, current_soc))

        record = TelemetryRecord(
            timestamp=current,
            solar_output_kw=round(solar, 2),
            facility_load_kw=round(facility_load, 2),
            battery_soc_pct=round(current_soc, 2),
            battery_power_kw=round(bat_power, 2),
            battery_temp_c=round(25.0 + random.uniform(0.0, 5.0), 1),
            grid_power_kw=round(grid_power, 2),
            bus_voltage_v=round(415.0 + random.uniform(-2.5, 2.5), 1),
            bus_frequency_hz=round(50.0 + random.uniform(-0.04, 0.04), 2),
            microgrid_mode="OPTIMAL_AUTONOMOUS"
        )
        records.append(record)

        if len(records) >= 1000:
            db.bulk_save_objects(records)
            db.commit()
            records = []

        current += step

    if records:
        db.bulk_save_objects(records)
        db.commit()

    print(f"[+] Successfully seeded SCADA database with {db.query(TelemetryRecord).count()} records.")
    db.close()


if __name__ == "__main__":
    seed_historical_scada()
