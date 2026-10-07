"use client";

import React, { useState } from"react";
import { SlidersHorizontal, ArrowUpRight, ArrowDownLeft, BatteryCharging, Zap, CheckCircle2 } from"lucide-react";
import { DispatchDecisionItem } from"../lib/types";
import { useLanguage } from"../lib/LanguageContext";

interface DispatchMatrixProps {
 schedule: DispatchDecisionItem[];
 objectiveStatus?: string;
}

export const DispatchMatrix: React.FC<DispatchMatrixProps> = ({ schedule, objectiveStatus }) => {
 const { t } = useLanguage();
 const [filter, setFilter] = useState<string>("ALL");
 const [expandedRow, setExpandedRow] = useState<number | null>(null);

 const getActionBadge = (action: string) => {
 switch (action) {
 case"PEAK_SHAVING_DISCHARGE":
 case"PEAK_SHAVING_HYBRID":
 return {
 bg:"bg-amber-100 text-amber-900 border-amber-300",
 icon: <Zap className="w-3 h-3 text-amber-600" />,
 label: t.actionPeakShaving,
 };
 case"SOLAR_BATTERY_STORAGE":
 return {
 bg:"bg-emerald-100 text-emerald-900 border-emerald-300",
 icon: <BatteryCharging className="w-3 h-3 text-emerald-600" />,
 label: t.actionStoreSolar,
 };
 case"SOLAR_EXPORT_SURPLUS":
 return {
 bg:"bg-cyan-100 text-cyan-900 border-cyan-300",
 icon: <ArrowUpRight className="w-3 h-3 text-cyan-600" />,
 label: t.actionCleanExport,
 };
 case"ISLAND_LOAD_SHED":
 case"ISLAND_BATTERY_SUPPORT":
 case"ISLAND_SOLAR_CHARGE":
 return {
 bg:"bg-red-100 text-red-900 border-red-300",
 icon: <Zap className="w-3 h-3 text-red-600" />,
 label: t.actionIslandedSupport,
 };
 case"FORCE_CHARGE_GRID":
 return {
 bg:"bg-indigo-100 text-indigo-900 border-indigo-300",
 icon: <ArrowDownLeft className="w-3 h-3 text-indigo-600" />,
 label: t.actionForceCharge,
 };
 case"LOAD_NOT_SERVED":
 return {
 bg:"bg-rose-100 text-rose-900 border-rose-300",
 icon: <Zap className="w-3 h-3 text-rose-600" />,
 label: "Demand not met",
 };
 default:
 return {
 bg:"bg-slate-100 text-slate-800 border-slate-300",
 icon: <CheckCircle2 className="w-3 h-3 text-slate-500" />,
 label: t.actionSelfConsume,
 };
 }
 };

 const filteredSchedule = schedule.filter((item) => {
 if (filter ==="ALL") return true;
 if (filter ==="PEAK") return item.dispatch_action.includes("PEAK");
 if (filter ==="STORAGE") return item.battery_charge_kw > 0;
 if (filter ==="EXPORT") return item.grid_export_kw > 0;
 return true;
 });

 return (
 <div className="scada-panel p-5 text-slate-800 flex flex-col justify-between">
 {/* Header with zero overlap */}
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3 mb-4">
 <div className="flex items-center gap-2.5">
 <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 border border-emerald-200 shrink-0">
 <SlidersHorizontal className="w-4 h-4" />
 </div>
 <div>
 <div className="flex flex-wrap items-center gap-2">
 <h2 className="text-sm font-bold tracking-wide uppercase text-slate-900">
 {t.scheduleTitle}
 </h2>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold whitespace-nowrap">
 {objectiveStatus ==="HEURISTIC_DISPATCH" ? "Rule-based estimate" : objectiveStatus ||"Plan pending"}
 </span>
 </div>
 <p className="text-[11px] text-slate-500 font-mono mt-0.5">
 {t.scheduleSubtitle}
 </p>
 </div>
 </div>

 {/* Filter buttons */}
 <div className="flex items-center gap-1.5 font-mono text-xs shrink-0 self-end md:self-auto">
 {[
 { id:"ALL", label: t.filterAll },
 { id:"PEAK", label: t.filterPeak },
 { id:"STORAGE", label: t.filterStorage },
 { id:"EXPORT", label: t.filterExport },
 ].map((btn) => (
 <button
 key={btn.id}
 onClick={() => setFilter(btn.id)}
 className={`px-2.5 py-1 rounded text-[11px] font-bold border transition ${
 filter === btn.id
 ?"bg-emerald-600 text-white border-emerald-700 shadow-xs"
 :"bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200:bg-slate-800"
 }`}
 >
 {btn.label}
 </button>
 ))}
 </div>
 </div>

 {/* Table Container */}
 <div className="overflow-x-auto max-h-[360px] overflow-y-auto pr-1">
 <table className="w-full text-left font-mono text-xs border-collapse">
 <thead className="sticky top-0 bg-emerald-50/90 border-b border-emerald-200 text-slate-700 text-[11px] uppercase tracking-wider backdrop-blur-xs">
 <tr>
 <th className="py-2.5 px-3 min-w-[110px]">{t.colInterval}</th>
 <th className="py-2.5 px-3 min-w-[90px]">{t.colDemand}</th>
 <th className="py-2.5 px-3 min-w-[90px]">{t.colSolar}</th>
 <th className="py-2.5 px-3 min-w-[100px]">{t.colBess}</th>
 <th className="py-2.5 px-3 min-w-[100px]">{t.colGrid}</th>
 <th className="py-2.5 px-3 min-w-[70px]">{t.colSoc}</th>
 <th className="py-2.5 px-3 min-w-[80px]">{t.colTariff}</th>
 <th className="py-2.5 px-3 min-w-[140px]">{t.colDecision}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-emerald-100">
 {filteredSchedule.map((item, idx) => {
 const badge = getActionBadge(item.dispatch_action);
 const isBessDischarging = item.battery_discharge_kw > 0.1;
 const isBessCharging = item.battery_charge_kw > 0.1;
 const isImporting = item.grid_import_kw > 0.1;
 const isExporting = item.grid_export_kw > 0.1;
 const isExpanded = expandedRow === idx;

 return (
 <React.Fragment key={idx}>
 <tr
 onClick={() => setExpandedRow(isExpanded ? null : idx)}
 className="hover:bg-emerald-50/60:bg-slate-800/40 cursor-pointer transition"
 >
 <td className="py-2 px-3 text-slate-900 font-semibold whitespace-nowrap">
 {new Date(item.timestamp).toLocaleTimeString([], {
 hour:"2-digit",
 minute:"2-digit",
 })}
 <span className="text-[10px] text-slate-400 ml-1">
 (+{item.hour_offset}h)
 </span>
 </td>

 <td className="py-2 px-3 text-sky-700 font-bold whitespace-nowrap">
 {item.demand_kw.toFixed(1)} kW
 </td>

 <td className="py-2 px-3 text-emerald-700 font-bold whitespace-nowrap">
 {item.solar_kw.toFixed(1)} kW
 </td>

 <td className="py-2 px-3 whitespace-nowrap font-medium">
 {isBessDischarging ? (
 <span className="text-teal-700">-{item.battery_discharge_kw.toFixed(1)} kW</span>
 ) : isBessCharging ? (
 <span className="text-emerald-700">+{item.battery_charge_kw.toFixed(1)} kW</span>
 ) : (
 <span className="text-slate-400">0.0 kW</span>
 )}
 </td>

 <td className="py-2 px-3 whitespace-nowrap font-medium">
 {isImporting ? (
 <span className="text-amber-700 font-bold">+{item.grid_import_kw.toFixed(1)} kW</span>
 ) : isExporting ? (
 <span className="text-emerald-700 font-bold">-{item.grid_export_kw.toFixed(1)} kW</span>
 ) : (
 <span className="text-slate-400">0.0 kW</span>
 )}
 </td>

 <td className="py-2 px-3 whitespace-nowrap">
 <span className={item.battery_soc_pct < 30 ?"text-amber-700 font-bold" :"text-slate-800"}>
 {item.battery_soc_pct.toFixed(1)}%
 </span>
 </td>

 <td className="py-2 px-3 whitespace-nowrap">
 <span className={item.tariff_rate >= 0.3 ?"text-amber-700 font-bold" :"text-slate-600"}>
 ${item.tariff_rate.toFixed(3)}
 </span>
 </td>

 <td className="py-2 px-3 whitespace-nowrap">
 <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] border font-bold whitespace-nowrap ${badge.bg}`}>
 {badge.icon}
 <span>{badge.label}</span>
 </div>
 </td>
 </tr>

 {/* Expanded Rationale Details */}
 {isExpanded && (
 <tr className="bg-emerald-50/60">
 <td colSpan={8} className="py-3 px-4 text-xs font-mono border-l-4 border-emerald-500">
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
 <p className="text-slate-800">
 <span className="text-emerald-700 font-bold">{t.rationaleLabel} </span>
 {item.action_rationale}
 </p>
 <div className="flex flex-wrap items-center gap-3 text-[11px] shrink-0 font-bold">
 <span className="text-slate-600">
 {t.stepCost} <strong className="text-slate-900">${item.step_cost_usd}</strong>
 </span>
 <span className="text-slate-600">
 {t.baselineCost} <strong className="text-slate-900">${item.baseline_cost_usd}</strong>
 </span>
 <span className="text-emerald-700">
 {t.savedLabel}: +${item.savings_usd}
 </span>
 </div>
 </div>
 </td>
 </tr>
 )}
 </React.Fragment>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 );
};
