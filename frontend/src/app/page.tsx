"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowDownRight, Leaf, Sparkles } from "lucide-react";
import { Header } from "../components/Header";
import { MicrogridSLD } from "../components/MicrogridSLD";
import { RollingForecastChart } from "../components/RollingForecastChart";
import { DispatchMatrix } from "../components/DispatchMatrix";
import { BatteryHealthGauge } from "../components/BatteryHealthGauge";
import { WeatherRampAlert } from "../components/WeatherRampAlert";
import { WhatIfSimulator } from "../components/WhatIfSimulator";
import { EconomicBreakdown } from "../components/EconomicBreakdown";
import { SCADAControls } from "../components/SCADAControls";
import { HistoryChart } from "../components/HistoryChart";
import { SolverComparison } from "../components/SolverComparison";
import { DemoControlsPanel } from "../components/DemoControls";
import { ReportExport } from "../components/ReportExport";
import {
  fetchLiveTelemetry,
  fetchWeather,
  fetchForecast,
  fetchDispatchSchedule,
  fetchSystemAlerts,
  checkBackendAvailability,
  updateScadaControl,
} from "../lib/api";
import {
  TelemetryPoint,
  WeatherObservation,
  RollingForecastResponse,
  DispatchPlan,
  SystemAlert,
  ScenarioSummary,
} from "../lib/types";

