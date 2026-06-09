import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "WorkPass AI — Instant worker verification for Australia's high-risk industries",
  description:
    "Upload to approved in minutes, not days. AI-native verification and onboarding for mining and construction labour-hire — White Card, High Risk Work Licences, WHS expiry tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
