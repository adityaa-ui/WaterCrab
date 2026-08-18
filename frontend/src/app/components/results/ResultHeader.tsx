"use client";
import React from "react";
import Dropdown from "@/app/workspace/Dropdown";
import { ExternalLinkIcon, GlobeIcon, MoreIcon, SparkIcon } from "@/lib/icons";

export interface ResultHeaderProps {
  title: string;
  url: string;
  hostname: string;
  wordCount: number;
  readingTime: number;
  onExtract: () => void;
  onOpenInPipeline: () => void;
  onNewScrape: () => void;
}

/** Result header: status badge, source identity + metadata, primary actions
    (Extract CTA + overflow menu). Progressive disclosure keeps it uncluttered. */
export default function ResultHeader({
  title,
  url,
  hostname,
  wordCount,
  readingTime,
  onExtract,
  onOpenInPipeline,
  onNewScrape
}: ResultHeaderProps) {
  return (
    <header className="border-b border-[var(--color-border)] px-5 py-4 md:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {/* Source favicon / globe tile */}
          <div
            className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-paper-white)] text-[var(--color-accent)] shadow-sm sm:flex"
            aria-hidden="true"
          >
            <GlobeIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div
              className="flex flex-wrap items-center gap-x-2 gap-y-1"
              role="status"
              aria-live="polite"
            >
              <span className="flex items-center gap-1.5 rounded-full border border-[rgba(94,165,0,0.28)] bg-[rgba(94,165,0,0.08)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-success)]">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]"
                  aria-hidden="true"
                />
                Scraped
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-foreground-secondary)]">
                {hostname}
              </span>
              <span className="text-[var(--color-foreground-muted)]" aria-hidden="true">
                ·
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-foreground-secondary)]">
                {wordCount.toLocaleString()} words
              </span>
              <span className="text-[var(--color-foreground-muted)]" aria-hidden="true">
                ·
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-foreground-secondary)]">
                ~{readingTime} min read
              </span>
            </div>

            <h2
              className="mt-1.5 truncate font-serif text-lg font-semibold leading-snug tracking-[-0.01em] text-[var(--color-charcoal)] md:text-xl"
              title={title}
            >
              {title}
            </h2>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              title={url}
              className="mt-1 flex max-w-full items-center gap-1 font-mono text-[10px] text-[var(--color-sapphire-link)] transition hover:underline"
            >
              <span className="truncate">{url}</span>
              <ExternalLinkIcon className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onExtract}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-[var(--color-deep-violet)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(97,95,255,0.45)]"
          >
            <SparkIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Extract data</span>
          </button>

          <Dropdown
            label="More result actions"
            align="right"
            buttonClassName="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-paper-white)] text-[var(--color-foreground-secondary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-charcoal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(97,95,255,0.35)]"
            button={() => <MoreIcon className="h-4 w-4" />}
          >
            {close => (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    onOpenInPipeline();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-[var(--color-foreground-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-charcoal)]"
                >
                  Open in pipeline
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    onNewScrape();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-[var(--color-foreground-secondary)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-charcoal)]"
                >
                  New scrape
                </button>
              </>
            )}
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
