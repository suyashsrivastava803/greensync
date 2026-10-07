"use client";

import React, { useState } from"react";
import { Settings, Shield, Download, Check } from"lucide-react";
import { TelemetryPoint, DispatchPlan } from"../lib/types";
import { updateScadaControl } from"../lib/api";
import { useLanguage } from"../lib/LanguageContext";

interface SCADAControlsProps {
 telemetry: TelemetryPoint | null;
 dispatchPlan: DispatchPlan | null;
 onControlUpdated: () => void;
}

export const SCADAControls: React.FC<SCADAControlsProps> = ({
 telemetry,
 dispatchPlan,
 onControlUpdated,
}) => {
 const { t } = useLanguage();
 const [isUpdating, setIsUpdating] = useState<boolean>(false);
 const [feedback, setFeedback] = useState<string>("");

 const currentMode = telemetry?.microgrid_mode ??"OPTIMAL_AUTONOMOUS";
 const breakerSolar = telemetry?.breaker_solar_status ??"CLOSED";
 const breakerBess = telemetry?.breaker_bess_status ??"CLOSED";
 const breakerGrid = telemetry?.breaker_grid_status ??"CLOSED";

 const handleModeChange = async (mode: string) => {
 setIsUpdating(true);
 setFeedback(`Switching microgrid mode to ${mode}...`);
 try {
 const result = await updateScadaControl({ mode });
 if (result.status !== "COMMAND_EXECUTED") {
 setFeedback(result.status === "OFFLINE_SIMULATED" ? "Backend offline: operating mode was not changed." : "The backend rejected the operating mode.");
 return;
 }
 setFeedback(`Controller operating in ${mode.replace("_","")}.`);
 onControlUpdated();
 } catch {
 setFeedback("Failed to update controller mode.");
 } finally {
 setIsUpdating(false);
 }
 };

 const handleBreakerToggle = async (breakerName:"breaker_solar" |"breaker_bess" |"breaker_grid", currentStatus: string) => {
 const newStatus = currentStatus ==="CLOSED" ?"OPEN" :"CLOSED";
 setIsUpdating(true);
 setFeedback(`Interlocking ${breakerName} -> ${newStatus}...`);
 try {
 const result = await updateScadaControl({ [breakerName]: newStatus });
 if (result.status !== "COMMAND_EXECUTED") {
 setFeedback(result.status === "OFFLINE_SIMULATED" ? "Backend offline: breaker state was not changed." : "The backend rejected the breaker command.");
 return;
 }
 setFeedback(`Breaker interlock updated: ${newStatus}`);
 onControlUpdated();
 } catch {
 setFeedback("Breaker interlock communication error.");
 } finally {
 setIsUpdating(false);
 }
 };

 const handleExportTelemetry = () => {
 const exportData = {
 exported_at: new Date().toISOString(),
 telemetry,
 dispatchPlan,
 };
 const blob = new Blob([JSON.stringify(exportData, null, 2)], {
 type:"application/json",
 });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `greensync_scada_audit_${new Date().toISOString().slice(0, 19).replace(/:/g,"-")}.json`;
 a.click();
 URL.revokeObjectURL(url);
 };

 return (
 <div className="scada-panel p-5 text-slate-800 flex flex-col justify-between">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3 mb-4">
 <div className="flex items-center gap-2">
 <div className="p-1.5 rounded-md bg-teal-100 text-teal-700 border border-teal-200">
 <Settings className="w-4 h-4" />
 </div>
 <div>
 <h2 className="text-sm font-bold tracking-wide uppercase text-slate-900">
 {t.controlsTitle}
 </h2>
 <p className="text-[11px] text-slate-500 font-mono">
 {t.controlsSubtitle}
 </p>
 </div>
 </div>

 <button
 onClick={handleExportTelemetry}
 title="Export SCADA telemetry log"
 className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100:bg-slate-700 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold transition shrink-0"
 >
 <Download className="w-3.5 h-3.5" />
 <span>{t.auditLogBtn}</span>
 </button>
 </div>

 {/* Mode Selector */}
 <div className="mb-4">
 <span className="text-xs font-mono text-slate-600 block mb-2 uppercase font-bold tracking-wider">
 {t.operatingModeLabel}
 </span>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-xs">
 {[
 { id:"OPTIMAL_AUTONOMOUS", label: t.modeAutonomous, desc:"Forecast & dispatch rules" },
 { id:"PEAK_SHAVING", label: t.modePeakShaving, desc:"Max Demand Shave" },
 { id:"ISLANDED", label: t.modeIslanded, desc:"Zero Grid Tie" },
 { id:"FORCE_CHARGE", label: t.modeForceCharge, desc:"Storm Prep Reserve" },
 ].map((mode) => (
 <button
 type="button"
 key={mode.id}
 onClick={() => handleModeChange(mode.id)}
 disabled={isUpdating}
 className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between min-h-[75px] cursor-pointer shadow-xs ${
 currentMode === mode.id
 ?"bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-sm"
 :"bg-white/95 border-slate-200/90 hover:bg-emerald-50/50 hover:border-emerald-300 text-slate-800"
 }`}
 >
 <div className="flex items-center justify-between mb-1">
 <span className="text-slate-900 font-bold truncate">{mode.label}</span>
 {currentMode === mode.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
 </div>
 <span className="text-[10px] text-slate-500">{mode.desc}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Breaker Interlock Controls */}
 <div className="pt-3 border-t border-slate-200/80">
 <span className="text-xs font-mono text-slate-600 block mb-2 uppercase font-bold tracking-wider">
 {t.ansiBreakersLabel}
 </span>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-sans text-xs">
 {/* Solar Breaker */}
 <button
 type="button"
 onClick={() => handleBreakerToggle("breaker_solar", breakerSolar)}
 disabled={isUpdating}
 className="p-2.5 rounded-xl bg-white/95 border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-between text-left transition cursor-pointer shadow-xs"
 >
 <div className="min-w-0 flex-1 mr-2">
 <span className="text-slate-900 block text-[11px] font-bold">52-PV Solar</span>
 <span className="text-[10px] text-slate-500 truncate block">{t.solarInverterTrip}</span>
 </div>
 <span
 className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold shrink-0 ${
 breakerSolar ==="CLOSED"
 ?"bg-emerald-100 text-emerald-900 border-emerald-300"
 :"bg-red-100 text-red-900 border-red-300"
 }`}
 >
 {breakerSolar ==="CLOSED" ? t.breakerClosed : t.breakerOpen}
 </span>
 </button>

 {/* BESS Breaker */}
 <button
 type="button"
 onClick={() => handleBreakerToggle("breaker_bess", breakerBess)}
 disabled={isUpdating}
 className="p-2.5 rounded-xl bg-white/95 border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-between text-left transition cursor-pointer shadow-xs"
 >
 <div className="min-w-0 flex-1 mr-2">
 <span className="text-slate-900 block text-[11px] font-bold">52-B BESS</span>
 <span className="text-[10px] text-slate-500 truncate block">{t.bessStorageTrip}</span>
 </div>
 <span
 className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold shrink-0 ${
 breakerBess ==="CLOSED"
 ?"bg-emerald-100 text-emerald-900 border-emerald-300"
 :"bg-red-100 text-red-900 border-red-300"
 }`}
 >
 {breakerBess ==="CLOSED" ? t.breakerClosed : t.breakerOpen}
 </span>
 </button>

 {/* Grid Breaker */}
 <button
 type="button"
 onClick={() => handleBreakerToggle("breaker_grid", breakerGrid)}
 disabled={isUpdating}
 className="p-2.5 rounded-xl bg-white/95 border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-between text-left transition cursor-pointer shadow-xs"
 >
 <div className="min-w-0 flex-1 mr-2">
 <span className="text-slate-900 block text-[11px] font-bold">52-G PCC Grid</span>
 <span className="text-[10px] text-slate-500 truncate block">{t.gridUtilityTie}</span>
 </div>
 <span
 className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold shrink-0 ${
 breakerGrid ==="CLOSED"
 ?"bg-emerald-100 text-emerald-900 border-emerald-300"
 :"bg-red-100 text-red-900 border-red-300"
 }`}
 >
 {breakerGrid ==="CLOSED" ? t.breakerClosed : t.breakerOpen}
 </span>
 </button>
 </div>
 </div>

 {/* Feedback Banner */}
 {feedback && (
 <div className="mt-3 p-2.5 rounded-lg bg-teal-50 border border-teal-200 font-mono text-xs flex items-center gap-2 text-teal-800 font-bold">
 <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
 <span>{feedback}</span>
 </div>
 )}
 </div>
 );
};
