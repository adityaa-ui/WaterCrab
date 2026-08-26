"use client";

import React from "react";
import { ALL_NAV_ITEMS, type ViewId } from "./nav";
import { SparkIcon, CrawlIcon, GlobeIcon, SearchIcon, MapIcon, UploadIcon } from "@/lib/icons";

interface OverviewViewProps {
  email: string;
  onNavigate: (view: ViewId) => void;
}

const TOOL_BADGES: Record<string, { color: string; bg: string; label: string }> = {
  search:  { color: "text-[var(--color-sapphire-link)]",    bg: "bg-[rgba(163,117,59,0.14)]",    label: "Live Index" },
  scrape:  { color: "text-[var(--color-electric-indigo)]",  bg: "bg-[rgba(142,111,75,0.1)]",    label: "Markdown" },
  map:     { color: "text-[var(--color-tide-teal)]",        bg: "bg-[rgba(95,131,119,0.14)]",   label: "Topology" },
  crawl:   { color: "text-[var(--color-terracotta)]",       bg: "bg-[rgba(196,118,79,0.14)]",   label: "Multi-page" },
  leadgen: { color: "text-[var(--color-electric-indigo)]",  bg: "bg-[rgba(142,111,75,0.12)] font-bold", label: "Lead Gen" },
  extract: { color: "text-[var(--color-lichen-green)]",     bg: "bg-[rgba(124,139,87,0.14)]",    label: "Structured" },
  files:   { color: "text-[var(--color-bark-grey)]",        bg: "bg-[var(--color-warm-bone)]", label: "PDF Parse" },
  overview:{ color: "text-[var(--color-accent)]",           bg: "bg-[rgba(142,111,75,0.1)]",    label: "Home" },
};

const TIPS = [
  { icon: <SearchIcon className="h-4 w-4" />, title: "Lead Generation", body: "Insert any URL or PDF file to parse emails, phone numbers & social profiles." },
  { icon: <GlobeIcon className="h-4 w-4" />, title: "Scrape → Extract", body: 'After scraping a page, click "Extract data" to pull structured JSON from it.' },
  { icon: <MapIcon className="h-4 w-4" />, title: "Map → Crawl", body: "Map a site to view all its links, then start a Crawl from any discovered URL." },
  { icon: <UploadIcon className="h-4 w-4" />, title: "Parse Files", body: "Upload PDFs to extract clean text, then copy or download for processing." },
];

export default function OverviewView({ email, onNavigate }: OverviewViewProps) {
  const tools = ALL_NAV_ITEMS.filter(i => i.available && i.viewId && i.id !== "overview");

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <h3 className="font-serif text-2xl tracking-[-0.01em]">
          Welcome back, <span className="text-[var(--color-electric-indigo)]">{email.split("@")[0]}</span>.
        </h3>
        <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[var(--color-foreground-secondary)]">
          All pipeline tools are live and ready. Pick a tool below or open it from the sidebar.
        </p>
      </div>

      {/* Quick actions */}
      <div>
        <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-foreground-muted)]">
          Pipeline tools
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {tools.map(item => {
            const Icon = item.icon;
            const badge = TOOL_BADGES[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.viewId as ViewId)}
                className="group flex flex-col items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:border-[var(--color-accent)] hover:shadow-[0_4px_16px_rgba(142,111,75,0.1)]"
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${badge?.bg ?? "bg-[var(--color-warm-bone)]"} ${badge?.color ?? "text-[var(--color-accent)]"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {badge && (
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${badge.bg} ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="mt-0.5 text-[12px] leading-relaxed text-[var(--color-foreground-secondary)]">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div>
        <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-foreground-muted)]">
          Pro tips
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {TIPS.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(142,111,75,0.08)] text-[var(--color-accent)]">
                {tip.icon}
              </span>
              <div>
                <div className="text-[13px] font-semibold">{tip.title}</div>
                <div className="mt-0.5 text-[12px] leading-relaxed text-[var(--color-foreground-secondary)]">
                  {tip.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Firebase status pill */}
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <SparkIcon className="h-4 w-4 text-[var(--color-electric-indigo)]" />
        <span className="text-[13px] font-medium">
          Signed in as <span className="font-semibold text-[var(--color-charcoal)]">{email}</span>
        </span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-[rgba(94,165,0,0.28)] bg-[rgba(94,165,0,0.08)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-success)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-success)]" />
          Firebase Active
        </span>
      </div>
    </div>
  );
}