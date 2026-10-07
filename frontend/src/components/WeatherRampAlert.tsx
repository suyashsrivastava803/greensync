"use client";

import React from"react";
import { CloudRain, Sun, Wind, Thermometer, AlertTriangle, ShieldCheck, Radio } from"lucide-react";
import { WeatherObservation } from"../lib/types";
import { useLanguage } from"../lib/LanguageContext";

interface WeatherRampAlertProps {
 weather: WeatherObservation | null;
}

export const WeatherRampAlert: React.FC<WeatherRampAlertProps> = ({ weather }) => {
 const { t } = useLanguage();
 const isRamp = weather?.ramp_event_detected ?? false;
 const isLive = weather?.is_live_api ?? false;

 return (
 <div className="scada-panel p-5 text-slate-800 flex flex-col justify-between">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3 mb-4">
 <div className="flex items-center gap-2">
 <div className="p-1.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
 <Sun className="w-4 h-4" />
 </div>
 <div>
 <h2 className="text-sm font-bold tracking-wide uppercase text-slate-900">
 {t.weatherTitle}
 </h2>
 <p className="text-[11px] text-slate-500 font-mono">
 {t.weatherSubtitle}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold shrink-0">
 <Radio className={`w-3 h-3 ${isLive ?"text-emerald-600 animate-pulse" :"text-teal-600"}`} />
 <span>{isLive ? t.openWeatherLive : t.atmosphericEngine}</span>
 </div>
 </div>

 {/* Weather Parameters Grid */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
 {/* Irradiance (GHI) */}
 <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90">
 <div className="flex items-center gap-1.5 text-slate-700 text-xs mb-1 font-semibold">
 <div className="p-1 rounded-md bg-white border border-slate-200">
 <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
 </div>
 <span className="truncate">{t.ghiIrradiance}</span>
 </div>
 <div className="text-xl font-bold font-mono text-slate-900 mt-1">
 {weather?.solar_irradiance_ghi.toFixed(0) ?? 0}
 <span className="text-xs font-normal text-slate-500 ml-1">W/m²</span>
 </div>
 </div>

 {/* Cloud Cover */}
 <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90">
 <div className="flex items-center gap-1.5 text-slate-700 text-xs mb-1 font-semibold">
 <div className="p-1 rounded-md bg-white border border-slate-200">
 <CloudRain className="w-3.5 h-3.5 text-sky-500 shrink-0" />
 </div>
 <span className="truncate">{t.cloudCover}</span>
 </div>
 <div className="text-xl font-bold font-mono text-slate-900 mt-1">
 {weather?.cloud_cover_pct.toFixed(0) ?? 0}%
 </div>
 </div>

 {/* Ambient Temperature */}
 <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90">
 <div className="flex items-center gap-1.5 text-slate-700 text-xs mb-1 font-semibold">
 <div className="p-1 rounded-md bg-white border border-slate-200">
 <Thermometer className="w-3.5 h-3.5 text-rose-500 shrink-0" />
 </div>
 <span className="truncate">{t.ambientTemp}</span>
 </div>
 <div className="text-xl font-bold font-mono text-slate-900 mt-1">
 {weather?.temperature_c.toFixed(1) ?? 25.0}°C
 </div>
 </div>

 {/* Wind Speed */}
 <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/90">
 <div className="flex items-center gap-1.5 text-slate-700 text-xs mb-1 font-semibold">
 <div className="p-1 rounded-md bg-white border border-slate-200">
 <Wind className="w-3.5 h-3.5 text-teal-500 shrink-0" />
 </div>
 <span className="truncate">{t.windSpeed}</span>
 </div>
 <div className="text-xl font-bold font-mono text-slate-900 mt-1">
 {weather?.wind_speed_ms.toFixed(1) ?? 3.0}
 <span className="text-xs font-normal text-slate-500 ml-1">m/s</span>
 </div>
 </div>
 </div>

 {/* Cloud Ramp Detection Alert Banner */}
 {isRamp ? (
 <div className="p-3 rounded-xl bg-amber-100 border border-amber-400 text-amber-950 flex items-start gap-2.5 animate-pulse">
 <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
 <div className="font-mono text-xs">
 <div className="font-bold uppercase tracking-wide text-amber-900">
 {t.rampDetectedTitle}
 </div>
 <p className="text-amber-900/90 mt-0.5 text-[11px]">
 {t.rampDetectedDesc}
 </p>
 </div>
 </div>
 ) : (
 <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-300 text-emerald-900 flex items-center justify-between font-mono text-xs">
 <div className="flex items-center gap-2 min-w-0">
 <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
 <span className="text-[11px] truncate">{t.rampStableTitle}</span>
 </div>
 <span className="text-[10px] text-emerald-700 font-bold shrink-0 ml-2">ΔGHI normal</span>
 </div>
 )}
 </div>
 );
};
