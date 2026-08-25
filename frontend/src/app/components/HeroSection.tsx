"use client";
import React from "react";
import HeroBackground from "./HeroBackground";
import SearchBar from "./SearchBar";

export default function HeroSection({ onResultsChange }: { onResultsChange: (visible: boolean) => void }) {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--color-warm-bone)]">
      <HeroBackground />
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center px-6 py-16 text-center md:py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-bark-grey)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-electric-indigo)]" />
          Web intelligence, for everyone
        </div>
        <h1 className="max-w-4xl font-serif text-[44px] font-normal leading-[1.1] tracking-[-0.04em] text-[var(--color-charcoal)] md:text-[76px]">
          Search the web for <span className="italic text-[var(--color-electric-indigo)]">useful answers.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-bark-grey)] md:text-[18px]">
          Find relevant pages and highlights, scrape any URL, map sites, or run a crawl — all without signing in.
        </p>
        <div className="mt-12 w-full"><SearchBar onResultsChange={onResultsChange} /></div>
      </div>
    </section>
  );
}
