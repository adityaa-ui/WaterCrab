"use client";
import React from "react";
import HeroBackground from "./HeroBackground";
import SearchBar from "./SearchBar";
import { 
  IconArrowRight, 
  IconSparkles, 
  IconBolt, 
  IconShieldCheck,
  IconBrandGithub,
  IconBrowserCheck
} from "@tabler/icons-react";

export default function HeroSection({ onResultsChange }: { onResultsChange: (visible: boolean) => void }) {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--color-warm-bone)] pt-12 pb-20 md:pt-16 md:pb-28">
      <HeroBackground />
      
      <div className="relative z-10 mx-auto flex max-w-[1140px] flex-col items-center px-6 text-center">
        
        {/* Family-style Announcement Pill */}
        <div className="group mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:scale-[1.02]">
          <span className="flex h-2 w-2 rounded-full bg-[#FF5C38] animate-pulse-dot" />
          <span className="text-xs font-semibold tracking-tight text-[var(--color-charcoal)]">
            The scraper you've always wanted
          </span>
          <span className="text-xs text-[var(--color-stone)]">· v2.4 Live</span>
        </div>

        {/* Family-style Grand Headline */}
        <h1 className="max-w-4xl text-[44px] font-bold leading-[1.06] tracking-[-0.035em] text-[var(--color-charcoal)] sm:text-[64px] md:text-[80px]">
          Web intelligence, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[var(--color-charcoal)] via-[#FF5C38] to-[#FF8A65] bg-clip-text text-transparent">
            made beautifully simple.
          </span>
        </h1>

        {/* Soft, readable subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-[var(--color-bark-grey)] md:text-[19px]">
          Turn dynamic JavaScript sites into clean Markdown, extract structured JSON schemas without hallucination, and connect directly to AI agents.
        </p>

        {/* Dual Pill CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#pipeline"
            className="group family-btn family-btn-primary"
          >
            <span>Start Scraping Free</span>
            <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>

          <a
            href="#features"
            className="family-btn family-btn-secondary"
          >
            <IconBrowserCheck className="h-4 w-4 text-[var(--color-bark-grey)]" />
            <span>Explore Architecture</span>
          </a>
        </div>

        {/* Centerpiece Device / Interactive Container with Floating Satellites */}
        <div className="relative mt-14 w-full max-w-4xl">
          
          {/* Floating Satellite 1 (Top Left) */}
          <div className="animate-float absolute -top-6 -left-4 z-20 hidden items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-2 shadow-lg sm:flex">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[#FF5C38] text-[11px] font-bold">
              ✨
            </span>
            <span className="text-xs font-semibold text-[var(--color-charcoal)]">
              0 Ads & Cookie Banners
            </span>
          </div>

          {/* Floating Satellite 2 (Top Right) */}
          <div className="animate-float-reverse absolute -top-5 -right-4 z-20 hidden items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-2 shadow-lg sm:flex">
            <IconBolt className="h-4 w-4 text-[#FF5C38]" />
            <span className="text-xs font-semibold text-[var(--color-charcoal)]">
              Sub-second DOM streaming
            </span>
          </div>

          {/* Floating Satellite 3 (Bottom Right) */}
          <div className="animate-float absolute -bottom-5 right-8 z-20 hidden items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3.5 py-1.5 shadow-md md:flex">
            <IconShieldCheck className="h-4 w-4 text-[#10B981]" />
            <span className="text-xs font-semibold text-[var(--color-charcoal)]">
              100% Deterministic Zod Schema
            </span>
          </div>

          {/* Main Search / Action Workbench */}
          <div className="relative z-10 overflow-hidden rounded-[28px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.06)] md:p-6">
            <SearchBar onResultsChange={onResultsChange} />
          </div>
        </div>

      </div>
    </section>
  );
}
