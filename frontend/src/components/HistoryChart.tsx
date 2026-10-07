"use client";

import React, { useEffect, useState } from "react";
import { Clock3, Database, Leaf, SunMedium, BatteryMedium, Network } from "lucide-react";
import { fetchTelemetryHistory } from "../lib/api";
import { TelemetryHistoryPoint } from "../lib/types";

const series = [
  { key: "facility_load_kw", label: "Facility load", unit: "kW", color: "#d9774a", icon: Network },
  { key: "solar_output_kw", label: "Solar output", unit: "kW", color: "#4f8b61", icon: SunMedium },
  { key: "battery_soc_pct", label: "Battery charge", unit: "%", color: "#507bb6", icon: BatteryMedium },
  { key: "grid_power_kw", label: "Grid flow", unit: "kW", color: "#9164a4", icon: Leaf },
] as const;

type SeriesKey = (typeof series)[number]["key"];

function chartPath(rows: TelemetryHistoryPoint[], key: SeriesKey): string {
  if (rows.length < 2) return "";
  const values = rows.map((row) => row[key]);
  const minimum = Math.min(...values, 0);
  const maximum = Math.max(...values, 1);
  const range = Math.max(maximum - minimum, 1);
  return values.map((value, index) => {
    const x = 8 + (index / (values.length - 1)) * 284;
    const y = 82 - ((value - minimum) / range) * 68;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

export function HistoryChart() {
  const [hours, setHours] = useState(24);
  const [rows, setRows] = useState<TelemetryHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchTelemetryHistory(hours).then((data) => {
      if (active) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [hours]);

  const seeded = rows.filter((row) => row.source === "SEEDED_DEMO").length;
  const live = rows.length - seeded;

  return (
    <section className="scada-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e9e0d2] pb-4">
        <div>
          <p className="eyebrow">Looking back</p>
          <h2 className="section-title">How the microgrid has been behaving</h2>
          <p className="mt-1 text-sm text-slate-600">Seeded demo history and samples recorded while this app is running.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Clock3 className="h-4 w-4 text-[#52795d]" />
          <span>Window</span>
          <select className="rounded-xl border border-[#ddd2c1] bg-white px-3 py-2" value={hours} onChange={(event) => { setLoading(true); setHours(Number(event.target.value)); }}>
            <option value={24}>Past 24 hours</option>
            <option value={72}>Past 3 days</option>
            <option value={168}>Past 7 days</option>
            <option value={720}>Past 30 days</option>
          </select>
        </label>
      </div>

      <div className="my-4 flex flex-wrap gap-2 text-xs">
        <span className="source-chip"><Database className="h-3.5 w-3.5" /> {seeded.toLocaleString()} seeded demo points</span>
        <span className="source-chip source-chip-live"><span className="h-2 w-2 rounded-full bg-[#4f8b61]" /> {live.toLocaleString()} live simulation points</span>
      </div>

      {loading ? <p className="py-12 text-center text-sm text-slate-500">Gathering readings for this time window…</p> : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9cebd] bg-[#fbf8f2] px-5 py-10 text-center">
          <p className="font-semibold text-slate-700">No readings in this window yet.</p>
          <p className="mt-1 text-sm text-slate-500">Start the backend and let it collect a few samples. History is saved about once a minute.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {series.map((item) => {
            const Icon = item.icon;
            const latest = rows[rows.length - 1][item.key];
            return (
              <div key={item.key} className="history-card">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Icon className="h-4 w-4" style={{ color: item.color }} />{item.label}</span>
                  <span className="font-mono text-sm font-bold text-slate-800">{latest.toFixed(1)} {item.unit}</span>
                </div>
                <svg viewBox="0 0 300 92" className="mt-3 h-24 w-full" role="img" aria-label={`${item.label} history, latest ${latest.toFixed(1)} ${item.unit}`}>
                  <path d="M 8 82 H 292" stroke="#e7e1d7" strokeWidth="1" />
                  <path d={chartPath(rows, item.key)} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-1 flex justify-between text-[10px] text-slate-400"><span>{new Date(rows[0].timestamp).toLocaleString()}</span><span>{new Date(rows[rows.length - 1].timestamp).toLocaleString()}</span></p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
