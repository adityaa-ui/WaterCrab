import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const coopDisplay = Cormorant_Garamond({
  variable: "--font-cooper-ltbt",
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WaterCrab | AI Web Scraping & Extraction",
  description: "Scrape websites to Markdown or extract structured JSON with OpenAI/Anthropic using your own API keys.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${coopDisplay.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
