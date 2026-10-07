import type { Metadata } from"next";
import"./globals.css";
import { LanguageProvider } from"../lib/LanguageContext";
import { ThemeProvider } from"../lib/ThemeContext";

export const metadata: Metadata = {
 title:"GreenSync | Microgrid Demand Forecaster & Dispatch Optimizer",
 description:"Local microgrid forecasting and dispatch simulation dashboard",
};

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <html lang="en">
 <body className="min-h-screen antialiased">
 <ThemeProvider>
 <LanguageProvider>
 {children}
 </LanguageProvider>
 </ThemeProvider>
 </body>
 </html>
 );
}
