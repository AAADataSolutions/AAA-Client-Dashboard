import type { Metadata } from "next";
import { Arimo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/theme-context";

const arimo = Arimo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arimo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AAA Data Solutions — Telecom Operations Platform",
  description: "Enterprise operational management platform for communication infrastructure, properties, onboarding, porting, and E911 compliance.",
};

import StoreProvider from "@/store/StoreProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${arimo.variable}`}>
      <body className={`${arimo.className} min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-blue-600/30 selection:text-white font-sans`}>
        <StoreProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}


