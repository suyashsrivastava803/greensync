"use client";

import React, { useState } from"react";
import { Sparkles, CloudDrizzle, ZapOff, Factory, RotateCcw, CheckCircle } from"lucide-react";
import { fetchDispatchSchedule, fetchLiveTelemetry, injectScenario } from"../lib/api";
import { ScenarioSummary } from "../lib/types";
import { useLanguage } from"../lib/LanguageContext";

interface WhatIfSimulatorProps {
 onScenarioApplied: () => Promise<void>;
 onScenarioSummary: (summary: ScenarioSummary) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ onScenarioApplied, onScenarioSummary }) => {
 const { t } = useLanguage();
 const [activeScenario, setActiveScenario] = useState<string>("NONE");
 const [statusMessage, setStatusMessage] = useState<string>("");
 const [isLoading, setIsLoading] = useState<boolean>(false);
 const [comparison, setComparison] = useState<ScenarioSummary | null>(null);

 const handleInject = async (type: string, severity = 0.85, durationHours = 2.0) => {
 setIsLoading(true);
 setStatusMessage("Injecting scenario into SCADA simulator...");
 try {
 const before = await fetchLiveTelemetry();
 const res = await injectScenario(type, severity, durationHours);
 if (res.status === "OFFLINE_SIMULATED") {
 setActiveScenario("NONE");
 setStatusMessage("Backend offline: this scenario was not applied to the simulator.");
 return;
 }
 if (res.status !== "SCENARIO_APPLIED") {
 setStatusMessage(res.detail || "The backend rejected this scenario.");
 return;
 }
 setActiveScenario(type);
 setStatusMessage(res.detail || `Scenario ${type} applied.`);
 await onScenarioApplied();
 const [after, dispatch] = await Promise.all([fetchLiveTelemetry(), fetchDispatchSchedule(6)]);
 const names: Record<string, string> = {
 CLOUD_RAMP_DROP: t.scenCloudTitle,
 GRID_INTERRUPTION: t.scenGridTitle,
 DEMAND_SURGE: t.scenSurgeTitle,
 RESET: t.scenResetTitle,
 };
 const explanations: Record<string, string> = {
 CLOUD_RAMP_DROP: "Cloud cover is raised to 88%. Solar output falls, so the dispatch schedule has less renewable energy to work with.",
 GRID_INTERRUPTION: "The point-of-common-coupling breaker opens. Grid imports and exports stop; the schedule shows any load the battery cannot cover.",
 DEMAND_SURGE: "A temporary industrial load increase is added. The planner weighs battery support against grid imports and the battery reserve.",
 RESET: "Weather and load overrides are cleared, breakers return to their normal state, and the battery starts from its baseline charge.",
 };
 const nextComparison = { name: names[type] ?? type, explanation: explanations[type] ?? res.detail, before, after, dispatch };
 setComparison(nextComparison);
 onScenarioSummary(nextComparison);
 } catch {
 setStatusMessage("Failed to communicate scenario to backend.");
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="scada-panel p-5 sm:p-6 text-slate-900 flex flex-col justify-between">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
 <div className="flex items-center gap-2">
 <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
 <Sparkles className="w-4 h-4" />
 </div>
 <div>
 <h2 className="section-title text-lg">
 {t.whatIfTitle}
 </h2>
 <p className="text-[11px] text-slate-500 font-mono">
 {t.whatIfSubtitle}
 </p>
 </div>
 </div>

 <span className="status-pill status-pill-sim">
 Practice mode
 </span>
 </div>

 {/* Scenario Buttons Grid with Synchronized Styling */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
 {/* Scenario 1: Cloud Ramp */}
 <button
 type="button"
 onClick={() => handleInject("CLOUD_RAMP_DROP", 0.88, 1.5)}
 disabled={isLoading}
 className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 min-h-[115px] cursor-pointer shadow-xs ${
 activeScenario ==="CLOUD_RAMP_DROP"
 ?"bg-amber-50 border-amber-400 text-amber-950 shadow-sm"
 :"bg-white/95 hover:bg-emerald-50/50 border-slate-200/90 hover:border-emerald-300 text-slate-900"
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80">
 <CloudDrizzle className="w-3.5 h-3.5" />
 </div>
 <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
 88% Cover
 </span>
 </div>
 <div>
 <span className="text-xs font-bold block text-slate-900">{t.scenCloudTitle}</span>
 <span className="text-[11px] text-slate-600 font-sans mt-0.5 block leading-relaxed">
 {t.scenCloudDesc}
 </span>
 </div>
 </button>

 {/* Scenario 2: Grid Outage */}
 <button
 type="button"
 onClick={() => handleInject("GRID_INTERRUPTION", 1.0, 3.0)}
 disabled={isLoading}
 className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 min-h-[115px] cursor-pointer shadow-xs ${
 activeScenario ==="GRID_INTERRUPTION"
 ?"bg-red-50 border-red-400 text-red-950 shadow-sm"
 :"bg-white/95 hover:bg-emerald-50/50 border-slate-200/90 hover:border-emerald-300 text-slate-900"
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80">
 <ZapOff className="w-3.5 h-3.5" />
 </div>
 <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
 52-G Trip
 </span>
 </div>
 <div>
 <span className="text-xs font-bold block text-slate-900">{t.scenGridTitle}</span>
 <span className="text-[11px] text-slate-600 font-sans mt-0.5 block leading-relaxed">
 {t.scenGridDesc}
 </span>
 </div>
 </button>

 {/* Scenario 3: Load Surge */}
 <button
 type="button"
 onClick={() => handleInject("DEMAND_SURGE", 0.9, 2.0)}
 disabled={isLoading}
 className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 min-h-[115px] cursor-pointer shadow-xs ${
 activeScenario ==="DEMAND_SURGE"
 ?"bg-cyan-50 border-cyan-400 text-cyan-950 shadow-sm"
 :"bg-white/95 hover:bg-emerald-50/50 border-slate-200/90 hover:border-emerald-300 text-slate-900"
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200/80">
 <Factory className="w-3.5 h-3.5" />
 </div>
 <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
 +130 kW
 </span>
 </div>
 <div>
 <span className="text-xs font-bold block text-slate-900">{t.scenSurgeTitle}</span>
 <span className="text-[11px] text-slate-600 font-sans mt-0.5 block leading-relaxed">
 {t.scenSurgeDesc}
 </span>
 </div>
 </button>

 {/* Reset */}
 <button
 type="button"
 onClick={() => handleInject("RESET", 0.0, 0.0)}
 disabled={isLoading}
 className="p-3 rounded-xl border border-slate-200/90 bg-white/95 hover:bg-emerald-50/50 hover:border-emerald-300 text-slate-900 transition flex flex-col justify-between gap-2 min-h-[115px] cursor-pointer shadow-xs"
 >
 <div className="flex items-center justify-between">
 <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
 <RotateCcw className="w-3.5 h-3.5" />
 </div>
 <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
 Nominal
 </span>
 </div>
 <div>
 <span className="text-xs font-bold block text-slate-900">{t.scenResetTitle}</span>
 <span className="text-[11px] text-slate-600 font-sans mt-0.5 block leading-relaxed">
 {t.scenResetDesc}
 </span>
 </div>
 </button>
 </div>

 {/* Status Feedback Banner */}
 {statusMessage && (
 <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 font-sans text-xs flex items-center gap-2 text-emerald-900 font-medium">
 <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
 <span>{statusMessage}</span>
 </div>
 )}
 {comparison && (
 <div className="mt-4 rounded-2xl border border-[#e5ddd0] bg-[#fbf8f1] p-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div><p className="eyebrow">What changed</p><h3 className="mt-1 font-serif text-lg font-bold text-[#34483a]">{comparison.name}</h3><p className="mt-1 max-w-2xl text-sm text-slate-600">{comparison.explanation}</p></div>
 <span className="source-chip"><span className="h-2 w-2 rounded-full bg-[#4f8b61]" /> Simulator response</span>
 </div>
 <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
 {[
 ["Solar", comparison.before.solar_output_kw, comparison.after.solar_output_kw, "kW"],
 ["Facility load", comparison.before.facility_load_kw, comparison.after.facility_load_kw, "kW"],
 ["Battery", comparison.before.battery_soc_pct, comparison.after.battery_soc_pct, "%"],
 ["Grid flow", comparison.before.grid_power_kw, comparison.after.grid_power_kw, "kW"],
 ].map(([label, beforeValue, afterValue, unit]) => (
 <div key={String(label)} className="rounded-xl bg-white p-3">
 <p className="text-xs text-slate-500">{label}</p>
 <p className="mt-1 font-mono text-xs text-slate-600">{Number(beforeValue).toFixed(1)} → <strong className="text-slate-900">{Number(afterValue).toFixed(1)} {unit}</strong></p>
 </div>
 ))}
 </div>
 <p className="mt-3 text-xs text-slate-500">Next dispatch: {comparison.dispatch.schedule[0]?.action_rationale ?? "No dispatch intervals returned."}</p>
 </div>
 )}
 </div>
 );
};
