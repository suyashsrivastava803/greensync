"use client";

import React, { useState } from"react";
import { TrendingUp, Layers } from"lucide-react";
import { ForecastHorizonItem } from"../lib/types";
import { useLanguage } from"../lib/LanguageContext";
import { useTheme } from"../lib/ThemeContext";

interface RollingForecastChartProps {
 forecast: ForecastHorizonItem[];
 modelInfo?: {
 version: string;
 };
}

export const RollingForecastChart: React.FC<RollingForecastChartProps> = ({
 forecast,
 modelInfo,
}) => {
 const { t } = useLanguage();
 const { theme } = useTheme();
 const [hoverIndex, setHoverIndex] = useState<number | null>(null);
 const [visibleSeries, setVisibleSeries] = useState({
 demand: true,
 solar: true,
 tariff: true,
 envelope: true,
 });

 if (!forecast || forecast.length === 0) {
 return (
 <div className="scada-panel p-6 text-slate-500 font-mono text-center">
 Gathering simulated rolling forecast data...
 </div>
 );
 }

 // Chart Dimensions
 const width = 800;
 const height = 280;
 const padding = { top: 25, right: 55, bottom: 35, left: 55 };
 const chartW = width - padding.left - padding.right;
 const chartH = height - padding.top - padding.bottom;

 // Maximum scales
 const maxKw = Math.max(
 ...forecast.map((f) => Math.max(f.demand_p90_kw, f.solar_p90_kw)),
 140
 );
 const maxTariff = 0.40; // $0.40/kWh

 const getX = (index: number) => padding.left + (index / (forecast.length - 1)) * chartW;
 const getYPower = (kw: number) => padding.top + chartH - (kw / maxKw) * chartH;
 const getYTariff = (rate: number) => padding.top + chartH - (rate / maxTariff) * chartH;

 // Build SVG Paths
 const demandP50Path = forecast
 .map((d, i) => `${i === 0 ?"M" :"L"} ${getX(i)} ${getYPower(d.demand_p50_kw)}`)
 .join("");

 const demandEnvelopePath =
 forecast.map((d, i) => `${i === 0 ?"M" :"L"} ${getX(i)} ${getYPower(d.demand_p90_kw)}`).join("") +"" +
 forecast
 .slice()
 .reverse()
 .map((d, i) => `L ${getX(forecast.length - 1 - i)} ${getYPower(d.demand_p10_kw)}`)
 .join("") +" Z";

 const solarP50Path = forecast
 .map((d, i) => `${i === 0 ?"M" :"L"} ${getX(i)} ${getYPower(d.solar_p50_kw)}`)
 .join("");

 const solarEnvelopePath =
 forecast.map((d, i) => `${i === 0 ?"M" :"L"} ${getX(i)} ${getYPower(d.solar_p90_kw)}`).join("") +"" +
 forecast
 .slice()
 .reverse()
 .map((d, i) => `L ${getX(forecast.length - 1 - i)} ${getYPower(d.solar_p10_kw)}`)
 .join("") +" Z";

 const tariffPath = forecast
 .map((d, i) => `${i === 0 ?"M" :"L"} ${getX(i)} ${getYTariff(d.predicted_tariff)}`)
 .join("");

 const hoveredItem = hoverIndex !== null ? forecast[hoverIndex] : forecast[Math.floor(forecast.length / 2)];

 return (
 <div className="scada-panel p-5 text-slate-800 flex flex-col justify-between">
 {/* Header */}
 <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3 mb-4">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded-lg bg-teal-100 text-teal-700 border border-teal-200 shrink-0">
 <TrendingUp className="w-4 h-4" />
 </div>
 <div>
 <div className="flex flex-wrap items-center gap-2">
 <h2 className="text-sm font-bold tracking-wide uppercase text-slate-900">
 {t.forecastTitle}
 </h2>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300 font-bold whitespace-nowrap">
 {modelInfo?.version ||"Physics-Diurnal-v1"}
 </span>
 </div>
 <p className="text-[11px] text-slate-500 font-mono mt-0.5">
 {t.forecastSubtitle}
 </p>
 </div>
 </div>

 {/* Legend / Toggles */}
 <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono shrink-0">
 <button
 type="button"
 onClick={() => setVisibleSeries((s) => ({ ...s, demand: !s.demand }))}
 className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition font-bold text-[11px] cursor-pointer ${
 visibleSeries.demand
 ?"bg-sky-100 text-sky-900 border-sky-300"
 :"bg-slate-100 text-slate-400 border-slate-200"
 }`}
 >
 <span className="w-2.5 h-1 rounded-sm bg-sky-500" />
 <span>{t.demandP50}</span>
 </button>

 <button
 type="button"
 onClick={() => setVisibleSeries((s) => ({ ...s, solar: !s.solar }))}
 className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition font-bold text-[11px] cursor-pointer ${
 visibleSeries.solar
 ?"bg-emerald-100 text-emerald-900 border-emerald-300"
 :"bg-slate-100 text-slate-400 border-slate-200"
 }`}
 >
 <span className="w-2.5 h-1 rounded-sm bg-emerald-500" />
 <span>{t.solarP50}</span>
 </button>

 <button
 type="button"
 onClick={() => setVisibleSeries((s) => ({ ...s, tariff: !s.tariff }))}
 className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition font-bold text-[11px] cursor-pointer ${
 visibleSeries.tariff
 ?"bg-amber-100 text-amber-900 border-amber-300"
 :"bg-slate-100 text-slate-400 border-slate-200"
 }`}
 >
 <span className="w-2.5 h-1 rounded-sm bg-amber-500 border border-dashed border-amber-400" />
 <span>{t.tariffRate}</span>
 </button>

 <button
 type="button"
 onClick={() => setVisibleSeries((s) => ({ ...s, envelope: !s.envelope }))}
 className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition font-bold text-[11px] cursor-pointer ${
 visibleSeries.envelope
 ?"bg-purple-100 text-purple-900 border-purple-300"
 :"bg-slate-100 text-slate-400 border-slate-200"
 }`}
 >
 <Layers className="w-3 h-3 text-purple-600" />
 <span>{t.bandsP10P90}</span>
 </button>
 </div>
 </div>

 {/* SVG Chart Graphic */}
 <div className="relative w-full overflow-hidden">
 <svg
 viewBox={`0 0 ${width} ${height}`}
 className="w-full h-auto select-none"
 onMouseLeave={() => setHoverIndex(null)}
 >
 {/* Horizontal Grid lines */}
 {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
 const y = padding.top + chartH * (1 - pct);
 const kwVal = Math.round(maxKw * pct);
 const tariffVal = (maxTariff * pct).toFixed(2);
 return (
 <g key={idx}>
 <line
 x1={padding.left}
 y1={y}
 x2={width - padding.right}
 y2={y}
 stroke={theme ==="light" ?"#e2e8f0" :"#1e293b"}
 strokeDasharray="4 4"
 />
 {/* Left Y Axis (kW) */}
 <text
 x={padding.left - 8}
 y={y + 3}
 textAnchor="end"
 className={theme ==="light" ?"fill-slate-500 text-[10px] font-mono" :"fill-slate-400 text-[10px] font-mono"}
 >
 {kwVal}kW
 </text>
 {/* Right Y Axis ($/kWh) */}
 <text
 x={width - padding.right + 8}
 y={y + 3}
 textAnchor="start"
 className="fill-amber-600 text-[10px] font-mono font-bold"
 >
 ${tariffVal}
 </text>
 </g>
 );
 })}

 {/* Time markers on X Axis */}
 {forecast.map((step, i) => {
 if (i % 4 === 0 || i === forecast.length - 1) {
 const x = getX(i);
 const dt = new Date(step.timestamp);
 const label = dt.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
 return (
 <g key={i}>
 <line
 x1={x}
 y1={padding.top + chartH}
 x2={x}
 y2={padding.top + chartH + 5}
 stroke={theme ==="light" ?"#cbd5e1" :"#475569"}
 />
 <text
 x={x}
 y={padding.top + chartH + 18}
 textAnchor="middle"
 className={theme ==="light" ?"fill-slate-600 text-[10px] font-mono font-semibold" :"fill-slate-400 text-[10px] font-mono"}
 >
 {label}
 </text>
 </g>
 );
 }
 return null;
 })}

 {/* P10-P90 Confidence Envelopes */}
 {visibleSeries.envelope && (
 <>
 {visibleSeries.demand && (
 <path d={demandEnvelopePath} fill={theme ==="light" ?"rgba(14, 165, 233, 0.12)" :"rgba(56, 189, 248, 0.12)"} />
 )}
 {visibleSeries.solar && (
 <path d={solarEnvelopePath} fill={theme ==="light" ?"rgba(16, 185, 129, 0.12)" :"rgba(16, 185, 129, 0.12)"} />
 )}
 </>
 )}

 {/* Curves */}
 {visibleSeries.tariff && (
 <path
 d={tariffPath}
 fill="none"
 stroke="#d97706"
 strokeWidth="2"
 strokeDasharray="4 4"
 />
 )}

 {visibleSeries.solar && (
 <path
 d={solarP50Path}
 fill="none"
 stroke="#059669"
 strokeWidth="2.5"
 strokeLinecap="round"
 />
 )}

 {visibleSeries.demand && (
 <path
 d={demandP50Path}
 fill="none"
 stroke="#0284c7"
 strokeWidth="2.5"
 strokeLinecap="round"
 />
 )}

 {/* Hover Overlay Columns */}
 {forecast.map((_, i) => {
 const x = getX(i);
 const w = chartW / forecast.length;
 return (
 <rect
 key={i}
 x={x - w / 2}
 y={padding.top}
 width={w}
 height={chartH}
 fill="transparent"
 className="cursor-pointer hover:fill-emerald-500/10"
 onMouseEnter={() => setHoverIndex(i)}
 />
 );
 })}

 {/* Hover Guideline */}
 {hoverIndex !== null && (
 <line
 x1={getX(hoverIndex)}
 y1={padding.top}
 x2={getX(hoverIndex)}
 y2={padding.top + chartH}
 stroke="#0d9488"
 strokeWidth="1.5"
 strokeDasharray="3 3"
 />
 )}
 </svg>

 {/* Hover Telemetry Card */}
 {hoveredItem && (
 <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-xs">
 <div className="flex items-center gap-1.5 font-bold min-w-0">
 <span className="text-slate-500">{t.stepTime}</span>
 <span className="text-slate-900 truncate">
 {new Date(hoveredItem.timestamp).toLocaleTimeString([], {
 hour:"2-digit",
 minute:"2-digit",
 })}{""}
 <span className="text-[10px] text-slate-400 font-normal">(+{hoveredItem.hour_offset}h)</span>
 </span>
 </div>

 <div className="flex items-center gap-1.5 min-w-0">
 <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
 <div className="truncate">
 <span className="text-slate-500 mr-1">{t.demandP50}:</span>
 <span className="text-sky-800 font-bold">
 {hoveredItem.demand_p50_kw} kW
 </span>
 </div>
 </div>

 <div className="flex items-center gap-1.5 min-w-0">
 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
 <div className="truncate">
 <span className="text-slate-500 mr-1">{t.solarP50}:</span>
 <span className="text-emerald-800 font-bold">
 {hoveredItem.solar_p50_kw} kW
 </span>
 </div>
 </div>

 <div className="flex items-center gap-1.5 min-w-0">
 <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
 <div className="truncate">
 <span className="text-slate-500 mr-1">{t.tariffRate}:</span>
 <span
 className={`font-bold ${
 hoveredItem.predicted_tariff >= 0.3 ?"text-amber-800" :"text-slate-800"
 }`}
 >
 ${hoveredItem.predicted_tariff.toFixed(3)}
 </span>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
};
