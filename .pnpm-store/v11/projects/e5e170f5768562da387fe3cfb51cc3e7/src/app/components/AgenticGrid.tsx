"use client";
import React from 'react';

const AGENTS = [
  { name: 'CHATGPT', desc: 'Custom actions schema integration' },
  { name: 'CLAUDE', desc: 'Native Anthropic tool calling' },
  { name: 'ANTIGRAVITY', desc: 'Automated background execution' },
  { name: 'CURSOR', desc: 'Direct editor codebase rules matching' },
  { name: 'LOVABLE', desc: 'Frontend-ready schema sync' },
  { name: 'V0', desc: 'Component design schema generator' },
  { name: 'COPILOT', desc: 'Editor companion snippet feeding' },
  { name: 'LANGCHAIN', desc: 'Chained prompt document loading' }
];

export default function AgenticGrid() {
  return (
    <section className="mx-auto max-w-[1200px] py-16 md:py-24 border-t border-[var(--color-stone-mist)]">
      <div className="mb-12 text-center">
        {/* Section Label Tag: Geist Mono 12px weight 500-600, 0.10em tracking, bark-grey */}
        <div className="font-mono text-[12px] font-medium uppercase tracking-[0.10em] text-[var(--color-bark-grey)]">
          Zero-configuration orchestrations
        </div>
        {/* Heading: Cooper LtBT, one italic word */}
        <h2 className="font-serif mt-3 text-3xl font-normal leading-[1.10] text-[var(--color-charcoal)] md:text-4xl">
          Works with your{" "}
          <span className="italic text-[var(--color-electric-indigo)]">favorite agent.</span>
        </h2>
      </div>

      {/* Feature cards: White, 1px stone-mist border, 8px radius, 24px padding */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {AGENTS.map((agent) => (
          <div
            key={agent.name}
            className="group relative rounded-[8px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-electric-indigo)] hover:shadow-sm"
          >
            {/* Title: Geist Mono 12px weight 500-600 uppercase */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] font-semibold tracking-[0.06em] text-[var(--color-charcoal)]">
                {agent.name}
              </span>
              {/* Arrow Link → */}
              <svg
                className="h-3.5 w-3.5 text-[var(--color-pebble)] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--color-electric-indigo)]"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </div>

            {/* Body: Geist 14px weight 400 bark-grey */}
            <p className="mt-3 text-[13px] text-[var(--color-bark-grey)] leading-relaxed">
              {agent.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
