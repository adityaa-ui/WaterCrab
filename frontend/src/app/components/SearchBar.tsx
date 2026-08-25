"use client";
import React, { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon, GlobeIcon, SearchIcon, MapIcon, CrawlIcon, DownloadIcon } from "@/lib/icons";
import {
  DEFAULT_API_URL,
  createCrawlJob,
  mapCrawlStatus,
  normalizeUrl,
  performMap,
  performSearch,
  pollCrawlJob,
  validateUrl
} from "@/lib/jobs";
import type { CrawlJob, ScrapeResponse } from "@/lib/types";
import ResultLoading from "./results/ResultLoading";
import ResultError from "./results/ResultError";

type Mode = "search" | "scrape" | "map" | "crawl";

interface ModeMeta {
  id: Mode;
  label: string;
  available: boolean;
  icon: React.ReactNode;
}

const MODES: ModeMeta[] = [
  { id: "search", label: "Search", available: true, icon: <SearchIcon /> },
  { id: "scrape", label: "Scrape", available: true, icon: <GlobeIcon /> },
  { id: "map", label: "Map", available: true, icon: <MapIcon /> },
  { id: "crawl", label: "Crawl", available: true, icon: <CrawlIcon /> }
];

interface ResultRow {
  id: string;
  title: string;
  url: string;
  body: string;
  domain?: string;
  path?: string;
}

function hostnameOf(url: string) {
  try { return new URL(url).hostname; } catch { return url; }
}

function SearchResultCard({ result, index, onCopyUrl }: { result: ResultRow; index: number; onCopyUrl: (url: string) => void }) {
  return (
    <article className="group animate-fadeIn overflow-hidden rounded-2xl border border-[var(--color-stone-mist)] bg-white shadow-[0_2px_12px_rgba(41,37,36,0.07)] transition hover:border-[var(--color-electric-indigo)] hover:shadow-[0_4px_24px_rgba(97,95,255,0.12)]">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--color-electric-indigo)]/10 font-mono text-[10px] font-bold text-[var(--color-electric-indigo)]">
            {index + 1}
          </span>
          <span className="truncate font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bark-grey)]">
            {result.domain ?? hostnameOf(result.url)}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-[rgba(94,165,0,0.28)] bg-[rgba(94,165,0,0.08)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-success)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
          Live
        </span>
      </div>

      {/* Card body */}
      <div className="px-5 py-4">
        <h3 className="font-serif text-[16px] font-semibold leading-snug text-[var(--color-charcoal)]">
          {result.title}
        </h3>
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 flex max-w-full items-center gap-1 font-mono text-[10px] text-[var(--color-sapphire-link)] transition hover:underline"
        >
          <span className="truncate">{result.url}</span>
          <ExternalLinkIcon className="h-3 w-3 shrink-0" />
        </a>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-bark-grey)]">
          {result.body}
        </p>
      </div>

      {/* Card actions */}
      <div className="flex items-center gap-2 border-t border-[var(--color-stone-mist)] px-5 py-3">
        <span className="mr-auto font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-foreground-muted)]">
          Actions
        </span>
        <button
          type="button"
          onClick={() => onCopyUrl(result.url)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-charcoal)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-electric-indigo)]"
        >
          <GlobeIcon className="h-3.5 w-3.5" />
          Scrape
        </button>
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-sapphire-link)] transition hover:border-[var(--color-sapphire-link)]"
        >
          <ExternalLinkIcon className="h-3.5 w-3.5" />
          Open
        </a>
      </div>
    </article>
  );
}

