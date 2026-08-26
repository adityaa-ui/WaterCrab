"use client";
import React from "react";
import { CrawlIcon, ExternalLinkIcon, GlobeIcon, MapIcon, SparkIcon } from "@/lib/icons";

export interface ResultActionsProps {
  url: string;
  onScrape: () => void;
  onExtract: () => void;
  onCrawl: () => void;
}

const baseAction =
  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(142,111,75,0.35)]";

/** Contextual next-step actions beneath the result. Only implemented actions
    are interactive; unimplemented ones follow the existing "Soon" convention. */
export default function ResultActions({
  url,
  onScrape,
  onExtract,
  onCrawl
}: ResultActionsProps) {
  return (
    <div className="border-t border-[var(--color-border)] px-4 py-3 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-foreground-muted)]">
          Next steps
        </span>

        <button
          type="button"
          onClick={onScrape}
          className={`${baseAction} border-[var(--color-border)] bg-[var(--color-paper-white)] text-[var(--color-charcoal)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]`}
        >
          <GlobeIcon className="h-3.5 w-3.5" />
          Scrape this page
        </button>

        <button
          type="button"
          onClick={onExtract}
          className={`${baseAction} border-[var(--color-accent)] bg-[var(--color-accent)] text-white shadow-sm hover:bg-[var(--color-deep-violet)]`}
        >
          <SparkIcon className="h-3.5 w-3.5" />
          Extract data
        </button>

        <button
          type="button"
          onClick={onCrawl}
          className={`${baseAction} border-[var(--color-border)] bg-[var(--color-paper-white)] text-[var(--color-charcoal)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]`}
        >
          <CrawlIcon className="h-3.5 w-3.5" />
          Crawl this site
        </button>

        <button
          type="button"
          onClick={() => window.location.assign("#map")}
          className={`${baseAction} border-[var(--color-border)] bg-[var(--color-paper-white)] text-[var(--color-charcoal)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]`}
        >
          <MapIcon className="h-3.5 w-3.5" />
          Map this site
        </button>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={`${baseAction} border-[var(--color-border)] bg-[var(--color-paper-white)] text-[var(--color-sapphire-link)] hover:border-[var(--color-sapphire-link)]`}
        >
          <ExternalLinkIcon className="h-3.5 w-3.5" />
          Open source
        </a>
      </div>
    </div>
  );
}
