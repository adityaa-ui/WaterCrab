"use client";
import React, { useEffect, useRef, useState } from "react";
import ConfigPanel from "./ConfigPanel";
import ExtractResult from "./ExtractResult";
import CrawlResult from "./CrawlResult";
import ResultEmpty from "./results/ResultEmpty";
import ResultError from "./results/ResultError";
import ResultLoading from "./results/ResultLoading";
import ResultWorkspace from "./results/ResultWorkspace";
import SearchResult from "./SearchResult";
import MapResult from "./MapResult";
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
import { BotIcon, CrawlIcon, GlobeIcon, MapIcon, SearchIcon, SparkIcon, UsersIcon } from "@/lib/icons";
import LeadGenTool from "./LeadGenTool";
import type {
  CrawlJob,
  ExtractResponse,
  MapResultItem,
  PipelineMode,
  ScrapeData,
  ScrapeResponse,
  SearchResultItem
} from "@/lib/types";

const SCHEMA_TEMPLATES: Record<"product" | "article" | "custom", string> = {
  product: JSON.stringify(
    {
      type: "object",
      properties: {
        name: { type: "string", description: "The name of the product" },
        price: { type: "string", description: "The price of the product" },
        description: { type: "string", description: "Product description" },
        rating: { type: "string", description: "Rating or review score" }
      },
      required: ["name", "price"]
    },
    null,
    2
  ),
  article: JSON.stringify(
    {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the article" },
        author: { type: "string", description: "Author name" },
        publishDate: { type: "string", description: "Date of publication" },
        summary: { type: "string", description: "1-2 sentence summary of article" }
      },
      required: ["title"]
    },
    null,
    2
  ),
  custom: JSON.stringify(
    {
      type: "object",
      properties: {
        key: { type: "string", description: "Description of what to extract" }
      },
      required: ["key"]
    },
    null,
    2
  )
};

type SchemaTemplateKey = keyof typeof SCHEMA_TEMPLATES;

/** Human-friendly titles used by the premium result error state. */
const ERROR_TITLES: Record<"scrape" | "extract" | "crawl" | "search" | "map", string> = {
  scrape: "Scrape failed",
  extract: "Extraction failed",
  crawl: "Crawl failed",
  search: "Search failed",
  map: "Map failed"
};

