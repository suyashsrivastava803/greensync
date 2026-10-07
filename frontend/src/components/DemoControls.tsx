"use client";

import React, { useEffect, useState } from "react";
import { RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { fetchDemoControls, resetDemoControls, saveDemoControls } from "../lib/api";

interface DemoControlsProps { onApplied: () => Promise<void>; onReset: () => void; }

const initial = { time_of_day: "", starting_soc_pct: "68.5", cloud_cover_pct: "", temperature_c: "", facility_load_kw: "" };

export function DemoControlsPanel({ onApplied, onReset }: DemoControlsProps) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetchDemoControls().then((saved) => {
      if (!active || !saved) return;
      setForm({
        time_of_day: saved.time_of_day ?? "",
        starting_soc_pct: String(saved.starting_soc_pct),
        cloud_cover_pct: saved.cloud_cover_pct === null ? "" : String(saved.cloud_cover_pct),
        temperature_c: saved.temperature_c === null ? "" : String(saved.temperature_c),
        facility_load_kw: saved.facility_load_kw === null ? "" : String(saved.facility_load_kw),
      });
    });
    return () => { active = false; };
  }, []);

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const nullableNumber = (value: string) => value.trim() === "" ? null : Number(value);

  const apply = async () => {
    setBusy(true);
    setMessage("");
    try {
      await saveDemoControls({
        time_of_day: form.time_of_day || null,
        starting_soc_pct: Number(form.starting_soc_pct),
        cloud_cover_pct: nullableNumber(form.cloud_cover_pct),
        temperature_c: nullableNumber(form.temperature_c),
        facility_load_kw: nullableNumber(form.facility_load_kw),
      });
      await onApplied();
      setMessage("These settings are now driving the simulation.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not apply demo settings.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await resetDemoControls();
      setForm(initial);
      onReset();
      await onApplied();
      setMessage("Back to the standard simulated profile.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset the demo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="scada-panel p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-[#e9e0d2] pb-4">
        <div>
          <p className="eyebrow">Set the scene</p>
          <h2 className="section-title">Demo controls</h2>
          <p className="mt-1 text-sm text-slate-600">Choose the conditions you want to show. Blank weather and load fields use the simulator’s normal profile.</p>
        </div>
        <div className="rounded-2xl bg-[#f1efe6] p-2.5 text-[#678164]"><SlidersHorizontal className="h-5 w-5" /></div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="field-label">Time of day <span className="field-hint">India time</span>
          <input className="field-input" type="time" value={form.time_of_day} onChange={(e) => set("time_of_day", e.target.value)} />
        </label>
        <label className="field-label">Starting battery <span className="field-hint">20–95%</span>
          <input className="field-input" type="number" min="20" max="95" step="0.5" value={form.starting_soc_pct} onChange={(e) => set("starting_soc_pct", e.target.value)} />
        </label>
        <label className="field-label">Cloud cover <span className="field-hint">0–100%, blank = normal</span>
          <input className="field-input" type="number" min="0" max="100" step="1" placeholder="Normal profile" value={form.cloud_cover_pct} onChange={(e) => set("cloud_cover_pct", e.target.value)} />
        </label>
        <label className="field-label">Air temperature <span className="field-hint">°C, blank = normal</span>
          <input className="field-input" type="number" min="-20" max="60" step="0.5" placeholder="Normal profile" value={form.temperature_c} onChange={(e) => set("temperature_c", e.target.value)} />
        </label>
        <label className="field-label">Facility load <span className="field-hint">kW, blank = normal</span>
          <input className="field-input" type="number" min="0" max="200" step="1" placeholder="Normal profile" value={form.facility_load_kw} onChange={(e) => set("facility_load_kw", e.target.value)} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={apply} disabled={busy} className="action-button">
          <Sparkles className="h-4 w-4" />{busy ? "Applying…" : "Apply demo settings"}
        </button>
        <button type="button" onClick={reset} disabled={busy} className="quiet-button"><RotateCcw className="h-4 w-4" />Reset to standard profile</button>
        {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
      </div>
    </section>
  );
}