export default function OperatorDashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryPoint | null>(null);
  const [weather, setWeather] = useState<WeatherObservation | null>(null);
  const [forecastData, setForecastData] = useState<RollingForecastResponse | null>(null);
  const [dispatchPlan, setDispatchPlan] = useState<DispatchPlan | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [scenarioSummary, setScenarioSummary] = useState<ScenarioSummary | null>(null);
  const [plannerRefresh, setPlannerRefresh] = useState(0);

  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [tData, wData, fData, dData, aData, apiAvailable] = await Promise.all([
        fetchLiveTelemetry(), fetchWeather(), fetchForecast(6), fetchDispatchSchedule(6),
        fetchSystemAlerts(), checkBackendAvailability(),
      ]);
      setTelemetry(tData);
      setWeather(wData);
      setForecastData(fData);
      setDispatchPlan(dData);
      setAlerts(aData);
      setBackendOnline(apiAvailable);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeout: number;
    const poll = async () => {
      await loadAllData();
      if (!cancelled) timeout = window.setTimeout(poll, 5000);
    };
    timeout = window.setTimeout(poll, 0);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [loadAllData]);

  const refreshPlanningData = useCallback(async () => {
    await loadAllData();
    setPlannerRefresh((value) => value + 1);
  }, [loadAllData]);

  const handleBreakerToggle = async (breaker: "solar" | "bess" | "grid") => {
    if (!telemetry) return;
    const statusKey = `breaker_${breaker}_status` as keyof TelemetryPoint;
    const currentStatus = telemetry[statusKey] as string;
    const newStatus = currentStatus === "CLOSED" ? "OPEN" : "CLOSED";
    await updateScadaControl({ [`breaker_${breaker}`]: newStatus });
    await refreshPlanningData();
  };

  const activeWarnings = alerts.filter((alert) => alert.severity === "WARNING" || alert.severity === "CRITICAL");
  const currentTime = telemetry ? new Date(telemetry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header
        telemetry={telemetry}
        onRefresh={loadAllData}
        isRefreshing={isRefreshing}
        backendOnline={backendOnline}
        weatherLive={Boolean(weather?.is_live_api)}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-3 py-5 sm:px-5 lg:px-7 lg:py-8">
        <section className="hero-card">
          <div className="relative z-10 max-w-3xl">
            <p className="eyebrow text-[#d6e2d2]">A student-built microgrid study</p>
            <h1 className="mt-2 max-w-2xl font-serif text-3xl font-bold leading-tight text-white sm:text-4xl">See the energy story, one decision at a time.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#e1e8dc] sm:text-base">GreenSync brings solar, storage, facility demand, and grid choices into one friendly control room. Explore what changes when the weather turns or the grid drops out.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="hero-tag"><Activity className="h-3.5 w-3.5" />Simulation running {backendOnline ? "with local API" : "in fallback mode"}</span>
              <span className="hero-tag"><Sparkles className="h-3.5 w-3.5" />Updated at {currentTime}</span>
              <span className="hero-tag"><Leaf className="h-3.5 w-3.5" />Weather {weather?.is_live_api ? "from connected service" : "from local model"}</span>
            </div>
          </div>
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-spark hero-spark-one" />
          <div className="hero-spark hero-spark-two" />
        </section>

        {backendOnline === false && (
          <div role="status" className="rounded-2xl border border-[#e6c79e] bg-[#fbf1e3] p-4 text-sm text-[#81572e]">
            <strong>Showing the sample view.</strong> The local API is offline, so these readings are illustrative and controls cannot change the simulator yet.
          </div>
        )}

        {activeWarnings.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#e6c79e] bg-[#fbf1e3] p-4 text-sm text-[#81572e]">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div><strong className="mr-2">Heads up</strong>{activeWarnings[activeWarnings.length - 1].message}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7"><MicrogridSLD telemetry={telemetry} onBreakerToggle={handleBreakerToggle} /></div>
          <div className="flex flex-col justify-between gap-5 lg:col-span-5">
            <WeatherRampAlert weather={weather} />
            <BatteryHealthGauge telemetry={telemetry} degradationCost={dispatchPlan?.battery_degradation_cost_usd} throughputKwh={dispatchPlan?.battery_throughput_kwh} />
          </div>
        </div>

        <section className="space-y-3">
          <div className="mb-3 flex items-center justify-between gap-3"><div><p className="eyebrow">Next six hours</p><h2 className="section-title">A look ahead</h2></div><span className="source-chip"><ArrowDownRight className="h-3.5 w-3.5" />Forecast model: {forecastData?.model_version ?? "loading"}</span></div>
          <RollingForecastChart forecast={forecastData?.forecast ?? []} modelInfo={forecastData ? { version: forecastData.model_version } : undefined} />
        </section>

        <HistoryChart />
        <SolverComparison refreshKey={plannerRefresh} />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7"><DispatchMatrix schedule={dispatchPlan?.schedule ?? []} objectiveStatus={dispatchPlan?.objective_status} /></div>
          <div className="flex flex-col justify-between gap-5 lg:col-span-5">
            <EconomicBreakdown dispatchPlan={dispatchPlan} />
            <WhatIfSimulator onScenarioApplied={refreshPlanningData} onScenarioSummary={setScenarioSummary} />
          </div>
        </div>

        <DemoControlsPanel onApplied={refreshPlanningData} onReset={() => setScenarioSummary(null)} />

        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e1dbce] bg-white/75 p-4 sm:flex-row sm:items-center sm:p-5">
          <div><p className="eyebrow">Take it with you</p><h2 className="mt-1 font-serif text-xl font-bold text-[#334338]">A tidy summary for your presentation</h2><p className="mt-1 text-sm text-slate-600">Includes the current scenario, dispatch assumptions, and interval-by-interval choices.</p></div>
          <ReportExport telemetry={telemetry} dispatch={dispatchPlan} scenario={scenarioSummary} />
        </section>

        <SCADAControls telemetry={telemetry} dispatchPlan={dispatchPlan} onControlUpdated={() => { void refreshPlanningData(); }} />
      </main>

      <footer className="mt-4 border-t border-[#e1dbce] bg-[#f7f4ed]/90 py-5 text-center text-xs text-[#77776c]">
        <p className="font-serif text-base font-semibold text-[#445c49]">GreenSync · A microgrid simulation for curious minds</p>
        <p className="mt-1">No physical equipment is connected. Readings, savings, and scenarios are for demonstration.</p>
      </footer>
    </div>
  );
}
