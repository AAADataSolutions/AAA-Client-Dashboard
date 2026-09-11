import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/theme-context";

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
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-orange-500/20 selection:text-orange-400">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