function MapResultCard({ result, index, onCopyUrl }: { result: ResultRow; index: number; onCopyUrl: (url: string) => void }) {
  return (
    <article className="group animate-fadeIn flex items-center gap-4 overflow-hidden rounded-2xl border border-[var(--color-stone-mist)] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(41,37,36,0.06)] transition hover:border-[var(--color-electric-indigo)] hover:shadow-[0_4px_16px_rgba(97,95,255,0.10)]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-electric-indigo)]/10 font-mono text-[10px] font-bold text-[var(--color-electric-indigo)]">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-[var(--color-charcoal)]">{result.path ?? "/"}</span>
          <span className="truncate font-mono text-[10px] text-[var(--color-pebble)]">{result.title}</span>
        </div>
        <a href={result.url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate font-mono text-[10px] text-[var(--color-sapphire-link)] hover:underline">
          {result.url}
        </a>
      </div>
      <button
        type="button"
        onClick={() => onCopyUrl(result.url)}
        className="shrink-0 rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-charcoal)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-electric-indigo)]"
      >
        Scrape
      </button>
    </article>
  );
}

function ScrapeResultCard({ result, onNew }: { result: ResultRow; onNew: () => void }) {
  return (
    <article className="animate-fadeIn overflow-hidden rounded-2xl border border-[var(--color-stone-mist)] bg-white shadow-[0_4px_24px_rgba(41,37,36,0.09)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-[rgba(94,165,0,0.28)] bg-[rgba(94,165,0,0.08)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-success)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            Scraped
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-bark-grey)]">
            {hostnameOf(result.url)}
          </span>
        </div>
        <button onClick={onNew} className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]">
          New scrape
        </button>
      </div>
      <div className="px-5 py-5">
        <h3 className="font-serif text-xl font-semibold text-[var(--color-charcoal)]">{result.title}</h3>
        <a href={result.url} target="_blank" rel="noreferrer" className="mt-1 flex max-w-full items-center gap-1 font-mono text-[10px] text-[var(--color-sapphire-link)] hover:underline">
          <span className="truncate">{result.url}</span>
          <ExternalLinkIcon className="h-3 w-3 shrink-0" />
        </a>
        <p className="mt-4 text-[14px] leading-relaxed text-[var(--color-bark-grey)]">{result.body}</p>
      </div>
    </article>
  );
}

