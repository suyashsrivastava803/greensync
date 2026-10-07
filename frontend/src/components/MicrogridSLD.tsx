"use client";

import React from"react";
import { Sun, BatteryCharging, Battery, Building2, UtilityPole } from"lucide-react";
import { TelemetryPoint } from"../lib/types";
import { useLanguage } from"../lib/LanguageContext";

interface MicrogridSLDProps {
 telemetry: TelemetryPoint | null;
 onBreakerToggle?: (breaker:"solar" |"bess" |"grid") => void;
}

export const MicrogridSLD: React.FC<MicrogridSLDProps> = ({ telemetry, onBreakerToggle }) => {
 const { t } = useLanguage();
 const solarKw = telemetry?.solar_output_kw ?? 0;
 const loadKw = telemetry?.facility_load_kw ?? 0;
 const bessKw = telemetry?.battery_power_kw ?? 0; // + charge, - discharge
 const gridKw = telemetry?.grid_power_kw ?? 0; // + import, - export
 const soc = telemetry?.battery_soc_pct ?? 50;

 const breakerSolar = telemetry?.breaker_solar_status ??"CLOSED";
 const breakerBess = telemetry?.breaker_bess_status ??"CLOSED";
 const breakerGrid = telemetry?.breaker_grid_status ??"CLOSED";

 const isBessDischarging = bessKw < -0.1;
 const isBessCharging = bessKw > 0.1;
 const isGridImporting = gridKw > 0.1;
 const isGridExporting = gridKw < -0.1;

 const totalGeneration = solarKw + (isBessDischarging ? Math.abs(bessKw) : 0) + (isGridImporting ? gridKw : 0);
 const totalDemand = loadKw + (isBessCharging ? bessKw : 0) + (isGridExporting ? Math.abs(gridKw) : 0);

 return (
 <div className="scada-panel p-4 sm:p-5 text-slate-900 flex flex-col justify-between">
 {/* Panel Header */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3 mb-4">
 <div className="flex items-center gap-2">
 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
 <h2 className="text-sm font-bold tracking-wide uppercase text-slate-900">
 {t.sldTitle}
 </h2>
 <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold whitespace-nowrap">
 {t.sldSubtitle}
 </span>
 </div>

 <div className="text-xs font-mono text-slate-700 flex items-center gap-1.5 flex-wrap">
 <span className="hidden sm:inline font-medium text-slate-500">{t.activeBusBalance}</span>
 <span className="text-emerald-700 font-bold whitespace-nowrap">
 {totalGeneration.toFixed(1)} kW {t.generation}
 </span>
 <span className="text-slate-400">≈</span>
 <span className="text-teal-700 font-bold whitespace-nowrap">
 {totalDemand.toFixed(1)} kW {t.demand}
 </span>
 </div>
 </div>

 {/* Interactive Power Flow Canvas */}
 <div className="relative w-full py-6 min-h-[460px] sm:min-h-[440px] flex flex-col justify-center">
 {/* Animated Power Flow SVG Overlay */}
 <svg
 className="absolute inset-0 w-full h-full pointer-events-none"
 xmlns="http://www.w3.org/2000/svg"
 >
 <defs>
 <linearGradient id="busGrad" x1="0%" y1="0%" x2="100%" y2="0%">
 <stop offset="0%" stopColor="#0d9488" />
 <stop offset="50%" stopColor="#059669" />
 <stop offset="100%" stopColor="#0284c7" />
 </linearGradient>
 </defs>

 {/* Bus 415V Central Spine */}
 <line
 x1="12%"
 y1="50%"
 x2="88%"
 y2="50%"
 stroke="url(#busGrad)"
 strokeWidth="6"
 strokeLinecap="round"
 />

 {/* Node 1: Solar to Bus Path (Top Left) */}
 <path
 d="M 25% 24% L 25% 50%"
 stroke={breakerSolar ==="CLOSED" && solarKw > 0 ?"#059669" :"#cbd5e1"}
 strokeWidth="3.5"
 strokeDasharray={breakerSolar ==="CLOSED" && solarKw > 0 ?"6,6" :"none"}
 className={breakerSolar ==="CLOSED" && solarKw > 0 ?"flow-anim-forward" :""}
 />

 {/* Node 2: Utility Grid to Bus Path (Top Right) */}
 <path
 d="M 75% 24% L 75% 50%"
 stroke={breakerGrid ==="CLOSED" && (isGridImporting || isGridExporting) ? (isGridImporting ?"#d97706" :"#059669") :"#cbd5e1"}
 strokeWidth="3.5"
 strokeDasharray={breakerGrid ==="CLOSED" && (isGridImporting || isGridExporting) ?"6,6" :"none"}
 className={isGridImporting ?"flow-anim-forward" : isGridExporting ?"flow-anim-reverse" :""}
 />

 {/* Node 3: BESS to Bus Path (Bottom Left) */}
 <path
 d="M 25% 76% L 25% 50%"
 stroke={breakerBess ==="CLOSED" && (isBessCharging || isBessDischarging) ?"#0d9488" :"#cbd5e1"}
 strokeWidth="3.5"
 strokeDasharray={breakerBess ==="CLOSED" && (isBessCharging || isBessDischarging) ?"6,6" :"none"}
 className={isBessDischarging ?"flow-anim-reverse" : isBessCharging ?"flow-anim-forward" :""}
 />

 {/* Node 4: Bus to Facility Load Path (Bottom Right) */}
 <path
 d="M 75% 50% L 75% 76%"
 stroke={loadKw > 0 ?"#0284c7" :"#cbd5e1"}
 strokeWidth="3.5"
 strokeDasharray={loadKw > 0 ?"6,6" :"none"}
 className={loadKw > 0 ?"flow-anim-forward" :""}
 />
 </svg>

 {/* Central Bus Label */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 px-4 py-1.5 rounded-full bg-white border-2 border-emerald-400 shadow-md flex items-center gap-2 font-mono text-[11px] sm:text-xs whitespace-nowrap">
 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
 <span className="font-bold text-slate-900">{t.acBusLabel}</span>
 <span className="text-slate-300">•</span>
 <span className="text-teal-700 font-bold">{t.threePhase}</span>
 </div>

 {/* Nodes 2x2 Grid with Synchronized, Cohesive Styling */}
 <div className="grid grid-cols-2 gap-y-28 sm:gap-y-32 gap-x-4 sm:gap-x-10 relative z-10">
 {/* Node 1: Solar PV Farm */}
 <div className="flex flex-col items-center">
 <div className="w-full max-w-[270px] sm:max-w-[290px] p-3.5 rounded-xl bg-white/95 border border-emerald-200/90 shadow-sm hover:border-emerald-400 transition-all space-y-2">
 <div className="flex items-center justify-between gap-1.5">
 <div className="flex items-center gap-2 min-w-0">
 <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
 <Sun className="w-4 h-4" />
 </div>
 <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
 {t.solarArray}
 </span>
 </div>

 <button
 type="button"
 onClick={() => onBreakerToggle?.("solar")}
 title="Toggle ANSI 52-PV Breaker"
 className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition shrink-0 cursor-pointer ${
 breakerSolar ==="CLOSED"
 ?"bg-emerald-100 text-emerald-900 border-emerald-300"
 :"bg-red-100 text-red-900 border-red-300"
 }`}
 >
 52-PV: {breakerSolar ==="CLOSED" ? t.breakerClosed : t.breakerOpen}
 </button>
 </div>

 <div className="text-[11px] font-mono text-slate-500 truncate">
 {t.solarSpecs}
 </div>

 <div className="flex items-baseline justify-between font-mono pt-1.5 border-t border-slate-100">
 <span className="text-xs font-medium text-slate-600">{t.generation}:</span>
 <span className="text-base font-extrabold text-slate-900">
 {solarKw.toFixed(1)} <span className="text-xs font-semibold text-emerald-600">kW</span>
 </span>
 </div>
 </div>
 </div>

 {/* Node 2: Utility Interconnection Substation */}
 <div className="flex flex-col items-center">
 <div className="w-full max-w-[270px] sm:max-w-[290px] p-3.5 rounded-xl bg-white/95 border border-emerald-200/90 shadow-sm hover:border-emerald-400 transition-all space-y-2">
 <div className="flex items-center justify-between gap-1.5">
 <div className="flex items-center gap-2 min-w-0">
 <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/80 shrink-0">
 <UtilityPole className="w-4 h-4" />
 </div>
 <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
 {t.gridInterconnect}
 </span>
 </div>

 <button
 type="button"
 onClick={() => onBreakerToggle?.("grid")}
 title="Toggle ANSI 52-GRID Main Breaker"
 className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition shrink-0 cursor-pointer ${
 breakerGrid ==="CLOSED"
 ?"bg-emerald-100 text-emerald-900 border-emerald-300"
 :"bg-red-100 text-red-900 border-red-300"
 }`}
 >
 52-G: {breakerGrid ==="CLOSED" ? t.breakerClosed : t.breakerOpen}
 </button>
 </div>

 <div className="text-[11px] font-mono text-slate-500 truncate">
 {t.gridSpecs}
 </div>

 <div className="flex items-baseline justify-between font-mono pt-1.5 border-t border-slate-100">
 <span className="text-xs font-medium text-slate-600">
 {isGridImporting ? t.importing : isGridExporting ? t.exporting : t.demand}:
 </span>
 <span className="text-base font-extrabold text-slate-900">
 {Math.abs(gridKw).toFixed(1)}{""}
 <span className={`text-xs font-semibold ${isGridImporting ?"text-amber-600" :"text-emerald-600"}`}>
 kW
 </span>
 </span>
 </div>
 </div>
 </div>

 {/* Node 3: BESS (Battery Storage) */}
 <div className="flex flex-col items-center">
 <div className="w-full max-w-[270px] sm:max-w-[290px] p-3.5 rounded-xl bg-white/95 border border-emerald-200/90 shadow-sm hover:border-emerald-400 transition-all space-y-2">
 <div className="flex items-center justify-between gap-1.5">
 <div className="flex items-center gap-2 min-w-0">
 <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
 {isBessCharging ? <BatteryCharging className="w-4 h-4 text-emerald-700" /> : <Battery className="w-4 h-4 text-teal-700" />}
 </div>
 <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
 {t.bessStorage}
 </span>
 </div>

 <button
 type="button"
 onClick={() => onBreakerToggle?.("bess")}
 title="Toggle ANSI 52-BESS Breaker"
 className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition shrink-0 cursor-pointer ${
 breakerBess ==="CLOSED"
 ?"bg-emerald-100 text-emerald-900 border-emerald-300"
 :"bg-red-100 text-red-900 border-red-300"
 }`}
 >
 52-B: {breakerBess ==="CLOSED" ? t.breakerClosed : t.breakerOpen}
 </button>
 </div>

 {/* Battery SoC Progress Bar */}
 <div className="space-y-1">
 <div className="flex justify-between text-[11px] font-mono text-slate-700 font-medium">
 <span>SoC: <strong className="text-slate-900 font-bold">{soc.toFixed(1)}%</strong></span>
 <span className="text-slate-400 text-[10px]">{t.bessSpecs}</span>
 </div>
 <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
 <div
 className={`h-full transition-all duration-500 ${
 soc > 60 ?"bg-emerald-500" : soc > 30 ?"bg-teal-500" :"bg-amber-500"
 }`}
 style={{ width: `${Math.min(100, Math.max(0, soc))}%` }}
 />
 </div>
 </div>

 <div className="flex items-baseline justify-between font-mono pt-1.5 border-t border-slate-100">
 <span className="text-xs font-medium text-slate-600">
 {isBessCharging ? t.charging : isBessDischarging ? t.discharging : t.standby}
 </span>
 <span className="text-base font-extrabold text-slate-900">
 {Math.abs(bessKw).toFixed(1)}{""}
 <span className="text-xs font-semibold text-teal-600">kW</span>
 </span>
 </div>
 </div>
 </div>

 {/* Node 4: Facility Industrial Load */}
 <div className="flex flex-col items-center">
 <div className="w-full max-w-[270px] sm:max-w-[290px] p-3.5 rounded-xl bg-white/95 border border-emerald-200/90 shadow-sm hover:border-emerald-400 transition-all space-y-2">
 <div className="flex items-center justify-between gap-1.5">
 <div className="flex items-center gap-2 min-w-0">
 <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200/80 shrink-0">
 <Building2 className="w-4 h-4" />
 </div>
 <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
 {t.facilityLoad}
 </span>
 </div>

 <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0 whitespace-nowrap">
 {t.criticalLoad}
 </span>
 </div>

 <div className="text-[11px] font-mono text-slate-500 truncate">
 {t.facilitySpecs}
 </div>

 <div className="flex items-baseline justify-between font-mono pt-1.5 border-t border-slate-100">
 <span className="text-xs font-medium text-slate-600">{t.demand}:</span>
 <span className="text-base font-extrabold text-slate-900">
 {loadKw.toFixed(1)} <span className="text-xs font-semibold text-cyan-700">kW</span>
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
