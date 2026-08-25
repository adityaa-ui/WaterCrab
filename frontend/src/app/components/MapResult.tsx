"use client";
import React, { useState } from "react";
import { CheckIcon, CopyIcon, GlobeIcon, MapIcon } from "@/lib/icons";
import type { MapResultItem } from "@/lib/types";

interface MapResultProps {
  targetUrl: string;
  domain: string;
  total: number;
  links: MapResultItem[];
  onScrapeUrl: (url: string) => void;
  onCrawlUrl: (url: string) => void;
  onCopy: (text: string) => void;
  copied: boolean;
}

export default function MapResult({
  targetUrl,
  domain,
  total,
  links,
  onScrapeUrl,
  onCrawlUrl,
  onCopy,
  copied
}: MapResultProps) {
  const [filter, setFilter] = useState("");

  const filteredLinks = links.filter(
    (item) =>
      item.url.toLowerCase().includes(filter.toLowerCase()) ||
      item.path.toLowerCase().includes(filter.toLowerCase()) ||
      item.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="animate-fadeIn rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-[var(--color-charcoal)]">
            <MapIcon className="h-5 w-5 text-[var(--color-electric-indigo)]" />
            Site Map for {domain || targetUrl}
          </div>
          <p className="mt-1 font-mono text-xs text-[var(--color-bark-grey)]">
            Mapped {total} URL endpoint{total === 1 ? "" : "s"} across domain topology.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCopy(links.map((l) => l.url).join("\n"))}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-stone-mist)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--color-charcoal)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-electric-indigo)]"
          >
            {copied ? <CheckIcon className="h-4 w-4 text-[var(--color-lichen-green)]" /> : <CopyIcon className="h-4 w-4" />}
            {copied ? "Copied URLs!" : "Copy URLs"}
          </button>
          <button
            type="button"
            onClick={() => onCopy(JSON.stringify(links, null, 2))}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-stone-mist)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--color-charcoal)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-electric-indigo)]"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="mt-4">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter topology links by path or title..."
          className="w-full rounded-xl border border-[var(--color-stone-mist)] bg-white px-4 py-2.5 font-mono text-xs text-[var(--color-charcoal)] placeholder:text-[var(--color-pebble)] focus:border-[var(--color-electric-indigo)] focus:outline-none"
        />
      </div>

      <div className="mt-4 max-h-[500px] overflow-y-auto rounded-xl border border-[var(--color-stone-mist)] bg-white divide-y divide-[var(--color-stone-mist)]">
        {filteredLinks.length === 0 ? (
          <div className="p-6 text-center font-mono text-xs text-[var(--color-pebble)]">
            No matching links found for filter &quot;{filter}&quot;.
          </div>
        ) : (
          filteredLinks.map((item, idx) => (
            <div
              key={`${item.url}-${idx}`}
              className="flex flex-wrap items-center justify-between gap-3 p-3 transition hover:bg-[var(--color-warm-bone)]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[rgba(97,95,255,0.08)] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[var(--color-electric-indigo)]">
                    {item.status.toUpperCase()}
                  </span>
                  <span className="truncate font-semibold text-xs text-[var(--color-charcoal)]">
                    {item.title || item.path}
                  </span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 block truncate font-mono text-[11px] text-[var(--color-sapphire-link)]"
                >
                  {item.url}
                </a>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onScrapeUrl(item.url)}
                  className="flex items-center gap-1 rounded border border-[var(--color-stone-mist)] px-2 py-1 font-mono text-[10px] font-medium transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-electric-indigo)]"
                >
                  <GlobeIcon className="h-3 w-3" /> Scrape
                </button>
                <button
                  type="button"
                  onClick={() => onCrawlUrl(item.url)}
                  className="flex items-center gap-1 rounded border border-[var(--color-stone-mist)] px-2 py-1 font-mono text-[10px] font-medium transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-electric-indigo)]"
                >
                  Crawl
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
