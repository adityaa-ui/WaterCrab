"use client";
import React from 'react';

const BRANDS = [
  "GitHub", "Vercel", "Supabase", "Linear", "Resend",
  "Stripe", "Loops", "Clerk", "PostHog", "Railway"
];

export default function LogoMarquee() {
  const marqueeItems = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section className="w-full overflow-hidden py-10">
      <div className="pb-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)]">
          Powering extraction pipelines across the web
        </span>
      </div>

      <div className="relative flex w-full overflow-hidden">
        {/* Fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-[var(--color-warm-bone)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-[var(--color-warm-bone)] to-transparent" />

        {/* Marquee track */}
        <div className="flex whitespace-nowrap animate-marquee">
          {marqueeItems.map((brand, idx) => (
            <div
              key={`${brand}-${idx}`}
              className="inline-flex items-center mx-8 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-5 py-2 text-xs font-semibold text-[var(--color-charcoal)] shadow-sm hover:scale-105 transition-all duration-200 cursor-default"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C38] mr-2.5 opacity-80" />
              {brand}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
