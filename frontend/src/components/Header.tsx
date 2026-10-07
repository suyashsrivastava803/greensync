"use client";

import React, { useState, useEffect } from"react";
import { 
 Zap, 
 Activity, 
 Radio, 
 Clock, 
 RefreshCw,
 Cpu,
} from"lucide-react";
import { TelemetryPoint } from"../lib/types";
import { useLanguage } from"../lib/LanguageContext";
import { LanguageSelector } from"./LanguageSelector";
import Link from "next/link";

interface HeaderProps {
 telemetry: TelemetryPoint | null;
 onRefresh: () => void;
 isRefreshing: boolean;
 backendOnline: boolean | null;
 weatherLive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ telemetry, onRefresh, isRefreshing, backendOnline, weatherLive }) => {
 const { t } = useLanguage();
 const [currentTime, setCurrentTime] = useState<string>("");

 useEffect(() => {
 const update = () => {
 const now = new Date();
 setCurrentTime(
 now.toLocaleTimeString("en-US", {
 hour12: false,
 hour:"2-digit",
 minute:"2-digit",
 second:"2-digit",
 })
 );
 };
 update();
 const interval = setInterval(update, 1000);
 return () => clearInterval(interval);
 }, []);

 const isGridTied = telemetry?.breaker_grid_status ==="CLOSED";
 const isIslanded = telemetry?.microgrid_mode ==="ISLANDED" || !isGridTied;
 const updatedAt = telemetry ? new Date(telemetry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Waiting for first reading";

 return (
 <header className="w-full bg-white/95 border-b border-emerald-300/80 text-slate-900 sticky top-0 z-50 shadow-[0_2px_15px_-3px_rgba(13,148,136,0.07)] backdrop-blur-md transition-colors duration-300">
 <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-2.5 space-y-2">
 {/* Top Bar: Brand Identity & Primary Controls */}
 <div className="flex items-center justify-between gap-3">
 {/* Brand & Substation Node Identity */}
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100 border border-emerald-300 text-emerald-700 shadow-xs shrink-0">
 <Zap className="w-5 h-5 animate-pulse" />
 <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
 </span>
 </div>

 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent truncate">
 {t.substationTitle}
 </h1>
 <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold shrink-0">
 EMS v1.0
 </span>
 </div>
 <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
 <span className={`status-pill ${backendOnline ? "status-pill-good" : backendOnline === false ? "status-pill-warn" : "status-pill-wait"}`}>
 <span className="h-1.5 w-1.5 rounded-full bg-current" />
 {backendOnline ? "API connected" : backendOnline === false ? "Fallback data" : "Connecting…"}
 </span>
 <span className="status-pill status-pill-sim">Telemetry simulated</span>
 <span className="hidden text-slate-500 sm:inline">Updated {updatedAt}</span>
 </p>
 </div>
 </div>

 {/* Action Center: Language Selector & Refresh */}
 <div className="flex items-center gap-2 shrink-0">
 <Link href="/about" className="quiet-button hidden py-2 text-xs sm:inline-flex">Project notes</Link>
 <span className={`hidden rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${weatherLive ? "bg-sky-50 text-sky-800" : "bg-[#f4eee4] text-[#776b59]"}`}>
 {weatherLive ? "Weather connected" : "Weather simulated"}
 </span>
 {/* Dedicated Language Selector Button */}
 <LanguageSelector />

 {/* Telemetry Refresh Button */}
 <button
 onClick={onRefresh}
 disabled={isRefreshing}
 title="Poll microgrid telemetry"
 aria-label="Poll microgrid telemetry"
 className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700:bg-slate-700 text-white border border-emerald-700 transition disabled:opacity-50 shadow-xs cursor-pointer"
 >
 <RefreshCw className={`w-4 h-4 ${isRefreshing ?"animate-spin" :""}`} />
 </button>
 </div>
 </div>

 {/* Bottom SCADA Telemetry Strip - Clean flex bar with zero overlap */}
 <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 font-mono text-xs border-t border-emerald-100">
 <div className="flex items-center gap-2 sm:gap-3 shrink-0">
 {/* Grid Interconnection Status */}
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] shrink-0">
 <Radio className={`w-3 h-3 ${isIslanded ?"text-amber-500 animate-pulse" :"text-emerald-600"}`} />
 <span className="text-slate-600 hidden sm:inline">{t.pccInterconnect}</span>
 <span
 className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
 isIslanded
 ?"bg-amber-100 text-amber-900 border border-amber-300"
 :"bg-emerald-100 text-emerald-900 border border-emerald-300"
 }`}
 >
 {isIslanded ? t.islanded : t.gridTied}
 </span>
 </div>

 {/* Bus Voltage & Frequency */}
 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[11px] shrink-0">
 <Activity className="w-3 h-3 text-teal-600" />
 <span className="text-slate-500">{t.busVoltage}</span>
 <span className="text-slate-900 font-bold">{telemetry?.bus_voltage_v ?? 415.0} V</span>
 <span className="text-slate-300">|</span>
 <span className="text-slate-500">{t.busFreq}</span>
 <span className="text-slate-900 font-bold">{telemetry?.bus_frequency_hz ?? 50.00} Hz</span>
 </div>

 {/* Controller Mode */}
 <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-[11px] shrink-0">
 <Cpu className="w-3 h-3 text-cyan-700" />
 <span className="text-slate-500">{t.controllerMode}</span>
 <span className="text-cyan-900 font-bold uppercase text-[10px]">
 {telemetry?.microgrid_mode ==="ISLANDED"
 ? t.modeIslanded
 : telemetry?.microgrid_mode ==="PEAK_SHAVING"
 ? t.modePeakShaving
 : telemetry?.microgrid_mode ==="FORCE_CHARGE"
 ? t.modeForceCharge
 : t.modeAutonomous}
 </span>
 </div>
 </div>

 {/* SCADA Clock */}
 <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] shrink-0">
 <Clock className="w-3 h-3 text-slate-500" />
 <span className="font-bold">{currentTime ||"--:--:--"}</span>
 </div>
 </div>
 </div>
 </header>
 );
};
