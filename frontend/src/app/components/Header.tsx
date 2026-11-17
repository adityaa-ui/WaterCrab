"use client";
import React, { useState } from 'react';
import { ThemeToggle } from '@/lib/theme';
import {
  IconChevronDown,
  IconSparkles,
  IconArrowRight,
  IconBrowser,
  IconBracketsContain,
  IconRoute,
  IconRocket,
  IconFileCode,
  IconPackages
} from "@tabler/icons-react";

export default function Header({ 
  onLogin, 
  onSignUp, 
  userEmail, 
  onLogout 
}: { 
  onLogin: () => void; 
  onSignUp: () => void; 
  userEmail?: string; 
  onLogout: () => void 
}) {
  const [openDropdown, setOpenDropdown] = useState<'solutions' | 'docs' | null>(null);

  const toggleDropdown = (menu: 'solutions' | 'docs') => {
    setOpenDropdown(prev => prev === menu ? null : menu);
  };

  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-[1040px] px-4">
      <div className="family-capsule flex items-center justify-between px-5 py-2.5 transition-all duration-300">
        
        {/* Left Branding - Family.co style Squircle Icon */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#FF6B4A] via-[#FF5C38] to-[#E04826] text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
            {/* Playful crab claw / geometric monogram */}
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9a9 9 0 0 0-9-9zm-1 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-7 8a4 4 0 0 1 8 0H8z" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-[var(--color-charcoal)]">
            WaterCrab
          </span>
        </a>

        {/* Center Nav - Family.co clean pill links */}
        <nav className="hidden items-center gap-1 text-[13px] font-medium text-[var(--color-bark-grey)] md:flex">
          {/* Solutions Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setOpenDropdown('solutions')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button 
              onClick={() => toggleDropdown('solutions')}
              className="flex items-center gap-1 rounded-full px-3.5 py-1.5 transition hover:bg-[var(--color-ivory)] hover:text-[var(--color-charcoal)] cursor-pointer"
            >
              <span>Features</span>
              <IconChevronDown 
                className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${openDropdown === 'solutions' ? 'rotate-180 opacity-100' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            <div 
              className={`absolute top-full left-0 mt-2 w-[320px] rounded-[24px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-3 shadow-xl z-50 transition-all duration-200 ease-out ${
                openDropdown === 'solutions'
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-2 pointer-events-none'
              }`}
            >
              <div className="space-y-1">
                <a href="#pipeline" className="flex items-start gap-3 rounded-[16px] p-2.5 transition-colors hover:bg-[var(--color-ivory)] group">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF5C38] dark:bg-orange-950/40">
                    <IconBrowser className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--color-charcoal)]">Web Scraper</div>
                    <div className="text-[11px] text-[var(--color-bark-grey)]">Clean Markdown with 0 ads or noise.</div>
                  </div>
                </a>

                <a href="#pipeline" className="flex items-start gap-3 rounded-[16px] p-2.5 transition-colors hover:bg-[var(--color-ivory)] group">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#5B5BD6] dark:bg-indigo-950/40">
                    <IconBracketsContain className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--color-charcoal)]">Schema Extractor</div>
                    <div className="text-[11px] text-[var(--color-bark-grey)]">Strict JSON objects using OpenAI/Claude.</div>
                  </div>
                </a>

                <a href="#pipeline" className="flex items-start gap-3 rounded-[16px] p-2.5 transition-colors hover:bg-[var(--color-ivory)] group">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#10B981] dark:bg-emerald-950/40">
                    <IconRoute className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--color-charcoal)]">Multi-Page Crawler</div>
                    <div className="text-[11px] text-[var(--color-bark-grey)]">Distributed BullMQ & Playwright clusters.</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <a href="#values" className="rounded-full px-3.5 py-1.5 transition hover:bg-[var(--color-ivory)] hover:text-[var(--color-charcoal)]">
            Values
          </a>

          <a href="#features" className="rounded-full px-3.5 py-1.5 transition hover:bg-[var(--color-ivory)] hover:text-[var(--color-charcoal)]">
            Architecture
          </a>

          <a href="#integrations" className="rounded-full px-3.5 py-1.5 transition hover:bg-[var(--color-ivory)] hover:text-[var(--color-charcoal)]">
            Agents
          </a>

          {/* Docs Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setOpenDropdown('docs')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button 
              onClick={() => toggleDropdown('docs')}
              className="flex items-center gap-1 rounded-full px-3.5 py-1.5 transition hover:bg-[var(--color-ivory)] hover:text-[var(--color-charcoal)] cursor-pointer"
            >
              <span>Docs</span>
              <IconChevronDown 
                className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${openDropdown === 'docs' ? 'rotate-180 opacity-100' : ''}`}
              />
            </button>

            <div 
              className={`absolute top-full left-0 mt-2 w-[300px] rounded-[24px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-3 shadow-xl z-50 transition-all duration-200 ease-out ${
                openDropdown === 'docs'
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 translate-y-2 pointer-events-none'
              }`}
            >
              <div className="space-y-1">
                <a href="#pipeline" className="flex items-start gap-3 rounded-[16px] p-2.5 transition-colors hover:bg-[var(--color-ivory)]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF5C38] dark:bg-orange-950/40">
                    <IconRocket className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--color-charcoal)]">Quickstart Guide</div>
                    <div className="text-[11px] text-[var(--color-bark-grey)]">Install SDK or call REST endpoint.</div>
                  </div>
                </a>

                <a href="#features" className="flex items-start gap-3 rounded-[16px] p-2.5 transition-colors hover:bg-[var(--color-ivory)]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/40">
                    <IconFileCode className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--color-charcoal)]">API Reference</div>
                    <div className="text-[11px] text-[var(--color-bark-grey)]">Full parameters and return shapes.</div>
                  </div>
                </a>

                <a href="#integrations" className="flex items-start gap-3 rounded-[16px] p-2.5 transition-colors hover:bg-[var(--color-ivory)]">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-950/40">
                    <IconPackages className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--color-charcoal)]">Libraries & MCP</div>
                    <div className="text-[11px] text-[var(--color-bark-grey)]">TypeScript, Python, and Claude MCP.</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <ThemeToggle className="inline-flex" />
          
          {userEmail ? (
            <div className="flex items-center gap-2">
              <a 
                href="/workspace" 
                className="hidden rounded-full bg-[var(--color-ivory)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-charcoal)] hover:bg-[var(--color-surface-hover)] md:block"
              >
                Workspace
              </a>
              <button 
                onClick={onLogout} 
                className="rounded-full border border-[var(--color-stone-mist)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)] cursor-pointer"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={onLogin} 
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)] cursor-pointer"
              >
                Log in
              </button>
              <button 
                onClick={onSignUp} 
                className="group flex items-center gap-1.5 rounded-full bg-[var(--color-charcoal)] px-4 py-1.5 text-xs font-semibold text-[var(--color-warm-bone)] shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Get Started</span>
                <IconArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
