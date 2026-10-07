"use client";

import React, { useState, useRef, useEffect } from"react";
import { Globe, Check, ChevronDown } from"lucide-react";
import { useLanguage } from"../lib/LanguageContext";
import { AVAILABLE_LANGUAGES } from"../lib/translations";

interface LanguageSelectorProps {
 className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
 className ="",
}) => {
 const { language, setLanguage } = useLanguage();
 const [isOpen, setIsOpen] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);

 const currentOption =
 AVAILABLE_LANGUAGES.find((opt) => opt.code === language) ||
 AVAILABLE_LANGUAGES[0];

 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 if (
 containerRef.current &&
 !containerRef.current.contains(e.target as Node)
 ) {
 setIsOpen(false);
 }
 };
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 return (
 <div
 ref={containerRef}
 className={`relative inline-flex items-center ${className}`}
 >
 {/* Dropdown Trigger */}
 <button
 type="button"
 onClick={() => setIsOpen(!isOpen)}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100:bg-slate-700 border border-emerald-300 text-slate-800 text-xs font-mono font-bold transition shadow-xs cursor-pointer select-none"
 title="Change interface language / भाषा बदलें / Cambiar idioma"
 aria-label="Change language"
 aria-expanded={isOpen}
 >
 <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
 <span className="text-sm leading-none mr-0.5">{currentOption.flag}</span>
 <span className="font-semibold text-[11px] sm:text-xs">
 {currentOption.nativeName}
 </span>
 <ChevronDown
 className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${
 isOpen ?"rotate-180" :""
 }`}
 />
 </button>

 {/* Dropdown Menu */}
 {isOpen && (
 <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white border border-emerald-300 shadow-xl backdrop-blur-md z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider border-b border-emerald-100 mb-1">
 Language / भाषा
 </div>
 {AVAILABLE_LANGUAGES.map((opt) => {
 const isSelected = opt.code === language;
 return (
 <button
 type="button"
 key={opt.code}
 onClick={() => {
 setLanguage(opt.code);
 setIsOpen(false);
 }}
 className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition text-left cursor-pointer ${
 isSelected
 ?"bg-emerald-600 text-white font-bold shadow-xs"
 :"text-slate-700 hover:bg-emerald-50:bg-slate-800"
 }`}
 >
 <div className="flex items-center gap-2">
 <span className="text-sm leading-none">{opt.flag}</span>
 <div>
 <span className="block leading-tight">{opt.nativeName}</span>
 <span
 className={`text-[10px] block leading-tight ${
 isSelected
 ?"text-emerald-100"
 :"text-slate-400"
 }`}
 >
 {opt.label}
 </span>
 </div>
 </div>
 {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
 </button>
 );
 })}
 </div>
 )}
 </div>
 );
};
