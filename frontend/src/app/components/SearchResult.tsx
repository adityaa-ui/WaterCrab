"use client";
import React from "react";
import { CheckIcon, CopyIcon, GlobeIcon, SearchIcon } from "@/lib/icons";
import type { SearchResultItem } from "@/lib/types";

interface SearchResultProps {
  query: string;
  results: SearchResultItem[];
  onScrapeUrl: (url: string) => void;
  onCrawlUrl: (url: string) => void;
  onCopy: (text: string) => void;
  copied: boolean;
}

export default function SearchResult({
  query,
  results,
  onScrapeUrl,
  onCrawlUrl,
  onCopy,
  copied
}: SearchResultProps) {
  return (
    <div className="animate-fadeIn rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-[var(--color-charcoal)]">
            <SearchIcon className="h-5 w-5 text-[var(--color-electric-indigo)]" />
            Search results for &quot;{query}&quot;
          </div>
          <p className="mt-1 font-mono text-xs text-[var(--color-bark-grey)]">
            Found {results.length} relevant result{results.length === 1 ? "" : "s"}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCopy(JSON.stringify(results, null, 2))}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-stone-mist)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--color-charcoal)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-electric-indigo)]"
        >
          {copied ? <CheckIcon className="h-4 w-4 text-[var(--color-lichen-green)]" /> : <CopyIcon className="h-4 w-4" />}
          {copied ? "Copied!" : "Export JSON"}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {results.map((item, idx) => (
          <article
            key={item.id || idx}
            className="group rounded-xl border border-[var(--color-stone-mist)] bg-white p-4 transition hover:border-[var(--color-electric-indigo)] hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--color-electric-indigo)]">
                    #{idx + 1}
                  </span>
                  {item.domain && (
                    <span className="rounded bg-[var(--color-warm-bone)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--color-bark-grey)]">
                      {item.domain}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-base font-semibold text-[var(--color-charcoal)]">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[var(--color-electric-indigo)] hover:underline"
                  >
                    {item.title}
                  </a>
                </h3>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 block truncate font-mono text-xs text-[var(--color-sapphire-link)]"
                >
                  {item.url}
                </a>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-bark-grey)]">
                  {item.snippet}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onScrapeUrl(item.url)}
                  className="flex items-center gap-1 rounded-md bg-[var(--color-warm-bone)] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--color-charcoal)] transition hover:bg-[var(--color-electric-indigo)] hover:text-white"
                >
                  <GlobeIcon className="h-3.5 w-3.5" /> Scrape
                </button>
                <button
                  type="button"
                  onClick={() => onCrawlUrl(item.url)}
                  className="flex items-center gap-1 rounded-md bg-[var(--color-warm-bone)] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--color-charcoal)] transition hover:bg-[var(--color-electric-indigo)] hover:text-white"
                >
                  Crawl
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
