import Link from "next/link";
import { ArrowLeft, ArrowRight, Battery, CloudSun, Database, Network } from "lucide-react";

const endpoints = [
  ["GET", "/healthz", "Check whether the local API is responding."],
  ["GET", "/api/v1/telemetry/live", "Read the current simulated bus and battery values."],
  ["GET", "/api/v1/telemetry/history?hours=24", "Read seeded history and saved simulation samples."],
  ["GET", "/api/v1/forecast/rolling?horizon_hours=6", "Build a weather and time-aware forecast."],
  ["GET", "/api/v1/dispatch/compare?horizon_hours=6", "Compare the rule-based planner with dynamic programming."],
  ["POST", "/api/v1/scenarios/inject", "Apply a cloud, grid, load, or reset scenario."],
  ["PUT", "/api/v1/demo/controls", "Set the clock, starting charge, weather, and facility load."],
];

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-7 px-4 py-7 sm:px-7 sm:py-10">
      <Link href="/" className="quiet-button w-fit"><ArrowLeft className="h-4 w-4" />Back to the control room</Link>
      <header className="hero-card">
        <p className="eyebrow text-[#d6e2d2]">GreenSync · project notes</p>
        <h1 className="mt-2 max-w-3xl font-serif text-4xl font-bold leading-tight text-white">A practical little study in balancing energy.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#e1e8dc]">This project lets you explore how solar generation, facility demand, storage, and the utility connection fit together. It is built for learning and presenting: inputs are easy to change, decisions are visible, and the assumptions are written down.</p>
      </header>

      <section className="scada-panel p-5 sm:p-7">
        <p className="eyebrow">What talks to what</p><h2 className="section-title">A simple path from conditions to choices</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            [CloudSun, "Conditions", "Local weather model or optional weather service; demo inputs can set time, cloud, temperature, and load."],
            [Network, "Forecast", "A synthetic diurnal model estimates facility demand and solar output for the next six hours."],
            [Battery, "Dispatch", "Rule-based recommendations are compared with a discrete dynamic-programming optimizer."],
            [Database, "Dashboard", "FastAPI serves readings and history; the browser charts, compares, and exports the results."],
          ].map(([Icon, title, copy]) => {
            const Component = Icon as typeof CloudSun;
            return <article key={String(title)} className="project-card"><Component className="h-5 w-5 text-[#527b5c]" /><h3 className="mt-3 font-serif text-xl font-bold text-[#34483a]">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{String(copy)}</p></article>;
          })}
        </div>
      </section>

      <section className="scada-panel p-5 sm:p-7">
        <p className="eyebrow">Try it in a few minutes</p><h2 className="section-title">A short demo walkthrough</h2>
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            "Open the control room and point out the API status, simulated telemetry label, and last update time.",
            "Set a time, starting battery charge, cloud cover, or facility load in Demo Controls, then apply it.",
            "Pick a cloudy day or grid interruption in What-if Scenarios and compare the before and after readings.",
            "Compare the rule-based plan with the look-ahead optimizer; open the assumptions to explain the trade-offs.",
            "Use the history chart to show seeded context and samples collected while the app is running.",
            "Download the report and use its print button to save a PDF for your presentation.",
          ].map((step, index) => <li key={step} className="project-card flex gap-3"><span className="step-number">{index + 1}</span><p className="text-sm leading-6 text-slate-700">{step}</p></li>)}
        </ol>
      </section>

      <section className="scada-panel overflow-hidden">
        <div className="p-5 sm:p-7"><p className="eyebrow">For curious builders</p><h2 className="section-title">API quick reference</h2><p className="mt-2 text-sm text-slate-600">Interactive request and response examples are also available in FastAPI’s local Swagger page at <a className="text-[#477b58] underline" href="http://127.0.0.1:8000/docs">127.0.0.1:8000/docs</a>.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-[#f3f1e9] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Method</th><th className="px-5 py-3">Route</th><th className="px-5 py-3">Purpose</th></tr></thead><tbody>{endpoints.map(([method, route, purpose]) => <tr key={route} className="border-t border-[#ece6dc]"><td className="px-5 py-3"><span className="rounded-full bg-[#edf3eb] px-2 py-1 text-[10px] font-bold text-[#477b58]">{method}</span></td><td className="px-5 py-3 font-mono text-xs text-[#4d6780]">{route}</td><td className="px-5 py-3 text-slate-600">{purpose}</td></tr>)}</tbody></table></div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="scada-panel p-5 sm:p-7"><p className="eyebrow">Getting started</p><h2 className="section-title">Run it on your laptop</h2><p className="mt-2 text-sm leading-6 text-slate-600">Install Python 3.10+ and Node.js 20.9+, then run the launcher from the project folder:</p><pre className="mt-4 overflow-x-auto rounded-xl bg-[#293e34] p-4 text-sm text-white"><code>.\start-greensync.ps1</code></pre><p className="mt-3 text-sm text-slate-600">Dashboard: <a className="underline" href="http://localhost:3000">localhost:3000</a>. Stop the services with <code>.\stop-greensync.ps1</code>.</p></article>
        <article className="scada-panel p-5 sm:p-7"><p className="eyebrow">Keep the story honest</p><h2 className="section-title">What this project is — and isn’t</h2><p className="mt-2 text-sm leading-6 text-slate-600">Forecasts, dispatch costs, carbon estimates, and telemetry are simulated. The optimizer is a discrete dynamic-programming model; it is not a continuous LP solver. The project has no connection to inverters, physical breakers, or certified safety interlocks. The weather service is optional; the default is an offline physics model.</p><div className="mt-5 rounded-xl bg-[#f7efe4] p-3 text-sm text-[#805a36]">The dispatch schedule is for demonstration and study. It does not send operating commands to electrical equipment.</div></article>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4 text-sm text-slate-500"><span>Built to make the energy story easier to follow.</span><Link href="/" className="inline-flex items-center gap-1 font-semibold text-[#477b58]">Return to GreenSync <ArrowRight className="h-4 w-4" /></Link></footer>
    </main>
  );
}
