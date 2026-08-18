"use client";
import React, { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon, GlobeIcon, SearchIcon, MapIcon, CrawlIcon } from "@/lib/icons";
import {
  DEFAULT_API_URL,
  createCrawlJob,
  mapCrawlStatus,
  normalizeUrl,
  pollCrawlJob,
  validateUrl
} from "@/lib/jobs";
import type { CrawlJob, ScrapeResponse } from "@/lib/types";

type Mode = "search" | "scrape" | "map" | "crawl";

interface ModeMeta {
  id: Mode;
  label: string;
  available: boolean;
  icon: React.ReactNode;
}

const MODES: ModeMeta[] = [
  { id: "search", label: "Search", available: false, icon: <SearchIcon /> },
  { id: "scrape", label: "Scrape", available: true, icon: <GlobeIcon /> },
  { id: "map", label: "Map", available: false, icon: <MapIcon /> },
  { id: "crawl", label: "Crawl", available: true, icon: <CrawlIcon /> }
];

interface ResultRow {
  id: string;
  title: string;
  url: string;
  body: string;
}

export default function SearchBar({ onResultsChange }: { onResultsChange: (visible: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("scrape");
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  const [crawlJob, setCrawlJob] = useState<CrawlJob | null>(null);
  const [crawlUrl, setCrawlUrl] = useState("");

  const stopPollRef = useRef<(() => void) | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopPollRef.current?.();
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 1600);
  };

  const runScrape = async (url: string) => {
    setLoading(true);
    setError("");
    setNotice("");
    setResults([]);
    setCrawlJob(null);
    onResultsChange(true);
    try {
      const res = await fetch(`${DEFAULT_API_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = (await res.json()) as ScrapeResponse;
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to scrape this page.");
      const clean = (data.markdown || "").replace(/[#*_`]/g, "").trim();
      setResults([
        {
          id: "scrape",
          title: data.title || "Scraped page",
          url,
          body: data.excerpt || clean.slice(0, 260) || "The page was scraped successfully."
        }
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const runCrawl = async (url: string) => {
    setLoading(true);
    setError("");
    setNotice("");
    setResults([]);
    onResultsChange(true);
    try {
      const jobId = await createCrawlJob(url, 5);
      setCrawlUrl(url);
      setCrawlJob({ id: jobId, status: "pending", results: [] });
      stopPollRef.current?.();
      stopPollRef.current = pollCrawlJob({
        jobId,
        intervalMs: 1500,
        onJob: (job) => setCrawlJob(job),
        onTerminal: (job) => {
          setCrawlJob(job);
          setLoading(false);
          if (mapCrawlStatus(job.status) === "failed") {
            setError(job.error || "The crawl failed to complete.");
          }
        },
        onError: (pollErr) => {
          setError(`Could not poll the crawl job: ${pollErr.message}`);
          setLoading(false);
        }
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to start the crawl.");
      setLoading(false);
    }
  };

  const run = (event?: React.FormEvent, overrideUrl?: string) => {
    event?.preventDefault();
    const term = (overrideUrl || query).trim();

    if (mode === "search" || mode === "map") {
      setResults([]);
      setCrawlJob(null);
      setError("");
      setNotice(
        mode === "search"
          ? "Web search is coming soon. Try Scrape or Crawl to run a real job today."
          : "Site mapping is coming soon. Try Scrape or Crawl to run a real job today."
      );
      onResultsChange(false);
      return;
    }

    const urlError = validateUrl(term);
    if (urlError) {
      setError(urlError);
      setNotice("");
      return;
    }
    const url = normalizeUrl(term);
    if (mode === "scrape") {
      void runScrape(url);
    } else {
      void runCrawl(url);
    }
  };

  const newSearch = () => {
    setResults(null);
    setQuery("");
    setError("");
    setNotice("");
    setCrawlJob(null);
    setCrawlUrl("");
    setMode("scrape");
    onResultsChange(false);
  };

  const copyResults = async () => {
    const payload =
      crawlJob && crawlJob.results.length > 0
        ? crawlJob.results.map((r) => ({ url: r.url, title: r.title, markdown: r.markdown }))
        : results ?? [];
    await handleCopy(JSON.stringify(payload, null, 2));
  };

  const status = crawlJob ? mapCrawlStatus(crawlJob.status) : null;
  const percent =
    crawlJob && crawlJob.progress && crawlJob.progress.total > 0
      ? Math.round((crawlJob.progress.current / crawlJob.progress.total) * 100)
      : 0;

  return (
    <div className="mx-auto w-full max-w-[700px]">
      <form onSubmit={run} className="overflow-hidden rounded-[22px] border border-[var(--color-stone-mist)] bg-white text-left shadow-[0_16px_40px_rgba(41,37,36,0.1)]">
        <div className="flex items-center gap-3 border-b border-[var(--color-stone-mist)] px-5 py-5">
          <GlobeIcon className="h-5 w-5 shrink-0 text-[var(--color-pebble)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "scrape" ? "Enter a website URL" : "Paste a target URL"}
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[var(--color-pebble)]"
            aria-label="Target URL"
          />
        </div>
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${
                  mode === item.id
                    ? "bg-[var(--color-warm-bone)] font-semibold text-[var(--color-charcoal)] shadow-sm"
                    : "text-[var(--color-bark-grey)] hover:bg-[var(--color-warm-bone)]"
                } ${item.available ? "" : "opacity-60"}`}
              >
                {item.icon}
                {item.label}
                {!item.available && (
                  <span className="rounded bg-[var(--color-warm-bone)] px-1 py-0.5 text-[9px] text-[var(--color-bark-grey)]">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="flex h-10 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-electric-indigo)] text-white transition hover:bg-[var(--color-deep-violet)] disabled:opacity-50"
            disabled={!query.trim()}
            aria-label="Submit"
          >
            →
          </button>
        </div>
      </form>
      <p className="mt-3 text-center font-mono text-[11px] tracking-wide text-[var(--color-pebble)]">
        Scrape &amp; crawl — no sign-in required · Search &amp; Map coming soon
      </p>

      {notice && (
        <div className="mt-6 animate-fadeIn rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-5 text-sm text-[var(--color-charcoal)]">
          {notice}
        </div>
      )}

      {error && (
        <div className="mt-6 animate-fadeIn rounded-xl border border-[rgba(255,0,0,0.25)] bg-[rgba(255,0,0,0.04)] p-5 text-sm text-[var(--color-charcoal)]">
          {error}
        </div>
      )}

      {loading && !crawlJob && !results && (
        <div className="space-y-5 py-7">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--color-stone-mist)]" />
          ))}
        </div>
      )}

      {crawlJob && status && status !== "completed" && status !== "failed" && (
        <div className="mt-6 animate-fadeIn rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-[var(--color-charcoal)]">
              <CrawlIcon className="h-4 w-4 text-[var(--color-electric-indigo)]" />
              Crawl {status}
            </div>
            <span className="font-mono text-xs text-[var(--color-bark-grey)]">
              {crawlJob.progress ? `${crawlJob.progress.current}/${crawlJob.progress.total}` : ""}
            </span>
          </div>
          {crawlJob.progress && crawlJob.progress.total > 0 && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--color-stone-mist)]">
              <div
                className="h-full rounded-full bg-[var(--color-electric-indigo)] transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
          <p className="mt-3 truncate font-mono text-[10px] text-[var(--color-pebble)]">{crawlUrl}</p>
        </div>
      )}

{crawlJob && status === "completed" && !error && (
        <div className="mt-6 animate-fadeIn rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] pb-4">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <CrawlIcon className="h-5 w-5 text-[var(--color-electric-indigo)]" />
                Crawl complete
              </div>
              <p className="mt-1 text-sm text-[var(--color-bark-grey)]">
                {crawlJob.results.length} page{crawlJob.results.length === 1 ? "" : "s"} collected.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyResults}
                className="flex items-center gap-1 rounded-lg border border-[var(--color-stone-mist)] px-3 py-1.5 text-sm hover:border-[var(--color-electric-indigo)]"
              >
                {copied ? <CheckIcon className="text-[var(--color-lichen-green)]" /> : <CopyIcon />}
                {copied ? "Copied!" : "Get JSON"}
              </button>
              <a
                href="#pipeline"
                className="rounded-lg bg-[var(--color-electric-indigo)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-deep-violet)]"
              >
                Open in pipeline
              </a>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            {crawlJob.results.slice(0, 6).map((page) => (
              <a
                key={`${page.url}-${page.title}`}
                href="#pipeline"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal)] transition hover:bg-[var(--color-warm-bone)]"
              >
                <span className="truncate">{page.title || "Untitled page"}</span>
                <span className="ml-3 shrink-0 truncate font-mono text-[10px] text-[var(--color-pebble)]">
                  {page.url}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {results && !loading && !notice && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] pb-4">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                {results[0]?.title ?? "Scraped page"}
              </div>
              <p className="mt-1 text-sm text-[var(--color-bark-grey)]">
                {results.length} {mode} result{results.length === 1 ? "" : "s"} found.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyResults}
                className="flex items-center gap-1 rounded-lg border border-[var(--color-stone-mist)] px-3 py-1.5 text-sm hover:border-[var(--color-electric-indigo)]"
              >
                {copied ? <CheckIcon className="text-[var(--color-lichen-green)]" /> : <CopyIcon />}
                {copied ? "Copied!" : "Get JSON"}
              </button>
              <a
                href="#pipeline"
                className="rounded-lg bg-[var(--color-electric-indigo)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-deep-violet)]"
              >
                Open in pipeline
              </a>
            </div>
          </div>
          <div>
            {results.map((result, index) => (
              <article key={result.id} className="flex gap-5 border-b border-[var(--color-stone-mist)] py-7 last:border-0">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[17px] font-semibold">
                    <span className="mr-2 text-[var(--color-electric-indigo)]">#{index + 1}</span>
                    {result.title}
                  </h2>
                  <a href={result.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm text-[var(--color-sapphire-link)] hover:underline">
                    {result.url}
                  </a>
                  <p className="mt-3 max-w-3xl leading-relaxed text-[15px] text-[var(--color-bark-grey)]">
                    {result.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => newSearch()}
                  className="h-fit shrink-0 rounded-lg bg-[var(--color-warm-bone)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-stone-mist)]"
                >
                  New
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

