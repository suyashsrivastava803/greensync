"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeftRight, BrainCircuit, CircleHelp } from "lucide-react";
import { fetchDispatchComparison } from "../lib/api";
import { DispatchComparison } from "../lib/types";

interface SolverComparisonProps { refreshKey: number; }

function PlanCard({ title, plan, accent }: { title: string; plan: DispatchComparison["heuristic"]; accent: string }) {
  const unmet = plan.schedule.reduce((total, step) => total + (step.unserved_load_kw ?? 0), 0);
  return (
    <article className="rounded-2xl border border-[#e7e0d5] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><p className="eyebrow">{title}</p><h3 className="mt-1 font-serif text-xl font-bold text-[#304237]">{plan.solver_name}</h3></div>
        <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ color: accent, backgroundColor: `${accent}18` }}>{plan.objective_status.replaceAll("_", " ")}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div><p className="text-xs text-slate-500">Estimated run cost</p><p className="metric-value">${plan.total_cost_usd.toFixed(2)}</p></div>
        <div><p className="text-xs text-slate-500">Estimated savings</p><p className={`metric-value ${plan.total_savings_usd < 0 ? "text-[#ad6241]" : "text-[#477b58]"}`}>${plan.total_savings_usd.toFixed(2)}</p></div>
        <div><p className="text-xs text-slate-500">Battery throughput</p><p className="font-mono text-base font-bold text-slate-800">{plan.battery_throughput_kwh.toFixed(1)} kWh</p></div>
        <div><p className="text-xs text-slate-500">Unserved demand</p><p className={`font-mono text-base font-bold ${unmet > 0.1 ? "text-[#ad6241]" : "text-slate-800"}`}>{unmet.toFixed(1)} kW-samples</p></div>
      </div>
    </article>
  );
}

export function SolverComparison({ refreshKey }: SolverComparisonProps) {
  const [comparison, setComparison] = useState<DispatchComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchDispatchComparison().then((value) => {
      if (active) { setComparison(value); setLoading(false); }
    });
    return () => { active = false; };
  }, [refreshKey]);

  return (
    <section className="scada-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e9e0d2] pb-4">
        <div>
          <p className="eyebrow">Two ways to make the call</p>
          <h2 className="section-title">Dispatch planner comparison</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">The current rules react interval by interval. The discrete optimizer looks across the full forecast before choosing when to use the battery.</p>
        </div>
        <div className="rounded-2xl bg-[#edf1f7] p-2.5 text-[#507bb6]"><ArrowLeftRight className="h-5 w-5" /></div>
      </div>
      {loading ? <p className="py-10 text-center text-sm text-slate-500">Comparing the two dispatch plans…</p> : comparison ? (
        <>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <PlanCard title="Baseline approach" plan={comparison.heuristic} accent="#b77a42" />
            <PlanCard title="Look-ahead approach" plan={comparison.optimizer} accent="#507bb6" />
          </div>
          <details className="mt-4 rounded-xl bg-[#f8f6f0] px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-700"><CircleHelp className="h-4 w-4 text-[#66806a]" />How the optimizer makes its choices</summary>
            <ul className="mt-3 space-y-2 pl-5 text-sm text-slate-600">
              {comparison.assumptions.map((assumption) => <li key={assumption} className="list-disc">{assumption}</li>)}
            </ul>
          </details>
        </>
      ) : <p className="py-8 text-center text-sm text-slate-500"><BrainCircuit className="mr-1 inline h-4 w-4" />No comparison is available.</p>}
    </section>
  );
}
