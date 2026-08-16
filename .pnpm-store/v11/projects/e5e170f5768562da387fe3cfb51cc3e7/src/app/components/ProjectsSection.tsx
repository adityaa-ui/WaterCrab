"use client";
import React, { useState } from 'react';

const MOCK_PROJECTS = [
  { id: 'proj-1', name: 'ConnectSphere Scraper', activeJobs: 3, domains: 4 },
  { id: 'proj-2', name: 'Frontline E-Commerce', activeJobs: 12, domains: 2 },
  { id: 'proj-3', name: 'SEO Competitor Watch', activeJobs: 0, domains: 8 },
  { id: 'proj-4', name: 'Internal Documentation Indexer', activeJobs: 1, domains: 1 }
];

export default function ProjectsSection() {
  const [selectedProj, setSelectedProj] = useState(MOCK_PROJECTS[0]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mx-auto max-w-[1200px] py-16 md:py-24 grid gap-12 lg:grid-cols-12 items-center border-t border-[var(--color-stone-mist)]">
      {/* Left side description */}
      <div className="lg:col-span-5 space-y-6">
        {/* Section Label Tag: Geist Mono 12px, 0.10em tracking, bark-grey */}
        <div className="font-mono text-[12px] font-medium uppercase tracking-[0.10em] text-[var(--color-bark-grey)]">
          [ MULTI-TENANT ] // ARCHITECTURE
        </div>

        {/* Heading: Cooper LtBT, one word italic */}
        <h2 className="font-serif text-3xl font-normal leading-[1.10] text-[var(--color-charcoal)] md:text-4xl">
          Multiple Projects.{" "}
          <span className="italic text-[var(--color-electric-indigo)]">One dashboard.</span>
        </h2>

        {/* Body: Geist 14px weight 400 bark-grey */}
        <p className="text-[14px] leading-relaxed text-[var(--color-bark-grey)]">
          Organize your web crawler jobs into isolated projects or organization teams. Control API billing quotas, configure shared database models, and view centralized crawler health metrics under a single global organization account.
        </p>

        <div className="flex items-center gap-6 text-[11px] font-mono text-[var(--color-bark-grey)]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-terracotta)]" />
            Isolated Auth Tokens
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lichen-green)]" />
            Shared Billing Quotas
          </span>
        </div>
      </div>

      {/* Right side — Product Showcase Card style with 1px border, 16px radius */}
      <div className="lg:col-span-7 flex justify-center">
        <div
          className="w-full max-w-[420px] rounded-[16px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6 relative"
          style={{ boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}
        >
          <div className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-charcoal)]">
            SELECT ACTIVE SCRAPING ENVIRONMENT
          </div>

          {/* Project Dropdown Trigger */}
          <div className="relative">
            {/* Text Input style: 1px stone-mist border, radius 12px */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full rounded-[12px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-3.5 flex items-center justify-between text-left text-[14px] font-semibold text-[var(--color-charcoal)] hover:border-[var(--color-electric-indigo)] transition duration-200 cursor-pointer"
              style={{ outline: isOpen ? '3px solid rgba(97,95,255,0.15)' : 'none', borderColor: isOpen ? '#615fff' : undefined }}
            >
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-electric-indigo)]" />
                <span>{selectedProj.name}</span>
              </div>
              <svg
                className={`h-3.5 w-3.5 text-[var(--color-bark-grey)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Options: Paper White, 1px stone-mist border, 12px radius, dropdown shadow */}
            {isOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 rounded-[12px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] z-20 overflow-hidden divide-y divide-[var(--color-stone-mist)] animate-slideDown" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                {MOCK_PROJECTS.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => { setSelectedProj(proj); setIsOpen(false); }}
                    className="w-full px-4 py-3 text-left text-[13px] text-[var(--color-charcoal)] hover:bg-[var(--color-warm-bone)] flex items-center justify-between transition duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full transition ${proj.id === selectedProj.id ? 'bg-[var(--color-electric-indigo)]' : 'bg-transparent border border-[var(--color-stone-mist)]'}`} />
                      <span>{proj.name}</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-pebble)] font-mono">{proj.activeJobs} jobs</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected project details */}
          <div className="mt-6 border-t border-[var(--color-stone-mist)] pt-4 grid grid-cols-2 gap-4 font-mono">
            <div>
              <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--color-pebble)]">Active Crawl Jobs</div>
              <div className="font-datatype text-[24px] text-[var(--color-charcoal)] mt-1">{selectedProj.activeJobs}</div>
              <div className="text-[10px] text-[var(--color-bark-grey)]">running</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--color-pebble)]">Configured Hosts</div>
              <div className="font-datatype text-[24px] text-[var(--color-charcoal)] mt-1">{selectedProj.domains}</div>
              <div className="text-[10px] text-[var(--color-bark-grey)]">domains</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