interface Affordance {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

const AFFORDANCES: Affordance[] = [
  { id: "search", label: "Search", description: "Web search over live index", icon: <SearchIcon />, available: true },
  { id: "scrape", label: "Scrape", description: "Single-page clean Markdown", icon: <GlobeIcon />, available: true },
  { id: "map", label: "Map", description: "Site structure & link topology", icon: <MapIcon />, available: true },
  { id: "crawl", label: "Crawl", description: "Multi-page crawl with live progress", icon: <CrawlIcon />, available: true },
  { id: "extract", label: "Extract", description: "Structured JSON from a page", icon: <SparkIcon />, available: true },
  { id: "leadgen", label: "Lead Gen", description: "Parse emails, phones & socials", icon: <UsersIcon />, available: true }
];

export interface PipelineToolProps {
  initialUrl?: string;
  /** Render without the marketing section header + padding so the tool can
      be embedded inside the authenticated workspace shell. */
  bare?: boolean;
  initialMode?: "search" | "scrape" | "map" | "crawl" | "leadgen";
  initialExtract?: boolean;
}

export default function PipelineTool({ initialUrl, bare = false, initialMode = "scrape", initialExtract = false }: PipelineToolProps) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showConfig, setShowConfig] = useState(false);

  const [url, setUrl] = useState(initialUrl ?? "");
  const [mode, setMode] = useState<"scrape" | "crawl" | "search" | "map" | "leadgen">(initialMode || "scrape");
  const [maxPages, setMaxPages] = useState(3);
  const [structuredExtract, setStructuredExtract] = useState(initialExtract);
  const [schemaTemplate, setSchemaTemplate] = useState<SchemaTemplateKey>("product");
  const [schemaJson, setSchemaJson] = useState(SCHEMA_TEMPLATES.product);
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resultType, setResultType] = useState<PipelineMode | null>(null);

  const [scrapeResult, setScrapeResult] = useState<ScrapeData | null>(null);
  const [extractResult, setExtractResult] = useState<Record<string, unknown> | null>(null);
  const [crawlJob, setCrawlJob] = useState<CrawlJob | null>(null);
  const [searchResults, setSearchResults] = useState<{ query: string; results: SearchResultItem[] } | null>(null);
  const [mapResults, setMapResults] = useState<{ targetUrl: string; domain: string; total: number; links: MapResultItem[] } | null>(null);

  const [selectedCrawlPage, setSelectedCrawlPage] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastOp, setLastOp] = useState<"scrape" | "extract" | "crawl" | "search" | "map">("scrape");

  const stopPollRef = useRef<(() => void) | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const retryRef = useRef<(() => void) | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up polling + copy timers on unmount (no state updates happen here).
  useEffect(() => {
    return () => {
      stopPollRef.current?.();
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleTemplateChange = (template: SchemaTemplateKey) => {
    setSchemaTemplate(template);
    setSchemaJson(SCHEMA_TEMPLATES[template]);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const runScrape = async (targetUrl: string) => {
    retryRef.current = () => void runScrape(targetUrl);
    setLastOp("scrape");
    setLoading(true);
    setLoadingStatus("Rendering page with the headless browser…");
    setError(null);
    setScrapeResult(null);
    setExtractResult(null);
    setCrawlJob(null);
    setResultType("scrape");
    setSelectedCrawlPage(null);

    try {
      const res = await fetch(`${apiUrl}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizeUrl(targetUrl) })
      });
      const data = (await res.json()) as ScrapeResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Scrape failed (${res.status}).`);
      }
      setScrapeResult({
        url: normalizeUrl(targetUrl),
        title: data.title || targetUrl,
        excerpt: data.excerpt,
        markdown: data.markdown || ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected scraping error occurred.");
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const runExtract = async (targetUrl: string) => {
    retryRef.current = () => void runExtract(targetUrl);
    setLastOp("extract");
    setLoading(true);
    setLoadingStatus("Instructing the model to extract fields…");
    setError(null);
    setExtractResult(null);
    setScrapeResult(null);
    setCrawlJob(null);
    setResultType("extract");
    setSelectedCrawlPage(null);

    let parsedSchema: unknown;
    try {
      parsedSchema = JSON.parse(schemaJson);
    } catch {
      setError("Invalid JSON schema — fix the syntax before extracting.");
      setLoading(false);
      setLoadingStatus("");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalizeUrl(targetUrl),
          schema: parsedSchema,
          provider,
          apiKey
        })
      });
      const data = (await res.json()) as ExtractResponse;
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Extraction failed (${res.status}).`);
      }
      setExtractResult(data.data ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected extraction error occurred.");
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const runCrawl = async (targetUrl: string) => {
    retryRef.current = () => void runCrawl(targetUrl);
    setLastOp("crawl");
    setLoading(true);
    setLoadingStatus("Queueing crawl job…");
    setError(null);
    setCrawlJob(null);
    setScrapeResult(null);
    setExtractResult(null);
    setResultType("crawl");
    setSelectedCrawlPage(null);

    try {
      const jobId = await createCrawlJob(targetUrl, maxPages, apiUrl);
      stopPollRef.current?.();
      stopPollRef.current = pollCrawlJob({
        jobId,
        apiUrl,
        intervalMs: 1500,
        onJob: (job) => {
          setCrawlJob(job);
          setResultType("crawl");
          const status = mapCrawlStatus(job.status);
          if (status === "queued") {
            setLoadingStatus("Queued — starting shortly…");
          } else if (status === "running") {
            setLoadingStatus(
              job.progress && job.progress.total > 0
                ? `Crawling… ${job.progress.current} of ${job.progress.total} pages`
                : "Crawling…"
            );
          }
        },
        onTerminal: (job) => {
          setCrawlJob(job);
          setResultType("crawl");
          setSelectedCrawlPage(job.results && job.results.length > 0 ? 0 : null);
          setLoading(false);
          setLoadingStatus("");
          if (mapCrawlStatus(job.status) === "failed") {
            setError(job.error || "The crawl failed to complete.");
          }
        },
        onError: (pollErr) => {
          setError(`Could not poll the crawl job: ${pollErr.message}`);
          setLoading(false);
          setLoadingStatus("");
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start the crawl.");
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const runSearch = async (queryTerm: string) => {
    retryRef.current = () => void runSearch(queryTerm);
    setLastOp("search");
    setLoading(true);
    setLoadingStatus("Searching web index…");
    setError(null);
    setSearchResults(null);
    setMapResults(null);
    setScrapeResult(null);
    setExtractResult(null);
    setCrawlJob(null);
    setResultType("search");

    try {
      const data = await performSearch(queryTerm, 10, apiUrl);
      if (!data.results || data.results.length === 0) {
        throw new Error(`No web search results found for "${queryTerm}".`);
      }
      setSearchResults({ query: data.query || queryTerm, results: data.results });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const runMap = async (targetUrl: string) => {
    retryRef.current = () => void runMap(targetUrl);
    setLastOp("map");
    setLoading(true);
    setLoadingStatus("Discovering site topology & sitemap…");
    setError(null);
    setMapResults(null);
    setSearchResults(null);
    setScrapeResult(null);
    setExtractResult(null);
    setCrawlJob(null);
    setResultType("map");

    try {
      const data = await performMap(targetUrl, 50, apiUrl);
      if (!data.links || data.links.length === 0) {
        throw new Error(`No site topology links found for "${targetUrl}".`);
      }
      setMapResults({
        targetUrl,
        domain: data.domain || targetUrl,
        total: data.total || data.links.length,
        links: data.links
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Site mapping failed.");
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "search") {
      if (!url.trim()) {
        setError("Please enter a search query.");
        return;
      }
      void runSearch(url.trim());
      return;
    }

    const urlError = validateUrl(url);
    if (urlError) {
      setError(urlError);
      return;
    }

    if (structuredExtract) {
      void runExtract(url);
    } else if (mode === "map") {
      void runMap(url);
    } else if (mode === "crawl") {
      void runCrawl(url);
    } else {
      void runScrape(url);
    }
  };

  const selectAffordance = (aff: Affordance) => {
    if (aff.id === "extract") {
      setStructuredExtract(true);
      setMode("scrape");
    } else if (aff.id === "crawl") {
      setStructuredExtract(false);
      setMode("crawl");
    } else if (aff.id === "scrape") {
      setStructuredExtract(false);
      setMode("scrape");
    } else if (aff.id === "search") {
      setStructuredExtract(false);
      setMode("search");
    } else if (aff.id === "map") {
      setStructuredExtract(false);
      setMode("map");
    } else if (aff.id === "leadgen") {
      setStructuredExtract(false);
      setMode("leadgen");
    }
  };

  const scrollToForm = () => {
    document.getElementById("pipeline")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Clears the current result and returns to the form for a fresh run. */
  const handleNewScrape = () => {
    stopPollRef.current?.();
    setUrl("");
    setError(null);
    setScrapeResult(null);
    setExtractResult(null);
    setCrawlJob(null);
    setResultType(null);
    setSelectedCrawlPage(null);
    scrollToForm();
    urlInputRef.current?.focus();
  };

  /** Prefills the target URL and focuses the form without running anything. */
  const handleOpenInPipeline = (targetUrl: string) => {
    setUrl(targetUrl);
    setError(null);
    scrollToForm();
    urlInputRef.current?.focus();
  };

  /** Hands a finished scrape to the Extract phase: enables the schema builder
      and pre-fills the URL so extraction can be run immediately. */
  const startExtractFromResult = (targetUrl: string) => {
    setUrl(targetUrl);
    setStructuredExtract(true);
    setMode("scrape");
    setError(null);
    scrollToForm();
    urlInputRef.current?.focus();
  };

  const startCrawlFromResult = (targetUrl: string) => {
    setUrl(targetUrl);
    setStructuredExtract(false);
    setMode("crawl");
    setError(null);
    scrollToForm();
    urlInputRef.current?.focus();
  };

  const crawlCompleted = crawlJob ? mapCrawlStatus(crawlJob.status) === "completed" : false;

  return (
    <section id="pipeline" className={bare ? "scroll-mt-24" : "scroll-mt-24 py-16 md:py-24"}>
      <div className={bare ? "" : "mx-auto max-w-[1200px] px-6"}>
        {!bare && (
        <>
        {/* Section header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-bark-grey)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-electric-indigo)]" />
            Pipeline
          </span>
          <h2 className="mt-4 font-serif text-3xl font-normal tracking-[-0.03em] text-[var(--color-charcoal)] md:text-5xl">
            Run the live pipeline.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--color-bark-grey)]">
            Scrape any public URL into clean Markdown, extract structured JSON, or run a monitored
            multi-page crawl — no sign-in required.
          </p>
        </div>

{/* Future-action affordances */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
          {AFFORDANCES.map((aff) =>
            aff.available ? (
              <button
                key={aff.id}
                type="button"
                onClick={() => selectAffordance(aff)}
                title={aff.description}
                className="group flex items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-charcoal)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-electric-indigo)]"
              >
                <span className="text-[var(--color-electric-indigo)]">{aff.icon}</span>
                {aff.label}
              </button>
            ) : (
              <span
                key={aff.id}
                title={aff.description}
                className="flex cursor-not-allowed items-center gap-2 rounded-full border border-dashed border-[var(--color-stone-mist)] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-pebble)] opacity-70"
              >
                <span>{aff.icon}</span>
                {aff.label}
                <span className="rounded bg-[var(--color-warm-bone)] px-1.5 py-0.5 text-[9px] text-[var(--color-bark-grey)]">
                  Soon
                </span>
              </span>
            )
          )}
        </div>
        </>
        )}

        {/* Tool grid */}
        {mode === "leadgen" ? (
          <div className="w-full">
            <LeadGenTool bare initialUrl={url} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Form */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleSubmit}
              className="animate-slideDown space-y-5 rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6 shadow-[0_16px_40px_rgba(41,37,36,0.08)]"
            >
              {/* Target Input */}
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal)]">
                  {mode === "search" ? "Search Query" : "Target URL"}
                </label>
                <input
                  type={mode === "search" ? "text" : "url"}
                  value={url}
                  ref={urlInputRef}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder={
                    mode === "search"
                      ? "e.g. web scraping tools or python tutorial"
                      : mode === "map"
                      ? "https://example.com"
                      : mode === "crawl"
                      ? "https://example.com/blog"
                      : "https://example.com/item"
                  }
                  className="w-full rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-4 py-3 text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-pebble)] focus:border-[var(--color-electric-indigo)] focus:outline-none focus:ring-4 focus:ring-[rgba(142,111,75,0.15)]"
                />
              </div>

              {/* Mode toggle */}
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal)]">
                  Job Mode
                </label>
                <div className="grid grid-cols-5 gap-1 rounded-xl bg-[var(--color-warm-bone)] p-1">
                  {(["search", "scrape", "map", "crawl", "leadgen"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={structuredExtract}
                      onClick={() => setMode(m)}
                      className={`rounded-lg py-2 text-[10px] font-semibold uppercase tracking-[0.04em] transition ${
                        mode === m && !structuredExtract
                          ? "bg-[var(--color-electric-indigo)] text-white shadow-sm"
                          : "text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)] disabled:opacity-30"
                      }`}
                    >
                      {m === "leadgen" ? "leads" : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max pages */}
              {mode === "crawl" && !structuredExtract && (
                <div className="animate-slideDown rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] p-4">
                  <div className="mb-2 flex items-center justify-between font-mono text-xs font-medium">
                    <span className="text-[var(--color-charcoal)]">MAX CRAWL PAGES</span>
                    <span className="font-semibold text-[var(--color-electric-indigo)]">
                      {maxPages} page{maxPages === 1 ? "" : "s"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={maxPages}
                    onChange={(e) => setMaxPages(parseInt(e.target.value, 10))}
                    className="h-1 w-full cursor-pointer accent-[var(--color-electric-indigo)]"
                  />
                </div>
              )}

{/* AI extraction toggle */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] p-3">
                <div>
                  <div className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-charcoal)]">
                    Structured AI extraction
                  </div>
                  <div className="mt-1 text-[10px] text-[var(--color-bark-grey)]">
                    Extract fields into clean JSON
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={structuredExtract}
                  onClick={() => setStructuredExtract((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    structuredExtract ? "bg-[var(--color-electric-indigo)]" : "bg-[var(--color-stone-mist)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      structuredExtract ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Extraction options */}
              {structuredExtract && (
                <div className="animate-slideDown space-y-4 rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] p-4">
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal)]">
                      Schema Template
                    </label>
                    <select
                      value={schemaTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value as SchemaTemplateKey)}
                      className="w-full rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3 py-2 text-sm text-[var(--color-charcoal)] focus:border-[var(--color-electric-indigo)] focus:outline-none"
                    >
                      <option value="product">Product</option>
                      <option value="article">Article</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal)]">
                      JSON Schema
                    </label>
                    <textarea
                      value={schemaJson}
                      onChange={(e) => setSchemaJson(e.target.value)}
                      rows={6}
                      spellCheck={false}
                      className="w-full resize-y rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3 py-2 font-mono text-[11px] leading-relaxed text-[var(--color-charcoal)] focus:border-[var(--color-electric-indigo)] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal)]">
                      Provider
                    </label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as "openai" | "anthropic")}
                      className="w-full rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3 py-2 text-sm text-[var(--color-charcoal)] focus:border-[var(--color-electric-indigo)] focus:outline-none"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-charcoal)]">
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-…"
                        autoComplete="off"
                        className="w-full rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-3 py-2 text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-pebble)] focus:border-[var(--color-electric-indigo)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey((v) => !v)}
                        className="shrink-0 rounded-lg border border-[var(--color-stone-mist)] px-3 py-2 text-xs font-semibold text-[var(--color-bark-grey)] transition hover:border-[var(--color-electric-indigo)] hover:text-[var(--color-charcoal)]"
                      >
                        {showKey ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

{/* Advanced config */}
              <button
                type="button"
                onClick={() => setShowConfig((v) => !v)}
                className="w-full text-left font-mono text-[10px] uppercase tracking-wider text-[var(--color-bark-grey)] transition hover:text-[var(--color-charcoal)]"
              >
                {showConfig ? "− Advanced settings" : "+ Advanced settings"}
              </button>
              {showConfig && <ConfigPanel apiUrl={apiUrl} setApiUrl={setApiUrl} />}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !url}
                className="flex w-full items-center justify-center rounded-lg bg-[var(--color-electric-indigo)] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-deep-violet)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Processing…"
                  : structuredExtract
                  ? "Extract JSON"
                  : mode === "search"
                  ? "Search Web"
                  : mode === "map"
                  ? "Map Site Topology"
                  : mode === "crawl"
                  ? "Run Crawl"
                  : "Scrape Markdown"}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="lg:col-span-7">
            <div className="flex min-h-[460px] flex-col">
              {!loading && !error && resultType === null && <ResultEmpty />}

              {loading && <ResultLoading status={loadingStatus} progress={crawlJob?.progress} />}

              {error && !loading && (
                <ResultError title={ERROR_TITLES[lastOp]} message={error} onRetry={() => retryRef.current?.()} />
              )}

              {resultType === "search" && searchResults && !loading && !error && (
                <SearchResult
                  query={searchResults.query}
                  results={searchResults.results}
                  onScrapeUrl={(u) => void runScrape(u)}
                  onCrawlUrl={(u) => void runCrawl(u)}
                  onCopy={handleCopy}
                  copied={copied}
                />
              )}

              {resultType === "map" && mapResults && !loading && !error && (
                <MapResult
                  targetUrl={mapResults.targetUrl}
                  domain={mapResults.domain}
                  total={mapResults.total}
                  links={mapResults.links}
                  onScrapeUrl={(u) => void runScrape(u)}
                  onCrawlUrl={(u) => void runCrawl(u)}
                  onCopy={handleCopy}
                  copied={copied}
                />
              )}

              {resultType === "scrape" && scrapeResult && !loading && !error && (
                <ResultWorkspace
                  url={scrapeResult.url}
                  title={scrapeResult.title}
                  excerpt={scrapeResult.excerpt}
                  markdown={scrapeResult.markdown}
                  onScrape={() => void runScrape(scrapeResult.url)}
                  onExtract={() => startExtractFromResult(scrapeResult.url)}
                  onCrawl={() => startCrawlFromResult(scrapeResult.url)}
                  onOpenInPipeline={() => handleOpenInPipeline(scrapeResult.url)}
                  onNewScrape={handleNewScrape}
                />
              )}

              {resultType === "extract" && extractResult && !loading && !error && (
                <ExtractResult data={extractResult} onCopy={handleCopy} copied={copied} />
              )}

              {resultType === "crawl" && crawlJob && crawlCompleted && !loading && !error && (
                <CrawlResult
                  job={crawlJob}
                  selectedPage={selectedCrawlPage}
                  onSelectPage={setSelectedCrawlPage}
                  onCopy={handleCopy}
                  copied={copied}
                />
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}

