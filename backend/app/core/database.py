"""
Database session and connection management for GreenSync SCADA
Supports SQLite for rapid offline development & PostgreSQL for production
"""

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_sqlite_schema():
    """Apply additive SQLite changes that SQLAlchemy create_all does not migrate."""
    if engine.dialect.name != "sqlite" or not inspect(engine).has_table("telemetry_records"):
        return
    columns = {column["name"] for column in inspect(engine).get_columns("telemetry_records")}
    if "source" not in columns:
        with engine.begin() as connection:
            connection.exec_driver_sql(
                "ALTER TABLE telemetry_records ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'SEEDED_DEMO'"
            )


def get_db():
    """FastAPI dependency for yielding database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
