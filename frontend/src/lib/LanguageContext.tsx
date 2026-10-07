"use client";

import React, { createContext, useContext, useSyncExternalStore } from"react";
import { Language, translations, Translations } from"./translations";

interface LanguageContextType {
 language: Language;
 setLanguage: (lang: Language) => void;
 t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
 language:"en",
 setLanguage: () => {},
 t: translations.en,
});

const LANGUAGE_EVENT = "greensync-language-change";

function getLanguageSnapshot(): Language {
 try {
 const saved = localStorage.getItem("greensync_lang");
 return saved ==="en" || saved ==="hi" || saved ==="es" ? saved :"en";
 } catch {
 return "en";
 }
}

function subscribeToLanguageChanges(onChange: () => void) {
 window.addEventListener(LANGUAGE_EVENT, onChange);
 window.addEventListener("storage", onChange);
 return () => {
 window.removeEventListener(LANGUAGE_EVENT, onChange);
 window.removeEventListener("storage", onChange);
 };
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const language = useSyncExternalStore<Language>(subscribeToLanguageChanges, getLanguageSnapshot, () =>"en");

 const setLanguage = (lang: Language) => {
 try {
 localStorage.setItem("greensync_lang", lang);
 } catch {
 // Keep the current page usable when browser storage is unavailable.
 }
 window.dispatchEvent(new Event(LANGUAGE_EVENT));
 };

 return (
 <LanguageContext.Provider
 value={{
 language,
 setLanguage,
 t: translations[language] || translations.en,
 }}
 >
 {children}
 </LanguageContext.Provider>
 );
};

export const useLanguage = () => useContext(LanguageContext);
