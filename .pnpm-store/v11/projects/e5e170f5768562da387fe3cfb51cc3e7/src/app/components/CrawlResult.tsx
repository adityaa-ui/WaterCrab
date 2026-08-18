"use client";
import React from "react";
import { downloadText } from "@/lib/download";
import { CheckIcon, CopyIcon, DownloadIcon } from "@/lib/icons";
import { mapCrawlStatus } from "@/lib/jobs";
import { slugify } from "@/lib/text";
import type { CrawlJob } from "@/lib/types";

export interface CrawlResultProps {
  job: CrawlJob;
  selectedPage: number | null;
  onSelectPage: (index: number) => void;
  onCopy: (text: string) => void;
  copied: boolean;
}

export default function CrawlResult({
  job,
  selectedPage,
  onSelectPage,
  onCopy,
  copied
}: CrawlResultProps) {
  const pages = job.results ?? [];
  const hasPages = pages.length > 0;
  const status = mapCrawlStatus(job.status);
  const active = selectedPage !== null ? pages[selectedPage] : undefined;

  return (
    <div className="animate-fadeIn flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] shadow-[0_16px_40px_rgba(41,37,36,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="shrink-0 rounded bg-[var(--color-tide-teal)]/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-tide-teal)]">
            Crawl
          </span>
          <span className="font-mono text-xs font-semibold text-[var(--color-charcoal)]">Collected Content</span>
        </div>
        <div className="font-mono text-xs text-[var(--color-bark-grey)]">
          <span className="font-semibold text-[var(--color-charcoal)]">{pages.length}</span>{" "}
          page{pages.length === 1 ? "" : "s"} · <span className="uppercase">{status}</span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-12">
        {/* Pages list */}
        <div className="max-h-[440px] overflow-y-auto border-b border-[var(--color-stone-mist)] md:col-span-5 md:border-b-0 md:border-r">
          {hasPages ? (
            <div className="divide-y divide-[var(--color-stone-mist)]">
              {pages.map((page, index) => (
                <button
                  key={`${page.url}-${index}`}
                  type="button"
                  onClick={() => onSelectPage(index)}
                  className={`w-full border-l-2 p-3 text-left text-xs transition ${
                    selectedPage === index
                      ? "border-[var(--color-electric-indigo)] bg-[rgba(97,95,255,0.08)] text-[var(--color-charcoal)]"
                      : "border-transparent text-[var(--color-bark-grey)] hover:bg-[var(--color-warm-bone)]"
                  }`}
                >
                  <span className="mb-1 block truncate font-semibold text-[var(--color-charcoal)]">
                    {page.title || "Untitled page"}
                  </span>
                  <span className="block truncate text-[10px] text-[var(--color-pebble)]">{page.url}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs italic text-[var(--color-bark-grey)]">
              No pages collected yet.
            </div>
          )}
        </div>

        {/* Page viewer */}
        <div className="flex max-h-[440px] flex-col overflow-y-auto p-4 md:col-span-7">
          {active ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] pb-3">
                <a
                  href={active.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-mono text-[10px] text-[var(--color-sapphire-link)] hover:underline"
                >
                  {active.url}
                </a>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCopy(active.markdown)}
                    title="Copy Markdown"
                    className="rounded-lg border border-[var(--color-stone-mist)] p-1.5 text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
                  >
                    {copied ? <CheckIcon className="text-[var(--color-lichen-green)]" /> : <CopyIcon />}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(`${slugify(active.title)}.md`, active.markdown)}
                    title="Download Markdown"
                    className="rounded-lg border border-[var(--color-stone-mist)] p-1.5 text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </div>
              <h3 className="mb-2 text-sm font-bold text-[var(--color-charcoal)]">{active.title}</h3>
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[var(--color-charcoal)] selection:bg-[rgba(97,95,255,0.18)]">
                {active.markdown}
              </pre>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-xs italic text-[var(--color-bark-grey)]">
              Select a page on the left to read its collected Markdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
