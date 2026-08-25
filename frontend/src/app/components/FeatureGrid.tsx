"use client";
import React from 'react';

const featureCards = [
  {
    title: 'Scraping API',
    description: 'Turn any website into production-ready content via a single HTTP request designed for developer workflows.',
    tag: 'SCRAPING API',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    )
  },
  {
    title: 'MCP Actions',
    description: 'Connect to your automation stack and keep extraction, crawling, and summarization in one clean pipeline.',
    tag: 'MCP READY',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    )
  },
  {
    title: 'Schema Extraction',
    description: 'Describe the fields you need and let WaterCrab convert raw HTML into clean structured JSON objects.',
    tag: 'STRUCTURED',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    )
  }
];

export default function FeatureGrid() {
  return (
    // Feature Card 3-column grid: White card, 1px stone-mist border, 8px radius, 24px padding
    <section id="features" className="py-12 md:py-16">
      {/* Section Label Tag: Geist Mono 12px, 0.10em tracking, bark-grey, centered */}
      <div className="mb-12 text-center">
        <div className="font-mono text-[12px] font-medium uppercase tracking-[0.10em] text-[var(--color-bark-grey)]">
          Built for modern developer workflows
        </div>
        {/* Heading: Cooper LtBT, one word italic */}
        <h2 className="font-serif mt-3 text-3xl font-normal leading-[1.10] text-[var(--color-charcoal)] md:text-4xl">
          Simple tools, <span className="italic text-[var(--color-electric-indigo)]">reliable data.</span>
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {featureCards.map((card) => (
          <article
            key={card.title}
            className="group flex h-full flex-col rounded-[8px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-electric-indigo)] hover:shadow-sm"
          >
            {/* Icon */}
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] text-[var(--color-charcoal)] transition-colors duration-300 group-hover:bg-[rgba(97,95,255,0.08)] group-hover:text-[var(--color-electric-indigo)]">
              {card.icon}
            </div>

            {/* Tag: Geist Mono 12px weight 500 uppercase 0.04em */}
            <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--color-pebble)]">
              {card.tag}
            </div>

            {/* Title: Geist 18px weight 600 charcoal */}
            <h3 className="text-[18px] font-semibold leading-snug text-[var(--color-charcoal)]">
              {card.title}
            </h3>

            {/* Body: Geist 14px weight 400 bark-grey */}
            <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[var(--color-bark-grey)]">
              {card.description}
            </p>

            {/* Footer Arrow Link: Geist Mono 12px weight 500 uppercase 0.04em */}
            <div className="mt-6 border-t border-[var(--color-stone-mist)] pt-4 flex justify-between items-center">
              <span className="text-[10px] font-mono text-[var(--color-pebble)]">DOCS_VERSION v1.0</span>
              <a
                href="#features"
                className="inline-flex items-center gap-1.5 font-mono text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--color-charcoal)] hover:opacity-60 transition-opacity"
              >
                Docs
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
