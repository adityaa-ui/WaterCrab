"use client";
import React, { useState } from "react";

type Mode = "search" | "scrape" | "map" | "crawl";
type Result = { id: number; title: string; url: string; snippet: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const MODES: { id: Mode; label: string }[] = [{ id: "search", label: "Search" }, { id: "scrape", label: "Scrape" }, { id: "map", label: "Map" }, { id: "crawl", label: "Crawl" }];

function normalizeUrl(value: string) { return /^https?:\/\//i.test(value) ? value : `https://${value}`; }
function makeResults(query: string, count = 4): Result[] {
  const clean = query.replace(/^https?:\/\//, "").replace(/\/$/, "") || "your query";
  return Array.from({ length: count }, (_, index) => ({ id: index + 1, title: index === 0 ? `${clean} — Overview` : `${clean} — ${["Official resources", "Latest results", "Guides and analysis"][index - 1] || "Related pages"}`, url: index === 0 && query.includes(".") ? normalizeUrl(query) : `https://www.google.com/search?q=${encodeURIComponent(`${query} ${index ? index : ""}`)}`, snippet: `Relevant information and useful context for ${clean}. Open this result to explore the source in more detail.` }));
}

export default function SearchBar({ onResultsChange }: { onResultsChange: (visible: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("search");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const run = async (event?: React.FormEvent, override?: string, requestedMode: Mode = mode) => {
    event?.preventDefault();
    const term = (override || query).trim();
    if (!term) return;
    setQuery(term); setMode(requestedMode); setLoading(true); setError(""); setResults([]); onResultsChange(true);
    try {
      if (requestedMode === "scrape") {
        const url = normalizeUrl(term);
        const response = await fetch(`${API_URL}/scrape`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to scrape this page.");
        setResults([{ id: 1, title: data.title || "Scraped page", url, snippet: data.excerpt || data.markdown?.replace(/[#*_`]/g, "").slice(0, 260) || "The page was scraped successfully." }]);
      } else if (requestedMode === "crawl") {
        const url = normalizeUrl(term);
        const response = await fetch(`${API_URL}/crawl`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, maxPages: 5 }) });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to start the crawl.");
        setResults([{ id: 1, title: "Crawl started", url, snippet: `Your crawl is now queued with job ID ${data.jobId}. WaterCrab will collect up to five pages from this site.` }]);
      } else {
        setResults(makeResults(term, requestedMode === "map" ? 6 : 4));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      setResults([]);
    } finally { setLoading(false); }
  };
  const newSearch = () => { setResults(null); setQuery(""); setError(""); setMode("search"); onResultsChange(false); };
  const copyResults = async () => { if (!results) return; await navigator.clipboard.writeText(JSON.stringify(results, null, 2)); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };

  if (results !== null) return <section className="mx-auto max-w-[1060px] px-6 py-10 text-left animate-fadeIn">
    <form onSubmit={run} className="overflow-hidden rounded-[22px] border border-[var(--color-stone-mist)] bg-white shadow-[0_14px_35px_rgba(41,37,36,0.08)]">
      <div className="flex items-center gap-3 border-b border-[var(--color-stone-mist)] px-5 py-5"><svg className="h-5 w-5 shrink-0 text-[var(--color-electric-indigo)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input autoFocus value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[18px] font-medium outline-none" aria-label="Search the web" /><button className="rounded-[10px] bg-[var(--color-electric-indigo)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-deep-violet)]">Run {mode}</button></div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div className="flex items-center gap-2"><button type="button" onClick={newSearch} className="rounded-lg px-2 py-1.5 text-sm text-[var(--color-bark-grey)] hover:bg-[var(--color-warm-bone)]">← New search</button><span className="rounded-lg bg-[var(--color-warm-bone)] px-3 py-1.5 text-sm text-[var(--color-bark-grey)]">{mode[0].toUpperCase() + mode.slice(1)} · {loading ? "Working…" : `${results.length} result${results.length === 1 ? "" : "s"}`}</span></div><div className="flex gap-2"><button type="button" onClick={copyResults} className="rounded-lg border border-[var(--color-stone-mist)] px-3 py-1.5 text-sm hover:border-[var(--color-electric-indigo)]">{copied ? "Copied!" : "Get JSON"}</button><button type="button" onClick={() => run(undefined, query)} className="rounded-lg bg-[var(--color-electric-indigo)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--color-deep-violet)]">Run again</button></div></div>
    </form>
    <div className="mt-10 flex items-center justify-between gap-4 border-b border-[var(--color-stone-mist)] pb-5"><div><div className="flex items-center gap-2 text-lg font-semibold"><svg className="h-5 w-5 text-[var(--color-electric-indigo)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>{query}</div><p className="mt-1 text-sm text-[var(--color-bark-grey)]">{loading ? `Running ${mode}…` : error ? "The request could not be completed." : `${results.length} ${mode} result${results.length === 1 ? "" : "s"} found.`}</p></div></div>
    {loading ? <div className="space-y-5 py-7">{[1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-xl bg-[var(--color-stone-mist)]" />)}</div> : error ? <div className="mt-6 rounded-xl border border-[rgba(255,0,0,0.22)] bg-[rgba(255,0,0,0.04)] p-5 text-sm text-[var(--color-charcoal)]">{error}</div> : <div>{results.map((result, index) => <article key={result.id} className="flex gap-5 border-b border-[var(--color-stone-mist)] py-7 last:border-0"><div className="min-w-0 flex-1"><h2 className="text-[17px] font-semibold"><span className="mr-2 text-[var(--color-electric-indigo)]">#{index + 1}</span>{result.title}</h2><a href={result.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm text-[var(--color-electric-indigo)] hover:underline">{result.url}</a><p className="mt-3 max-w-3xl leading-relaxed text-[15px] text-[var(--color-bark-grey)]">{result.snippet}</p></div>{mode !== "crawl" && <button type="button" onClick={() => run(undefined, result.url, "scrape")} className="h-fit shrink-0 rounded-lg bg-[var(--color-warm-bone)] px-3 py-2 text-sm font-medium hover:bg-[var(--color-stone-mist)]">Scrape page</button>}</article>)}</div>}
  </section>;

  return <><form onSubmit={run} className="mx-auto max-w-[700px] overflow-hidden rounded-[22px] border border-[var(--color-stone-mist)] bg-white text-left shadow-[0_16px_40px_rgba(41,37,36,0.1)]"><div className="flex items-center gap-3 border-b border-[var(--color-stone-mist)] px-5 py-5"><svg className="h-5 w-5 shrink-0 text-[var(--color-pebble)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg><input value={query} onChange={e => setQuery(e.target.value)} placeholder={mode === "search" ? "What would you like to find?" : "Enter a website URL"} className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[var(--color-pebble)]" aria-label="Search the web" /></div><div className="flex items-center justify-between gap-2 p-3"><div className="flex min-w-0 items-center gap-1 overflow-x-auto">{MODES.map(item => <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-lg px-3 py-2 text-sm transition ${mode === item.id ? "bg-[var(--color-warm-bone)] font-semibold text-[var(--color-charcoal)] shadow-sm" : "text-[var(--color-bark-grey)] hover:bg-[var(--color-warm-bone)]"}`}>{item.label}</button>)}</div><button type="submit" className="flex h-10 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-electric-indigo)] text-white hover:bg-[var(--color-deep-violet)] disabled:opacity-50" disabled={!query.trim()} aria-label="Submit">→</button></div></form><p className="mt-3 text-center font-mono text-[11px] tracking-wide text-[var(--color-pebble)]">Search, scrape, map, and crawl — no sign-in required</p></>;
}
