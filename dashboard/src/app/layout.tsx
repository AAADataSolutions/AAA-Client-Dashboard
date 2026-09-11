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
    <html lang="en" className="h-full bg-[#f8f9fa]">
      <body className="min-h-full flex flex-col bg-[#f8f9fa] text-[#181c22] antialiased selection:bg-[#1275e2]/15 selection:text-[#1275e2]">
        {children}
      </body>
    </html>
  );
}
