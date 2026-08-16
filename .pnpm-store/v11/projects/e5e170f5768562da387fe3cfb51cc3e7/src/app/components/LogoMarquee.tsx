"use client";
import React from 'react';

const BRANDS = [
  "GitHub", "Vercel", "Supabase", "Linear", "Resend",
  "Stripe", "Loops", "Clerk", "PostHog", "Railway"
];

export default function LogoMarquee() {
  // Triple the list so the 33.33% translateX loop is seamless
  const marqueeItems = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    // Logo Strip: single row, each logo max-height 24px, opacity 0.6, 40px vertical padding
    <section className="w-full overflow-hidden bg-[var(--color-warm-bone)] border-t border-[var(--color-stone-mist)]">
      {/* Section Label */}
      <div className="pt-10 pb-6 text-center">
        <span className="font-mono text-[12px] font-medium uppercase tracking-[0.10em] text-[var(--color-bark-grey)]">
          Data extracted from every corner of the web
        </span>
      </div>

      {/* Scrolling strip */}
      <div className="relative flex w-full overflow-hidden pb-10">
        {/* Fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[var(--color-warm-bone)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[var(--color-warm-bone)] to-transparent" />

        {/* Marquee track */}
        <div className="flex whitespace-nowrap animate-marquee">
          {marqueeItems.map((brand, idx) => (
            <div
              key={`${brand}-${idx}`}
              className="inline-flex items-center mx-10 max-h-[24px] text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--color-bark-grey)] opacity-60 hover:opacity-100 hover:text-[var(--color-electric-indigo)] transition-all duration-200 cursor-default"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-pebble)] mr-3" />
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
