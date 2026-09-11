import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full flex flex-col bg-[#0a0d12] text-[#e8ecf2] antialiased">
        {children}
      </body>
    </html>
  );
}
