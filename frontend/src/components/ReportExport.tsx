"use client";

import React, { useState } from "react";
import { Download } from "lucide-react";
import { DispatchPlan, ScenarioSummary, TelemetryPoint } from "../lib/types";
import { fetchDispatchComparison } from "../lib/api";

interface ReportExportProps {
  telemetry: TelemetryPoint | null;
  dispatch: DispatchPlan | null;
  scenario: ScenarioSummary | null;
}

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character] ?? character));

export function ReportExport({ telemetry, dispatch, scenario }: ReportExportProps) {
  const [busy, setBusy] = useState(false);

  const downloadReport = async () => {
    setBusy(true);
    try {
      const comparison = await fetchDispatchComparison();
      const generated = new Date().toLocaleString();
      const schedule = (dispatch?.schedule ?? []).map((row) => `<tr><td>${escapeHtml(new Date(row.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</td><td>${row.solar_kw.toFixed(1)}</td><td>${row.demand_kw.toFixed(1)}</td><td>${row.battery_soc_pct.toFixed(1)}%</td><td>${row.grid_import_kw.toFixed(1)}</td><td>${escapeHtml(row.dispatch_action)}</td><td>${escapeHtml(row.action_rationale)}</td></tr>`).join("");
      const beforeAfter = scenario ? `<h2>Scenario comparison: ${escapeHtml(scenario.name)}</h2><p>${escapeHtml(scenario.explanation)}</p><table><thead><tr><th>Reading</th><th>Before</th><th>After</th></tr></thead><tbody>${[
        ["Solar output (kW)", scenario.before.solar_output_kw, scenario.after.solar_output_kw],
        ["Facility load (kW)", scenario.before.facility_load_kw, scenario.after.facility_load_kw],
        ["Battery SoC (%)", scenario.before.battery_soc_pct, scenario.after.battery_soc_pct],
        ["Grid flow (kW)", scenario.before.grid_power_kw, scenario.after.grid_power_kw],
      ].map(([label, before, after]) => `<tr><td>${escapeHtml(label)}</td><td>${Number(before).toFixed(1)}</td><td>${Number(after).toFixed(1)}</td></tr>`).join("")}</tbody></table>` : "<h2>Scenario comparison</h2><p>No what-if scenario was selected during this session.</p>";
      const assumptions = comparison.assumptions.map((assumption) => `<li>${escapeHtml(assumption)}</li>`).join("");
      const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>GreenSync demo report</title><style>body{font:15px/1.55 'Trebuchet MS',Arial,sans-serif;max-width:1000px;margin:40px auto;padding:0 24px;color:#29362f;background:#fbf9f4}h1,h2{font-family:Cambria,Georgia,serif}h1{font-size:34px}h2{margin-top:32px;color:#477b58}p{color:#536057}.meta{color:#777}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{padding:16px;background:#fff;border:1px solid #e4ded3;border-radius:14px}.card strong{display:block;font-size:22px;color:#477b58}table{width:100%;border-collapse:collapse;background:white;font-size:13px}th,td{text-align:left;padding:9px;border-bottom:1px solid #e8e2d8}th{background:#eef3ea}li{margin:.5em 0}.notice{padding:14px;border-left:4px solid #bd7845;background:#f7efe4}@media print{body{margin:0;background:white}.no-print{display:none}}</style><body><p class="eyebrow">GreenSync • placement demo</p><h1>Microgrid simulation report</h1><p class="meta">Generated ${escapeHtml(generated)}. All values are software simulation estimates.</p><div class="cards"><div class="card">Current solar<strong>${(telemetry?.solar_output_kw ?? 0).toFixed(1)} kW</strong></div><div class="card">Battery charge<strong>${(telemetry?.battery_soc_pct ?? 0).toFixed(1)}%</strong></div><div class="card">Current grid flow<strong>${(telemetry?.grid_power_kw ?? 0).toFixed(1)} kW</strong></div></div>${beforeAfter}<h2>Dispatch estimate</h2><div class="cards"><div class="card">Rule-based cost<strong>$${(comparison.heuristic.total_cost_usd).toFixed(2)}</strong><span>${escapeHtml(comparison.heuristic.solver_name)}</span></div><div class="card">Look-ahead cost<strong>$${(comparison.optimizer.total_cost_usd).toFixed(2)}</strong><span>${escapeHtml(comparison.optimizer.solver_name)}</span></div><div class="card">Estimated cost difference<strong>$${(comparison.heuristic.total_cost_usd - comparison.optimizer.total_cost_usd).toFixed(2)}</strong><span>Positive means the look-ahead plan is lower.</span></div></div><p class="notice">Planning comparison only. No recommendation is sent to physical equipment. The look-ahead method uses a discrete dynamic-programming model and the assumptions listed below.</p><h2>Dispatch intervals</h2><table><thead><tr><th>Time</th><th>Solar kW</th><th>Load kW</th><th>SoC</th><th>Grid import kW</th><th>Choice</th><th>Reason</th></tr></thead><tbody>${schedule}</tbody></table><h2>Model assumptions</h2><ul>${assumptions}</ul><button class="no-print" onclick="window.print()">Print or save as PDF</button></body></html>`;
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `greensync-report-${new Date().toISOString().slice(0, 10)}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return <button type="button" onClick={downloadReport} disabled={busy} className="quiet-button"><Download className="h-4 w-4" />{busy ? "Preparing report…" : "Download demo report"}</button>;
}
