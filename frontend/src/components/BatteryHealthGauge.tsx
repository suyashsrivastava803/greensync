"use client";

import React from"react";
import { BatteryCharging, Battery, Thermometer, ShieldAlert, Cpu, Award } from"lucide-react";
import { TelemetryPoint } from"../lib/types";
import { useLanguage } from"../lib/LanguageContext";
import { useTheme } from"../lib/ThemeContext";

interface BatteryHealthGaugeProps {
 telemetry: TelemetryPoint | null;
 degradationCost?: number;
 throughputKwh?: number;
}

export const BatteryHealthGauge: React.FC<BatteryHealthGaugeProps> = ({
 telemetry,
 degradationCost = 2.25,
 throughputKwh = 64.5,
}) => {
 const { t } = useLanguage();
 const { theme } = useTheme();
 const soc = telemetry?.battery_soc_pct ?? 68.5;
 const powerKw = telemetry?.battery_power_kw ?? 0.0;
 const tempC = telemetry?.battery_temp_c ?? 27.2;
 const soh = telemetry?.battery_soh_pct ?? 98.4;
 const isCharging = powerKw > 0.1;
 const isDischarging = powerKw < -0.1;

 // C-rate calculation
 const cRate = Math.abs(powerKw) / 240.0;

 // Radial gauge SVG dimensions
 const radius = 72;
 const circumference = 2 * Math.PI * radius;
 const strokeDashoffset = circumference - (Math.min(100, Math.max(0, soc)) / 100) * circumference;

 return (
 <div className="scada-panel p-4 sm:p-5 text-slate-800 flex flex-col justify-between">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3 mb-4">
 <div className="flex items-center gap-2">
 <div className="p-1.5 rounded-lg bg-teal-100 text-teal-700 border border-teal-200">
 {isCharging ? <BatteryCharging className="w-4 h-4 text-emerald-600" /> : <Battery className="w-4 h-4 text-teal-600" />}
 </div>
 <div>
 <h2 className="text-sm font-bold tracking-wide uppercase text-slate-900">
 {t.bessTelemetryTitle}
 </h2>
 <p className="text-[11px] text-slate-500 font-mono">
 {t.bessTelemetrySubtitle}
 </p>
 </div>
 </div>

 <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-bold shrink-0">
 <Award className="w-3 h-3" />
 <span>{t.stateOfHealth}: {soh.toFixed(1)}%</span>
 </div>
 </div>

 {/* Main Gauge & Diagnostics with Zero Overlap */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
 {/* Radial SoC Gauge */}
 <div className="flex flex-col items-center justify-center relative">
 <div className="relative w-44 h-44 flex items-center justify-center">
 <svg viewBox="0 0 176 176" className="w-full h-full transform -rotate-90">
 {/* Background Track */}
 <circle
 cx="88"
 cy="88"
 r={radius}
 stroke={theme ==="light" ?"#e2e8f0" :"#1e293b"}
 strokeWidth="12"
 fill="none"
 />
 {/* Safe Operating Window Marker (20% to 95%) */}
 <circle
 cx="88"
 cy="88"
 r={radius}
 stroke="rgba(13, 148, 136, 0.15)"
 strokeWidth="12"
 strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
 strokeDashoffset={-circumference * 0.2}
 fill="none"
 />
 {/* Active SoC Arc */}
 <circle
 cx="88"
 cy="88"
 r={radius}
 stroke={soc > 60 ?"#059669" : soc > 30 ?"#0d9488" :"#d97706"}
 strokeWidth="12"
 strokeDasharray={circumference}
 strokeDashoffset={strokeDashoffset}
 strokeLinecap="round"
 fill="none"
 className="transition-all duration-700 ease-out"
 />
 </svg>

 {/* Inner Metrics Display with ample vertical spacing */}
 <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-center px-2">
 <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
 {soc.toFixed(1)}%
 </span>
 <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider leading-tight my-1">
 {t.stateOfCharge}
 </span>
 <span className="text-xs font-bold text-teal-700 leading-tight">
 {isCharging
 ? `+${powerKw.toFixed(1)} kW`
 : isDischarging
 ? `${powerKw.toFixed(1)} kW`
 :"0.0 kW"}
 </span>
 </div>
 </div>

 <div className="text-[11px] font-mono text-slate-500 mt-2 text-center">
 {t.safeDodLimit}
 </div>
 </div>

 {/* Electrical & Thermal Parameters */}
 <div className="space-y-2.5 font-sans text-xs">
 {/* C-Rate */}
 <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-center justify-between gap-2 shadow-xs">
 <div className="flex items-center gap-2 min-w-0">
 <div className="p-1 rounded-md bg-white border border-slate-200 shrink-0">
 <Cpu className="w-3.5 h-3.5 text-teal-600" />
 </div>
 <span className="text-slate-700 font-semibold truncate">{t.cRate}</span>
 </div>
 <div className="text-right shrink-0">
 <span className="text-slate-900 font-bold font-mono">{cRate.toFixed(2)}C</span>
 <span className="text-[10px] text-slate-500 block">{t.cRateRated}</span>
 </div>
 </div>

 {/* Temperature */}
 <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-center justify-between gap-2 shadow-xs">
 <div className="flex items-center gap-2 min-w-0">
 <div className="p-1 rounded-md bg-white border border-slate-200 shrink-0">
 <Thermometer className="w-3.5 h-3.5 text-amber-500" />
 </div>
 <span className="text-slate-700 font-semibold truncate">{t.cellTemp}</span>
 </div>
 <div className="text-right shrink-0">
 <span className={`font-bold font-mono ${tempC > 35 ?"text-amber-600" :"text-emerald-700"}`}>
 {tempC.toFixed(1)}°C
 </span>
 <span className="text-[10px] text-slate-500 block">{t.cellTempNominal}</span>
 </div>
 </div>

 {/* Degradation Wear Cost */}
 <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-center justify-between gap-2 shadow-xs">
 <div className="flex items-center gap-2 min-w-0">
 <div className="p-1 rounded-md bg-white border border-slate-200 shrink-0">
 <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
 </div>
 <span className="text-slate-700 font-semibold truncate">{t.wearTearCost}</span>
 </div>
 <div className="text-right shrink-0">
 <span className="text-slate-900 font-bold font-mono">${degradationCost.toFixed(2)}</span>
 <span className="text-[10px] text-slate-500 block">{throughputKwh.toFixed(1)} kWh cycled</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
