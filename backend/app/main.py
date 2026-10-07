"""
GreenSync: Microgrid Energy Demand Forecaster & Dispatch Optimizer
FastAPI Application Entrypoint
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, ensure_sqlite_schema
from app.api.router import api_router
from app.models import db_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite/PostgreSQL tables on startup
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_schema()
    print("=" * 65)
    print(f"[*] {settings.PROJECT_NAME} (v{settings.VERSION}) Initialized")
    print("[*] GreenSync simulation engine online (not connected to electrical equipment)")
    print(f"[*] Point of Common Coupling: {settings.MICROGRID_NAME}")
    print(f"[*] Solar Asset: {settings.SOLAR_CAPACITY_KW} kWp | BESS: {settings.BATTERY_CAPACITY_KWH} kWh")
    print("=" * 65)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Classroom microgrid forecast and dispatch simulation with an optional discrete optimizer",
    lifespan=lifespan
)

# Enable CORS for Next.js operator control center
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root_status():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "standards": ["IEEE 1547-2018", "IEEE 2030.7-2017"],
        "docs_url": "/docs"
    }


@app.get("/healthz")
def health_check():
    return {"status": "healthy"}
