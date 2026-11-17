"use client";
import React, { useState } from 'react';
import { IconFolder, IconChevronDown, IconKey, IconServer2, IconCheck, IconShieldLock } from "@tabler/icons-react";

const MOCK_PROJECTS = [
  { id: 'proj-1', name: 'ConnectSphere Scraper', activeJobs: 3, domains: 4, region: 'US-East (N. Virginia)' },
  { id: 'proj-2', name: 'Frontline E-Commerce', activeJobs: 12, domains: 2, region: 'EU-Central (Frankfurt)' },
  { id: 'proj-3', name: 'SEO Competitor Watch', activeJobs: 0, domains: 8, region: 'AP-Southeast (Singapore)' },
  { id: 'proj-4', name: 'Internal Docs Indexer', activeJobs: 1, domains: 1, region: 'US-West (Oregon)' }
];

export default function ProjectsSection() {
  const [selectedProj, setSelectedProj] = useState(MOCK_PROJECTS[0]);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section id="solutions" className="py-20 md:py-28">
      <div className="mx-auto max-w-[1140px] grid gap-12 lg:grid-cols-12 items-center">
        
        {/* Left side description */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-1.5 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#FF5C38]" />
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--color-charcoal)]">
              Multi-Account Architecture
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-charcoal)] sm:text-5xl">
            Multiple projects. <br />
            One command center.
          </h2>

          <p className="text-[16px] leading-relaxed text-[var(--color-bark-grey)]">
            Partition your crawler jobs into isolated workspaces. Allocate billing quotas, manage scoped API tokens, and monitor cluster health under a unified organization account.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="family-pill">
              <IconKey className="h-4 w-4 text-[#FF5C38]" />
              <span>Isolated API Keys</span>
            </span>
            <span className="family-pill">
              <IconShieldLock className="h-4 w-4 text-[#10B981]" />
              <span>Dedicated Rate Limits</span>
            </span>
          </div>
        </div>

        {/* Right side — Family-style Tactile Workbench Card */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="family-card w-full max-w-[480px] p-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--color-stone-mist)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-stone)]">
                Environment Switcher
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#10B981] dark:bg-emerald-950/40">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                Cluster Healthy
              </span>
            </div>

            {/* Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-ivory)] px-4 py-3.5 flex items-center justify-between text-left text-sm font-semibold text-[var(--color-charcoal)] hover:border-[#FF5C38] transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#FF5C38]">
                    <IconFolder className="h-4 w-4" />
                  </div>
                  <span>{selectedProj.name}</span>
                </div>
                <IconChevronDown
                  className={`h-4 w-4 text-[var(--color-stone)] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#FF5C38]' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-[20px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] z-20 overflow-hidden divide-y divide-[var(--color-stone-mist)] shadow-xl animate-slideDown">
                  {MOCK_PROJECTS.map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => { setSelectedProj(proj); setIsOpen(false); }}
                      className="w-full px-4 py-3 text-left text-xs font-medium text-[var(--color-charcoal)] hover:bg-[var(--color-ivory)] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2 w-2 rounded-full transition ${proj.id === selectedProj.id ? 'bg-[#FF5C38]' : 'bg-transparent border border-[var(--color-stone-mist)]'}`} />
                        <span className={proj.id === selectedProj.id ? 'font-bold' : ''}>{proj.name}</span>
                      </div>
                      <span className="text-[11px] text-[var(--color-stone)]">{proj.activeJobs} jobs</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected project details */}
            <div className="mt-6 grid grid-cols-2 gap-4 rounded-[20px] bg-[var(--color-ivory)] p-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)]">Active Runners</div>
                <div className="text-3xl font-extrabold text-[var(--color-charcoal)] mt-1">{selectedProj.activeJobs}</div>
                <div className="text-xs text-[#10B981] flex items-center gap-1 mt-1 font-medium">
                  <IconCheck className="h-3.5 w-3.5" />
                  <span>Processing cleanly</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)]">Target Hosts</div>
                <div className="text-3xl font-extrabold text-[var(--color-charcoal)] mt-1">{selectedProj.domains}</div>
                <div className="text-xs text-[var(--color-stone)] mt-1 font-medium">Whitelisted domains</div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-[var(--color-stone)] pt-2 border-t border-[var(--color-stone-mist)] font-medium">
              <span>Cluster Region:</span>
              <span className="text-[var(--color-charcoal)] font-bold">{selectedProj.region}</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
