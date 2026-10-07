"use client";

import React from"react";
import { DollarSign, Leaf, TrendingDown, PieChart, Sparkles } from"lucide-react";
import { DispatchPlan } from"../lib/types";
import { useLanguage } from"../lib/LanguageContext";

interface EconomicBreakdownProps {
 dispatchPlan: DispatchPlan | null;
}

export const EconomicBreakdown: React.FC<EconomicBreakdownProps> = ({ dispatchPlan }) => {
 const { t } = useLanguage();
 const optimizedCost = dispatchPlan?.total_cost_usd ?? 14.85;
 const baselineCost = dispatchPlan?.total_baseline_cost_usd ?? 48.6;
 const savingsUsd = dispatchPlan?.total_savings_usd ?? 33.75;
 const savingsPct = dispatchPlan?.savings_pct ?? 69.4;
 const carbonKg = dispatchPlan?.carbon_abated_kg ?? 84.2;
 const degCost = dispatchPlan?.battery_degradation_cost_usd ?? 2.25;

 return (
 <div className="scada-panel p-5 text-slate-800 flex flex-col justify-between">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3 mb-4">
 <div className="flex items-center gap-2">
 <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 border border-emerald-200">
 <DollarSign className="w-4 h-4" />
 </div>
 <div>
 <h2 className="text-sm font-bold tracking-wide uppercase text-slate-900">
 {t.impactTitle}
 </h2>
 <p className="text-[11px] text-slate-500 font-mono">
 {t.impactSubtitle}
 </p>
 </div>
 </div>

 <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
 <Sparkles className="w-3 h-3 text-emerald-600" />
 <span>{t.rollingHorizonLabel}</span>
 </div>
 </div>

 {/* Metrics 2x2 Grid - Guaranteed ZERO text overlap on any screen width */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
 {/* Tile 1: Net Savings */}
 <div className="min-h-[115px] p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between">
 <div className="flex items-center gap-2 text-slate-700 text-xs mb-1 font-semibold">
 <div className="p-1 rounded-md bg-white border border-slate-200">
 <TrendingDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
 </div>
 <span className="truncate">{t.netSavings}</span>
 </div>
 <div>
 <div className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
 +${savingsUsd.toFixed(2)}
 </div>
 <div className="text-xs font-bold text-emerald-600 mt-0.5">
 {savingsPct.toFixed(1)}% {t.savedLabel}
 </div>
 </div>
 <span className="text-[10px] text-slate-500 block mt-1">
 {t.vsUnmanaged}
 </span>
 </div>

 {/* Tile 2: Carbon Abated */}
 <div className="min-h-[115px] p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between">
 <div className="flex items-center gap-2 text-slate-700 text-xs mb-1 font-semibold">
 <div className="p-1 rounded-md bg-white border border-slate-200">
 <Leaf className="w-3.5 h-3.5 text-teal-600 shrink-0" />
 </div>
 <span className="truncate">{t.carbonAbated}</span>
 </div>
 <div>
 <div className="flex items-baseline gap-1.5 font-mono">
 <span className="text-2xl font-black text-slate-900 tracking-tight">
 {carbonKg.toFixed(1)}
 </span>
 <span className="text-xs font-bold text-slate-600">kg CO₂</span>
 </div>
 </div>
 <span className="text-[10px] text-slate-500 block mt-1">
 {t.gridDisplacement}
 </span>
 </div>

 {/* Tile 3: GreenSync Optimized Cost */}
 <div className="min-h-[115px] p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between">
 <div className="flex items-center gap-2 text-slate-700 text-xs mb-1 font-semibold">
 <div className="p-1 rounded-md bg-white border border-slate-200">
 <PieChart className="w-3.5 h-3.5 text-teal-600 shrink-0" />
 </div>
 <span className="truncate">{t.optimizedCost}</span>
 </div>
 <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
 ${optimizedCost.toFixed(2)}
 </div>
 <span className="text-[10px] text-slate-500 block mt-1">
 {t.inclWear} (${degCost.toFixed(2)})
 </span>
 </div>

 {/* Tile 4: Baseline Unmanaged Cost */}
 <div className="min-h-[115px] p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col justify-between">
 <div className="flex items-center gap-2 text-slate-700 text-xs mb-1 font-semibold">
 <div className="p-1 rounded-md bg-white border border-slate-200">
 <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
 </div>
 <span className="truncate">{t.unmanagedBaseline}</span>
 </div>
 <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
 ${baselineCost.toFixed(2)}
 </div>
 <span className="text-[10px] text-slate-500 block mt-1">
 {t.netDeficitGrid}
 </span>
 </div>
 </div>

 {/* Visual Cost Comparison Bar */}
 <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 mb-1.5 gap-1">
 <span>{t.expenseComparison}</span>
 <span>
 {t.payingPercentage}{""}
 <strong className="text-emerald-600 font-bold">
 {(100 - savingsPct).toFixed(1)}%
 </strong>
 </span>
 </div>

 <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
 <div
 className="bg-emerald-500 h-full transition-all duration-700"
 style={{ width: `${Math.max(5, (optimizedCost / baselineCost) * 100)}%` }}
 title="Optimized Cost"
 />
 <div
 className="bg-slate-400/40 h-full transition-all duration-700"
 style={{ width: `${Math.max(0, (savingsUsd / baselineCost) * 100)}%` }}
 title="Savings Avoided"
 />
 </div>

 <div className="flex flex-wrap justify-between text-[10px] text-slate-500 mt-1.5 gap-2">
 <span className="text-emerald-700 font-semibold">
 ■ {t.optimizedCost}: ${optimizedCost.toFixed(2)}
 </span>
 <span className="text-slate-600">
 ■ {t.netSavings}: ${savingsUsd.toFixed(2)}
 </span>
 </div>
 </div>
 </div>
 );
};
