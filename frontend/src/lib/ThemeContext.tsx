"use client";

import React, { createContext, useContext } from"react";

export type ThemeMode ="light";

interface ThemeContextType {
 theme: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType>({
 theme:"light",
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 return (
 <ThemeContext.Provider value={{ theme:"light" }}>
 {children}
 </ThemeContext.Provider>
 );
};

export const useTheme = () => useContext(ThemeContext);