export default function SearchBar({ onResultsChange }: { onResultsChange: (visible: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("scrape");
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState("");

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

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(""), 1600);
  };

  const runSearch = async (searchTerm: string) => {
    setLoading(true); setError(""); setNotice(""); setResults([]); setCrawlJob(null);
    onResultsChange(true);
    try {
      const data = await performSearch(searchTerm);
      if (!data.results || data.results.length === 0) {
        setNotice(`No web search results found for "${searchTerm}".`);
        setResults([]);
      } else {
        setResults(data.results.map((r) => ({
          id: r.id, title: r.title, url: r.url,
          body: r.snippet || `Web search result from ${r.domain || r.url}`,
          domain: r.domain
        })));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const runMap = async (targetUrl: string) => {
    setLoading(true); setError(""); setNotice(""); setResults([]); setCrawlJob(null);
    onResultsChange(true);
    try {
      const data = await performMap(targetUrl);
      if (!data.links || data.links.length === 0) {
        setNotice(`No site map links discovered for "${targetUrl}".`);
        setResults([]);
      } else {
        setResults(data.links.map((link, idx) => ({
          id: `map-${idx}`,
          title: link.title || link.path,
          url: link.url,
          body: `Mapped link: ${link.path}`,
          path: link.path
        })));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Site mapping failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const runScrape = async (url: string) => {
    setLoading(true); setError(""); setNotice(""); setResults([]); setCrawlJob(null);
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
      setResults([{
        id: "scrape",
        title: data.title || "Scraped page",
        url,
        body: data.excerpt || clean.slice(0, 400) || "The page was scraped successfully."
      }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const runCrawl = async (url: string) => {
    setLoading(true); setError(""); setNotice(""); setResults([]);
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
          if (mapCrawlStatus(job.status) === "failed") setError(job.error || "The crawl failed to complete.");
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
    if (!term) return;

    if (mode === "search") { void runSearch(term); return; }

    if (mode === "map") {
      const urlError = validateUrl(term);
      if (urlError) { setError(urlError); setNotice(""); return; }
      void runMap(normalizeUrl(term));
      return;
    }

    const urlError = validateUrl(term);
    if (urlError) { setError(urlError); setNotice(""); return; }
    const url = normalizeUrl(term);
    if (mode === "scrape") { void runScrape(url); } else { void runCrawl(url); }
  };

  const newSearch = () => {
    setResults(null); setQuery(""); setError(""); setNotice("");
    setCrawlJob(null); setCrawlUrl(""); setMode("scrape");
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

  const placeholderMap: Record<Mode, string> = {
    search: "Enter a query or keyword (e.g. web scraping libraries)",
    scrape: "Enter a website URL to scrape (e.g. https://example.com)",
    map: "Enter a target URL to map links (e.g. https://example.com)",
    crawl: "Enter a seed URL for multi-page crawl"
  };

  return (
    <div className="mx-auto w-full max-w-[700px]">
      <form onSubmit={run} className="overflow-hidden rounded-[22px] border border-[var(--color-stone-mist)] bg-white text-left shadow-[0_16px_40px_rgba(41,37,36,0.1)]">
        <div className="flex items-center gap-3 border-b border-[var(--color-stone-mist)] px-5 py-5">
          <GlobeIcon className="h-5 w-5 shrink-0 text-[var(--color-pebble)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholderMap[mode]}
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[var(--color-pebble)]"
            aria-label="Target input"
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
                }`}
              >
                {item.icon}
                {item.label}
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
        Search, Scrape, Map &amp; Crawl — live web data engine
      </p>

      {/* Loading skeleton */}
      {loading && !crawlJob && !results && (
        <div className="mt-6">
          <ResultLoading status={`Running ${mode}…`} />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mt-6">
          <ResultError title="Something went wrong" message={error} onRetry={() => run()} />
        </div>
      )}

      {/* Notice */}
      {notice && !error && (
        <div className="mt-6 animate-fadeIn rounded-2xl border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-5 text-sm text-[var(--color-charcoal)]">
          {notice}
        </div>
      )}

      {/* Crawl in-progress */}
      {crawlJob && status && status !== "completed" && status !== "failed" && (
        <div className="mt-6">
          <ResultLoading
            status={`Crawl ${status}…`}
            progress={crawlJob.progress}
          />
        </div>
      )}

      {/* Crawl completed */}
      {crawlJob && status === "completed" && !error && (
        <div className="mt-6 animate-fadeIn overflow-hidden rounded-2xl border border-[var(--color-stone-mist)] bg-white shadow-[0_4px_24px_rgba(41,37,36,0.09)]">
          <div className="flex items-center justify-between border-b border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-5 py-3">
            <div>
              <div className="flex items-center gap-2 font-semibold text-[var(--color-charcoal)]">
                <CrawlIcon className="h-4 w-4 text-[var(--color-electric-indigo)]" />
                Crawl complete
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-bark-grey)]">
                {crawlJob.results.length} page{crawlJob.results.length === 1 ? "" : "s"} collected.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyResults}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-stone-mist)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-charcoal)] transition hover:border-[var(--color-electric-indigo)]"
              >
                {copied ? <CheckIcon className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <CopyIcon className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Get JSON"}
              </button>
              <button onClick={newSearch} className="rounded-lg bg-[var(--color-electric-indigo)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-[var(--color-deep-violet)]">
                New crawl
              </button>
            </div>
          </div>
          <div className="divide-y divide-[var(--color-stone-mist)] px-5">
            {crawlJob.results.slice(0, 8).map((page) => (
              <div key={`${page.url}-${page.title}`} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[var(--color-charcoal)]">{page.title || "Untitled page"}</p>
                  <p className="truncate font-mono text-[10px] text-[var(--color-pebble)]">{page.url}</p>
                </div>
                <a href={page.url} target="_blank" rel="noreferrer" className="ml-3 shrink-0">
                  <ExternalLinkIcon className="h-4 w-4 text-[var(--color-sapphire-link)]" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search / Scrape / Map results */}
      {results && results.length > 0 && !loading && !notice && (
        <div className="mt-6 space-y-3">
          {/* Results header */}
          <div className="flex items-center justify-between px-1">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bark-grey)]">
              {results.length} {mode} result{results.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyResults}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-stone-mist)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--color-charcoal)] transition hover:border-[var(--color-electric-indigo)]"
              >
                {copied ? <CheckIcon className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <DownloadIcon className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Export JSON"}
              </button>
              <button
                onClick={newSearch}
                className="rounded-lg bg-[var(--color-electric-indigo)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-[var(--color-deep-violet)]"
              >
                New search
              </button>
            </div>
          </div>

          {/* Result cards */}
          {mode === "scrape" && results.map((result) => (
            <ScrapeResultCard key={result.id} result={result} onNew={newSearch} />
          ))}

          {mode === "search" && results.map((result, i) => (
            <SearchResultCard key={result.id} result={result} index={i} onCopyUrl={handleCopyUrl} />
          ))}

          {mode === "map" && results.map((result, i) => (
            <MapResultCard key={result.id} result={result} index={i} onCopyUrl={handleCopyUrl} />
          ))}

          {/* Copy URL feedback toast */}
          {copiedUrl && (
            <div className="animate-fadeIn rounded-lg bg-[rgba(94,165,0,0.1)] border border-[rgba(94,165,0,0.3)] px-4 py-2 text-center font-mono text-[11px] text-[var(--color-success)]">
              ✓ Copied: {copiedUrl}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
