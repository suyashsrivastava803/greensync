# GreenSync: Microgrid Forecasting & Dispatch Demo

[![Standards: IEEE 1547-2018](https://img.shields.io/badge/Standard-IEEE%201547--2018-blue)](https://standards.ieee.org)
[![Controller: IEEE 2030.7](https://img.shields.io/badge/Microgrid-IEEE%202030.7-emerald)](https://standards.ieee.org)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://python.org)
[![Next.js: 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

> Student project demo for renewable energy and smart automation. Forecasts and dispatch outputs are simulated and intended for demonstration, not real-world control.

---

## ⚡ The Real-World Engineering Challenge

Renewable microgrids (commercial solar arrays, stationary battery energy storage systems, and critical facility loads) are prone to severe atmospheric and economic volatility:
1. **Cloud Ramp Transients**: Passing storm fronts or cloud cover can drop solar yield by up to 80% within 2–5 minutes. Without automated predictive dispatch, this leads to point-of-common-coupling (PCC) voltage sags, localized blackouts, or tripping of sensitive industrial machinery.
2. **Punitive Peak Utility Tariffs**: Industrial Time-of-Use (ToU) tariffs charge up to **3.5x to 4x** more for energy during peak evening hours (17:00–21:00) alongside expensive demand charges for peak kW spikes.
3. **Battery Degradation vs Economics**: Arbitrarily cycling batteries without modeling cell electrochemistry leads to premature capacity loss. Lithium-ion (LiFePO4) chemistries must operate strictly between safe State of Charge envelopes ($20\% \le SOC \le 95\%$) and account for throughput wear cost ($/kWh cycled).

**GreenSync** solves this with a **dual-engine architecture**:
- **A physics-informed rolling forecaster** that generates synthetic load and solar forecasts from diurnal curves, temperature, and a local weather model. An optional OpenWeatherMap key supplies current weather; there is no trained ML model or satellite feed in this repository.
- **A rule-based dispatch planner** that applies battery, tariff, and grid limits over a rolling horizon. The current implementation is a heuristic, not a linear-programming solver or a certified microgrid controller.

---

## 🏗️ System Architecture & Specs

```
                                      [ Simulated Weather / Optional API ]
                                                      │
                                                      ▼
[ Diurnal Load Curves ] ──────► [ Physics-Informed 6-Hour Forecaster ]
                                                      │
                                                      ▼
                                [ Rule-Based Dispatch Planner ]
                                  (Classroom Simulation)
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         [ Real-Time Switching Decisions ]                          [ SCADA Operator Control Center ]
   • Solar Self-Consumption                                    • Live Single-Line Diagram (SLD)
   • BESS Peak-Shaving Discharge                               • Animated Power Flow Vectors
   • Off-Peak Grid / Solar Storage                             • 6-Hour Horizon Interactive Chart
   • Clean Feed-In Export                                      • Interactive "What-If" Sandbox
   • Autonomous Islanding Support                              • Manual ANSI Breaker Overrides
```

### Microgrid Electrical Specification
- **Point of Common Coupling (PCC)**: 415V 3-Phase, 50 Hz Nominal Bus (200 kW Interconnect Limit)
- **Solar Photovoltaic Array**: 120 kWp Bifacial Monocrystalline Array ($NOCT = 45^\circ\text{C}$, $\gamma = -0.38\%/^\circ\text{C}$)
- **Battery Energy Storage System (BESS)**: 240 kWh LiFePO4 Commercial Rack (80 kW Max Inverter, 0.33C nominal)
- **Battery Safety Envelope**: $20\% \le SOC \le 95\%$ ($80\%$ Depth of Discharge DoD limit)
- **Facility Load Profile**: 30 kW base off-peak to 135 kW peak HVAC & motor manufacturing load

---

## 🧮 Mathematical Dispatch Formulation

The equations below describe the intended energy-balance model. The current rule-based planner approximates these decisions and does not solve this optimization problem or enforce every physical interlock.

At each 15-minute time step $t \in \{0, \dots, T-1\}$ over the 6-hour horizon ($\Delta t = 0.25 \, \text{h}$):

### Objective Function (Cost Minimization)
$$\min \sum_{t=0}^{T-1} \Delta t \cdot \left[ C_{\text{grid}}(t) P_{\text{grid\_imp}}(t) - C_{\text{export}} P_{\text{grid\_exp}}(t) + C_{\text{deg}} (P_{\text{bat\_chg}}(t) + P_{\text{bat\_dis}}(t)) + C_{\text{curtail}} P_{\text{curtail}}(t) \right]$$

### Constraints
1. **Strict Active Power Conservation**:
   $$P_{\text{solar}}(t) + P_{\text{grid\_imp}}(t) + P_{\text{bat\_dis}}(t) = P_{\text{demand}}(t) + P_{\text{grid\_exp}}(t) + P_{\text{bat\_chg}}(t) + P_{\text{curtail}}(t)$$
2. **State of Charge Dynamics**:
   $$SOC(t+1) = SOC(t) + \frac{\eta_{\text{chg}} \cdot P_{\text{bat\_chg}}(t) \cdot \Delta t}{E_{\text{cap}}} - \frac{P_{\text{bat\_dis}}(t) \cdot \Delta t}{\eta_{\text{dis}} \cdot E_{\text{cap}}}$$
3. **Safe Storage Bounds (IEEE 1547)**:
   $$SOC_{\min} \le SOC(t) \le SOC_{\max} \quad (0.20 \le SOC \le 0.95)$$
4. **Thermal & Inverter Power Bounds**:
   $$0 \le P_{\text{bat\_chg}}(t) \le P_{\text{bat\_max}}, \quad 0 \le P_{\text{bat\_dis}}(t) \le P_{\text{bat\_max}}$$
   $$0 \le P_{\text{grid\_imp}}(t) \le P_{\text{grid\_max}}, \quad 0 \le P_{\text{grid\_exp}}(t) \le P_{\text{grid\_max}}$$

---

## 🖥️ Live Operator Control Center (SCADA Features)

1. **Interactive Single-Line Diagram (SLD)**:
   - Live power flow animation traveling along conductors between Solar, BESS, Facility Load, and Substation Grid.
   - ANSI device protection breaker toggles: `52-PV` (Solar), `52-BESS` (Storage), and `52-GRID` (Main PCC).
2. **Rolling 6-Hour Horizon Chart**:
   - Plots demand forecast ($P_{50}$) with $P_{10}$–$P_{90}$ contingency envelopes.
   - Plots solar yield forecast alongside the dynamic Time-of-Use ($/kWh) step-tariff curve.
3. **Optimized Resource Dispatch Matrix**:
   - Tabular 24-interval dispatch schedule with switching choices and clear engineering rationales.
4. **BESS Telemetry & Cell Degradation**:
   - Radial SoC gauge, real-time C-rate (e.g. 0.32C), pack temperature, and wear cost tracker.
5. **Interactive "What-If" Scenario Sandbox**:
   - 🌩️ **Sudden 88% Cloud Front**: Injects cloud transient to test automated BESS ramp cushioning.
   - ⚡ **Grid Blackout (PCC Trip)**: Forces seamless autonomous islanded operation.
   - 🏭 **Industrial Load Surge (+130 kW)**: Tests peak shaving limits under heavy manufacturing starts.
   - 🔄 **Nominal Reset**: Restores standard steady-state.
6. **Economic & Carbon ROI**:
   - Instant dollar savings ($ and %) and carbon emissions abated ($kg\text{ CO}_2$) vs unmanaged grid baseline.

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Python**: 3.10 or newer
- **Node.js**: 20.9 or newer (required by the installed Next.js version)
- **PowerShell** or **Command Prompt** (Windows)

### 1-Click Launch (Recommended for Judges)
Simply run the launcher script from the root directory:

**Using PowerShell:**
```powershell
.\start-greensync.ps1
```

**Using Command Prompt:**
```cmd
start-greensync.bat
```

The script creates the backend virtual environment, installs Python requirements and (if needed) frontend packages from the lockfile, seeds the local SQLite telemetry database, builds the dashboard, starts both services, waits for health checks, and opens the dashboard. Startup logs and process IDs are written to `.run-logs/`. The local demo services run in the background after the launcher exits. The services bind to loopback for local use. Run `.\stop-greensync.ps1` when you finish; it stops only the saved GreenSync service processes.

---

### Manual Setup (Step-by-Step)

#### 1. Backend Setup (FastAPI)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Seed SCADA Database
python -m data.seed_scada_data

# Launch API Server
python run_backend.py
```
- REST API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/healthz](http://127.0.0.1:8000/healthz)

#### 2. Frontend Setup (Next.js)
```powershell
cd frontend
npm install
npm run dev
```
- Operator SCADA Dashboard: [http://localhost:3000](http://localhost:3000)
- Placement project overview: [http://localhost:3000/about](http://localhost:3000/about)

---

## 🧪 Unit Test Suite

Run the suite locally to check the dispatch simulator:

```powershell
cd backend
python -m pytest app/tests/test_optimizer.py -v
```

Coverage includes power balance, battery SoC bounds, economic behavior, islanded mode, and cloud scenario handling. Results depend on the current checkout and should be verified locally before presenting.

---

## 📁 Repository Structure

```
greensync/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── dispatch.py          # Dispatch schedule & switching recommendations
│   │   │   │   ├── forecast.py          # 6-hour rolling load & solar predictions
│   │   │   │   ├── telemetry.py         # Real-time SCADA bus parameters (V, Hz, kW)
│   │   │   │   ├── weather.py           # OpenWeather API & atmospheric model
│   │   │   │   ├── scenarios.py         # What-If scenario injection sandbox
│   │   │   │   └── scada.py             # Breaker overrides & operating modes
│   │   │   └── router.py                # Consolidated API v1 router
│   │   ├── core/
│   │   │   ├── config.py                # IEEE equipment ratings & ToU tariffs
│   │   │   └── database.py              # SQLite / PostgreSQL SQLAlchemy engine
│   │   ├── models/
│   │   │   ├── schemas.py               # Pydantic data contracts
│   │   │   └── db_models.py             # ORM tables for SCADA telemetry
│   │   ├── services/
│   │   │   ├── forecasting_service.py   # Synthetic physics-informed forecast
│   │   │   ├── optimization_service.py  # Rule-based dispatch planner
│   │   │   ├── weather_service.py       # Irradiance & cloud ramp rate detection
│   │   │   └── microgrid_simulator.py   # SCADA bus physics & breaker interlocks
│   │   ├── tests/
│   │   │   └── test_optimizer.py        # Dispatch simulation checks
│   │   └── main.py                      # FastAPI application entrypoint
│   ├── data/
│   │   └── seed_scada_data.py           # 30-day realistic historical SCADA seeder
│   ├── requirements.txt                 # Backend Python dependencies
│   ├── pytest.ini                       # Test runner configuration
│   └── run_backend.py                   # FastAPI server launcher
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root layout & SCADA dark theme
│   │   │   ├── page.tsx                 # Main Operator Monitoring Dashboard
│   │   │   ├── about/page.tsx           # Placement project overview and API guide
│   │   │   └── globals.css              # Industrial styling & power flow animations
│   │   ├── components/
│   │   │   ├── Header.tsx               # Substation status bar & bus telemetry
│   │   │   ├── MicrogridSLD.tsx         # Single-Line Diagram with animated SVG flows
│   │   │   ├── RollingForecastChart.tsx # 6-Hour rolling horizon forecast chart
│   │   │   ├── DispatchMatrix.tsx       # 24-Interval switching decision schedule
│   │   │   ├── BatteryHealthGauge.tsx   # Radial SoC gauge, C-rate, and cell wear
│   │   │   ├── WeatherRampAlert.tsx     # Pyranometer GHI & cloud transient alert
│   │   │   ├── WhatIfSimulator.tsx      # Before/after scenario explanations
│   │   │   ├── HistoryChart.tsx         # Persisted load, solar, SoC, and grid history
│   │   │   ├── SolverComparison.tsx     # Rule-based vs dynamic-programming dispatch
│   │   │   ├── DemoControls.tsx         # Repeatable clock, weather, SoC, and load inputs
│   │   │   ├── ReportExport.tsx         # Downloadable presentation report
│   │   │   ├── EconomicBreakdown.tsx    # ROI, cost savings, and CO2 abatement
│   │   │   └── SCADAControls.tsx        # Supervisory mode & breaker controls
│   │   └── lib/
│   │       ├── api.ts                   # REST client with live demo fallback
│   │       └── types.ts                 # TypeScript data contracts
│   ├── package.json
│   └── tsconfig.json
│
├── start-greensync.ps1                  # 1-Click PowerShell launcher
├── start-greensync.bat                  # 1-Click Windows batch launcher
└── README.md                            # Complete engineering documentation
```

---

## 🏆 Project Highlights

1. **Inspectable dispatch logic**: The backend calculates time-stepped dispatch recommendations with battery state, tariffs, grid limits, and estimated wear costs.
2. **Physics-informed forecast demo**: It combines synthetic diurnal load profiles with solar irradiance and temperature derating. Forecast quality metrics are illustrative constants, not measured training results.
3. **Operator dashboard**: The interface shows simulated telemetry, forecasts, dispatch, and what-if scenarios in one place.
4. **Offline-capable local demo**: The backend includes a weather simulator and the frontend has fallback display data when the API is unavailable. Fallback data is illustrative and does not reflect active backend controls.

## Project page and demo flow

The dashboard includes a placement overview at `/about` with the architecture, a short presenter walkthrough, setup instructions, limitations, and API reference. Key API routes include:

- `GET /api/v1/telemetry/status` — API and data-source status.
- `GET /api/v1/telemetry/history?hours=24` — seeded history and saved simulator snapshots (captured about once per minute while the dashboard is polling).
- `GET /api/v1/dispatch/compare?horizon_hours=6` — rule-based and dynamic-programming dispatch plans plus solver assumptions.
- `GET` and `PUT /api/v1/demo/controls` — read or set repeatable time, starting SoC, cloud cover, temperature, and facility load.
- `POST /api/v1/demo/reset` — restore standard simulator settings.
- `POST /api/v1/scenarios/inject` — apply a what-if event.

The generated report downloads as an HTML file that can be opened in a browser and printed or saved as PDF.

---

**Developed for Catalyst Hack 2026**
*GreenSync Engineering Team*

## Project scope and limitations

GreenSync is a classroom software simulation. It has no connection to physical inverters, breakers, SCADA equipment, or safety interlocks. Weather, load, telemetry, savings, carbon, and forecast confidence figures are simulated estimates. The forecast is a physics-informed synthetic model, not a trained ML model, and the dispatch planner is a heuristic rather than a linear-programming solver. Do not use the application to operate electrical equipment or present illustrative forecast metrics and savings as validated field results. The SQLite history seeder creates synthetic records; the live dashboard currently generates telemetry in memory rather than querying that history.
