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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full dark ${arimo.variable}`}>
      <body className={`${arimo.className} min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-orange-500/20 selection:text-orange-400 font-sans`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

