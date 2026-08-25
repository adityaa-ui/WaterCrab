"use client";
import React from "react";
import { downloadText } from "@/lib/download";
import { CheckIcon, CopyIcon, DownloadIcon } from "@/lib/icons";
import { slugify } from "@/lib/text";

export interface ScrapeResultProps {
  url: string;
  title: string;
  excerpt?: string;
  markdown: string;
  activeTab: "preview" | "markdown";
  onSetTab: (tab: "preview" | "markdown") => void;
  onCopy: (text: string) => void;
  copied: boolean;
}

export default function ScrapeResult({
  url,
  title,
  excerpt,
  markdown,
  activeTab,
  onSetTab,
  onCopy,
  copied
}: ScrapeResultProps) {
  const tabs: Array<"preview" | "markdown"> = ["preview", "markdown"];

  return (
    <div className="animate-fadeIn flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] shadow-[0_16px_40px_rgba(41,37,36,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden shrink-0 rounded bg-[var(--color-electric-indigo)]/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-electric-indigo)] sm:inline-block">
            Scraped
          </span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            title={url}
            className="max-w-[220px] truncate font-mono text-xs text-[var(--color-sapphire-link)] hover:underline"
          >
            {url}
          </a>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onSetTab(tab)}
                className={`rounded-md px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                  activeTab === tab
                    ? "bg-[var(--color-electric-indigo)] text-white"
                    : "text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onCopy(markdown)}
            title="Copy Markdown"
            className="rounded-lg border border-[var(--color-stone-mist)] p-1.5 text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
          >
            {copied ? <CheckIcon className="text-[var(--color-lichen-green)]" /> : <CopyIcon />}
          </button>

          <button
            type="button"
            onClick={() => downloadText(`${slugify(title)}.md`, markdown)}
            title="Download Markdown"
            className="rounded-lg border border-[var(--color-stone-mist)] p-1.5 text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
          >
            <DownloadIcon />
          </button>
        </div>
      </div>

      <div className="max-h-[520px] flex-1 overflow-auto p-5">
        {activeTab === "markdown" ? (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--color-charcoal)] selection:bg-[rgba(97,95,255,0.18)]">
            {markdown}
          </pre>
        ) : (
          <article>
            <h2 className="font-serif text-lg font-semibold text-[var(--color-charcoal)]">{title}</h2>
            {excerpt && (
              <blockquote className="mt-2 border-l-2 border-[var(--color-electric-indigo)] pl-3 text-xs italic text-[var(--color-bark-grey)]">
                {excerpt}
              </blockquote>
            )}
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--color-charcoal)]">
              {markdown}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
