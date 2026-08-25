"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { GlobeIcon, CheckIcon, CopyIcon, DownloadIcon, Spinner } from "@/lib/icons";
import { DEFAULT_API_URL, normalizeUrl, validateUrl } from "@/lib/jobs";
import type { ScrapeResponse } from "@/lib/types";
import { downloadText } from "@/lib/download";
import { slugify } from "@/lib/text";

interface ScrapeResultData {
  url: string;
  title: string;
  excerpt?: string;
  markdown: string;
}

export default function ScrapeTool() {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [result, setResult] = useState<ScrapeResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "markdown">("preview");
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const validate = useCallback((value: string): boolean => {
    const err = validateUrl(value);
    setUrlError(err ?? "");
    return err === null;
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 1600);
  }, []);

  const handleDownload = useCallback((title: string, markdown: string) => {
    downloadText(`${slugify(title)}.md`, markdown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(url)) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${DEFAULT_API_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizeUrl(url) })
      });
      const data = (await res.json()) as ScrapeResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to scrape this page.");
      }

      setResult({
        url: data.url || normalizeUrl(url),
        title: data.title || "Scraped page",
        excerpt: data.excerpt,
        markdown: data.markdown || ""
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setUrlError("");
    setResult(null);
    setError("");
  };

  if (result) {
    return renderResult(result);
  }

  return renderForm();

  function renderResult(result: ScrapeResultData) {
    return (
      <div className="animate-fadeIn flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-5 py-3 rounded-t-[14px]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden shrink-0 rounded bg-[var(--color-electric-indigo)]/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-electric-indigo)] sm:inline-block">
              Scraped
            </span>
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              title={result.url}
              className="max-w-[280px] truncate font-mono text-xs text-[var(--color-sapphire-link)] hover:underline"
            >
              {result.url}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-0.5">
              {(["preview", "markdown"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
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
              onClick={() => handleCopy(result.markdown)}
              title="Copy Markdown"
              className="rounded-lg border border-[var(--color-stone-mist)] p-1.5 text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
            >
              {copied ? <CheckIcon className="text-[var(--color-lichen-green)]" /> : <CopyIcon />}
            </button>

            <button
              type="button"
              onClick={() => handleDownload(result.title, result.markdown)}
              title="Download Markdown"
              className="rounded-lg border border-[var(--color-stone-mist)] p-1.5 text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
            >
              <DownloadIcon />
            </button>

            <button
              type="button"
              onClick={handleReset}
              title="New scrape"
              className="ml-2 rounded-lg border border-[var(--color-stone-mist)] p-1.5 text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
            >
              <GlobeIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[360px] max-h-[520px] overflow-auto p-5 rounded-b-[14px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] shadow-[0_16px_40px_rgba(41,37,36,0.06)]">
          {activeTab === "markdown" ? (
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--color-charcoal)] selection:bg-[rgba(97,95,255,0.18)]">
              {result.markdown}
            </pre>
          ) : (
            <article>
              <h2 className="font-serif text-lg font-semibold text-[var(--color-charcoal)]">{result.title}</h2>
              {result.excerpt && (
                <blockquote className="mt-2 border-l-2 border-[var(--color-electric-indigo)] pl-3 text-xs italic text-[var(--color-bark-grey)]">
                  {result.excerpt}
                </blockquote>
              )}
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--color-charcoal)]">
                {result.markdown}
              </div>
            </article>
          )}
        </div>
      </div>
    );
  }


  function renderForm() {
    return (
      <div className="flex flex-col gap-4 h-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="scrape-url" className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-bark-grey)]">
              Target URL
            </label>
            <div className="relative">
              <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-pebble)]" aria-hidden="true" />
              <input
                id="scrape-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={(e) => validate(e.target.value)}
                placeholder="https://example.com/article"
                disabled={loading}
                className={`w-full rounded-lg border px-10 py-3 text-[var(--color-charcoal)] placeholder-[var(--color-pebble)] focus:border-[var(--color-electric-indigo)] focus:outline-none focus:ring-2 focus:ring-[rgba(97,95,255,0.18)] transition ${
                  urlError ? "border-[var(--color-alarm-red)]" : "border-[var(--color-stone-mist)]"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-invalid={urlError ? "true" : "false"}
                aria-describedby={urlError ? "scrape-url-error" : undefined}
              />
              {urlError && (
                <p id="scrape-url-error" className="mt-1 font-mono text-[10px] text-[var(--color-alarm-red)]" role="alert">
                  {urlError}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !url || urlError !== ""}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-electric-indigo)] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-deep-violet)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4" />
                Scraping…
              </>
            ) : (
              <>
                <GlobeIcon className="h-4 w-4" />
                Scrape Markdown
              </>
            )}
          </button>
        </form>

        {error && !loading && (
          <div className="animate-fadeIn rounded-[14px] border border-[rgba(255,0,0,0.25)] bg-[rgba(255,0,0,0.04)] p-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(255,0,0,0.1)] text-[var(--color-alarm-red)]">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-alarm-red)]">
                  Scrape failed
                </h3>
                <p className="mt-1 font-mono text-xs text-[var(--color-charcoal)]">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="animate-fadeIn flex-1 flex items-center justify-center rounded-[14px] border border-dashed border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] text-[var(--color-pebble)]">
              <GlobeIcon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-serif text-base font-semibold text-[var(--color-charcoal)]">
              Ready to scrape
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-bark-grey)]">
              Enter a URL above to fetch clean Markdown content from any page.
            </p>
          </div>
        )}
      </div>
    );
  }
}

