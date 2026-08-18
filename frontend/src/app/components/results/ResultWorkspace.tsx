"use client";
import React, { useEffect, useRef, useState } from "react";
import ResultHeader from "./ResultHeader";
import ResultTabs, { type ResultTabId } from "./ResultTabs";
import ResultPreview from "./ResultPreview";
import ResultMarkdown from "./ResultMarkdown";
import ResultJson from "./ResultJson";
import ResultActions from "./ResultActions";
import { CheckIcon, CopyIcon, DownloadIcon } from "@/lib/icons";
import { downloadText } from "@/lib/download";
import { slugify } from "@/lib/text";

export interface ResultWorkspaceProps {
  url: string;
  title: string;
  excerpt?: string;
  markdown: string;
  onScrape: () => void;
  onExtract: () => void;
  onCrawl: () => void;
  onOpenInPipeline: () => void;
  onNewScrape: () => void;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Premium result workspace for a completed scrape: glass surface, header,
    tabs (Preview / Markdown / JSON), contextual actions and copy/download. */
export default function ResultWorkspace({
  url,
  title,
  excerpt,
  markdown,
  onScrape,
  onExtract,
  onCrawl,
  onOpenInPipeline,
  onNewScrape
}: ResultWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ResultTabId>("preview");
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const jsonText = JSON.stringify(
    { url, title, excerpt: excerpt ?? null, markdown },
    null,
    2
  );
  const activeContent = activeTab === "json" ? jsonText : markdown;
  const activeLabel = activeTab === "json" ? "JSON" : "Markdown";

  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  const copy = () => {
    navigator.clipboard.writeText(activeContent).catch(() => {
      /* clipboard unavailable — feedback is skipped */
    });
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    downloadText(
      `${slugify(title)}.${activeTab === "json" ? "json" : "md"}`,
      activeContent,
      activeTab === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8"
    );
  };

  return (
    <section
      aria-label="Scrape result workspace"
      className="result-surface animate-resultIn flex min-h-[420px] flex-1 flex-col overflow-hidden"
    >
      <ResultHeader
        title={title}
        url={url}
        hostname={hostnameOf(url)}
        wordCount={wordCount}
        readingTime={readingTime}
        onExtract={onExtract}
        onOpenInPipeline={onOpenInPipeline}
        onNewScrape={onNewScrape}
      />

      {/* Tab bar + contextual copy/download */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-1.5 md:px-4">
        <ResultTabs active={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${activeLabel}`}
            title={copied ? "Copied" : `Copy ${activeLabel}`}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(97,95,255,0.35)] ${
              copied
                ? "border-[rgba(94,165,0,0.35)] bg-[rgba(94,165,0,0.08)] text-[var(--color-success)]"
                : "border-[var(--color-border)] bg-[var(--color-paper-white)] text-[var(--color-foreground-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-charcoal)]"
            }`}
          >
            {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={download}
            aria-label={`Download ${activeLabel}`}
            title={`Download ${activeLabel}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-paper-white)] text-[var(--color-foreground-secondary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-charcoal)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(97,95,255,0.35)]"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Active panel */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div key={activeTab} id="result-panel" role="tabpanel" aria-labelledby={`result-tab-${activeTab}`} className="animate-tabIn h-full">
          {activeTab === "preview" && (
            <ResultPreview title={title} excerpt={excerpt} markdown={markdown} />
          )}
          {activeTab === "markdown" && <ResultMarkdown markdown={markdown} />}
          {activeTab === "json" && <ResultJson jsonText={jsonText} />}
        </div>
      </div>

      <ResultActions url={url} onScrape={onScrape} onExtract={onExtract} onCrawl={onCrawl} />

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </section>
  );
}
