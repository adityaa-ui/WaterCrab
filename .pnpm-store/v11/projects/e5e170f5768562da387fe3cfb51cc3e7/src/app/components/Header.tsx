"use client";
import React, { useState } from 'react';

export default function Header({ onLogin, onSignUp, userEmail, onLogout }: { onLogin: () => void; onSignUp: () => void; userEmail?: string; onLogout: () => void }) {
  const [openDropdown, setOpenDropdown] = useState<'solutions' | 'docs' | null>(null);

  const toggleDropdown = (menu: 'solutions' | 'docs') => {
    setOpenDropdown(prev => prev === menu ? null : menu);
  };

  return (
    <>
      {/* Sticky Nav Bar: Stays completely flat, no border, no shadow, no background change */}
      <header className="sticky top-0 z-40 bg-[rgba(250,250,249,0.85)] backdrop-blur-md w-full">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4 relative">
          
          {/* Left branding */}
          <div className="flex items-center gap-2">
            {/* Geometric Club Suit Logomark */}
            <div className="text-[var(--color-electric-indigo)]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="7.5" r="3" />
                <circle cx="7.5" cy="13.5" r="3" />
                <circle cx="16.5" cy="13.5" r="3" />
                <path d="M12 12v7.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V12h2z" />
              </svg>
            </div>
            <span className="font-mono text-sm font-semibold uppercase tracking-[0.10em] text-[var(--color-charcoal)]">
              WATERCRAB
            </span>
          </div>

          {/* Center Navigation links */}
          <nav className="hidden items-center gap-8 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--color-bark-grey)] md:flex">
            
            {/* Solutions Dropdown */}
            <div 
              className="relative py-2"
              onMouseEnter={() => setOpenDropdown('solutions')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button 
                onClick={() => toggleDropdown('solutions')}
                className="flex items-center gap-1 transition hover:text-[var(--color-charcoal)] cursor-pointer"
              >
                Solutions
                <svg 
                  className={`h-3 w-3 opacity-60 transition-transform duration-150 ${openDropdown === 'solutions' ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div 
                className={`absolute top-full left-0 mt-1 w-[320px] rounded-[12px] border border-stone-mist bg-paper-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-50 transition-all duration-200 ease-out ${
                  openDropdown === 'solutions'
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <a href="#pipeline" className="block group">
                      <div className="text-[11px] font-mono text-[var(--color-charcoal)] group-hover:text-[var(--color-electric-indigo)] transition uppercase tracking-[0.04em]">Web Scraper</div>
                      <div className="text-[11px] font-normal text-[var(--color-bark-grey)] capitalize mt-0.5">Extract content from any URL as clean Markdown.</div>
                    </a>
                  </div>
                  <div>
                    <a href="#pipeline" className="block group">
                      <div className="text-[11px] font-mono text-[var(--color-charcoal)] group-hover:text-[var(--color-electric-indigo)] transition uppercase tracking-[0.04em]">AI Extraction API</div>
                      <div className="text-[11px] font-normal text-[var(--color-bark-grey)] capitalize mt-0.5">Get structured JSON from web pages using schemas.</div>
                    </a>
                  </div>
                  <div>
                    <a href="#pipeline" className="block group">
                      <div className="text-[11px] font-mono text-[var(--color-charcoal)] group-hover:text-[var(--color-electric-indigo)] transition uppercase tracking-[0.04em]">Crawl Pipelines</div>
                      <div className="text-[11px] font-normal text-[var(--color-bark-grey)] capitalize mt-0.5">Schedule and run large-scale crawling agents.</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <a href="#features" className="transition hover:text-[var(--color-charcoal)]">Agents</a>
            <a href="#pipeline" className="transition hover:text-[var(--color-charcoal)]">Pricing</a>

            {/* Docs Dropdown */}
            <div 
              className="relative py-2"
              onMouseEnter={() => setOpenDropdown('docs')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button 
                onClick={() => toggleDropdown('docs')}
                className="flex items-center gap-1 transition hover:text-[var(--color-charcoal)] cursor-pointer"
              >
                Docs
                <svg 
                  className={`h-3 w-3 opacity-60 transition-transform duration-150 ${openDropdown === 'docs' ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div 
                className={`absolute top-full left-0 mt-1 w-[320px] rounded-[12px] border border-stone-mist bg-paper-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-50 transition-all duration-200 ease-out ${
                  openDropdown === 'docs'
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <a href="#docs" className="block group">
                      <div className="text-[11px] font-mono text-[var(--color-charcoal)] group-hover:text-[var(--color-electric-indigo)] transition uppercase tracking-[0.04em]">Quick Start</div>
                      <div className="text-[11px] font-normal text-[var(--color-bark-grey)] capitalize mt-0.5">Get started with WaterCrab API keys in 2 minutes.</div>
                    </a>
                  </div>
                  <div>
                    <a href="#docs" className="block group">
                      <div className="text-[11px] font-mono text-[var(--color-charcoal)] group-hover:text-[var(--color-electric-indigo)] transition uppercase tracking-[0.04em]">API Reference</div>
                      <div className="text-[11px] font-normal text-[var(--color-bark-grey)] capitalize mt-0.5">Scraping, crawling, and extraction endpoints.</div>
                    </a>
                  </div>
                  <div>
                    <a href="#docs" className="block group">
                      <div className="text-[11px] font-mono text-[var(--color-charcoal)] group-hover:text-[var(--color-electric-indigo)] transition uppercase tracking-[0.04em]">SDK Libraries</div>
                      <div className="text-[11px] font-normal text-[var(--color-bark-grey)] capitalize mt-0.5">TypeScript, Python, and Go developer libraries.</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <a href="#blog" className="transition hover:text-[var(--color-charcoal)]">Blog</a>
          </nav>

          {/* Right buttons */}
          <div className="flex items-center gap-4">
            {userEmail ? <><a href="/workspace" className="hidden text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--color-charcoal)] hover:opacity-75 md:block">Workspace</a><span className="hidden max-w-32 truncate text-xs text-[var(--color-bark-grey)] md:block">{userEmail}</span><button onClick={onLogout} className="rounded-[8px] border border-[var(--color-stone-mist)] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] hover:border-[var(--color-electric-indigo)]">Log out</button></> : <><button onClick={onLogin} className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--color-charcoal)] hover:opacity-75 transition cursor-pointer">Log in</button><button onClick={onSignUp} className="rounded-[8px] bg-[var(--color-electric-indigo)] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-white shadow-sm transition hover:bg-[var(--color-deep-violet)] cursor-pointer">Sign up</button></>}
          </div>
        </div>
      </header>
    </>
  );
}
