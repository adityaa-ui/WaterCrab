"use client";
import React, { useState, useEffect } from 'react';
import ConfigPanel from './ConfigPanel';
import EmptyState from './EmptyState';
import LoadingPanel from './LoadingPanel';
import ScrapeResult from './ScrapeResult';
import ExtractResult from './ExtractResult';
import CrawlResult from './CrawlResult';

const SCHEMA_TEMPLATES = {
  product: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The name of the product' },
      price: { type: 'string', description: 'The price of the product' },
      description: { type: 'string', description: 'Product description' },
      rating: { type: 'string', description: 'Rating or review score' }
    },
    required: ['name', 'price']
  },
  article: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Title of the article' },
      author: { type: 'string', description: 'Author name' },
      publishDate: { type: 'string', description: 'Date of publication' },
      summary: { type: 'string', description: '1-2 sentence summary of article' }
    },
    required: ['title']
  },
  custom: {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Description of what to extract' }
    },
    required: ['key']
  }
};

interface PipelineToolProps {
  apiUrl: string;
  showConfig: boolean;
  setShowConfig: (show: boolean) => void;
  setApiUrl: (url: string) => void;
}

export default function PipelineTool({ apiUrl, showConfig, setApiUrl, setShowConfig }: PipelineToolProps) {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'scrape' | 'crawl'>('scrape');
  const [maxPages, setMaxPages] = useState(3);
  const [structuredExtract, setStructuredExtract] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [schemaTemplate, setSchemaTemplate] = useState<'product' | 'article' | 'custom'>('product');
  const [schemaJson, setSchemaJson] = useState(JSON.stringify(SCHEMA_TEMPLATES.product, null, 2));
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'scrape' | 'extract' | 'crawl' | null>(null);
  
  const [scrapeResult, setScrapeResult] = useState<{ title: string; excerpt?: string; markdown: string } | null>(null);
  const [extractResult, setExtractResult] = useState<Record<string, any> | null>(null);
  const [crawlResult, setCrawlResult] = useState<{
    id: string;
    status: string;
    progress: { current: number; total: number };
    results: Array<{ url: string; title: string; markdown: string }>;
    error?: string;
  } | null>(null);
  
  const [activeScrapeTab, setActiveScrapeTab] = useState<'preview' | 'markdown'>('preview');
  const [selectedCrawlPage, setSelectedCrawlPage] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSchemaJson(JSON.stringify(SCHEMA_TEMPLATES[schemaTemplate], null, 2));
  }, [schemaTemplate]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScrape = async () => {
    setLoading(true);
    setLoadingStatus('Initializing browser connection...');
    setError(null);
    setScrapeResult(null);
    setResultType(null);

    try {
      setLoadingStatus('Rendering page content using headless browser...');
      const res = await fetch(`${apiUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Scrape failed with status ${res.status}`);
      }

      setScrapeResult(data);
      setResultType('scrape');
    } catch (err: any) {
      setError(err.message || 'An unexpected scraping error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    setLoading(true);
    setLoadingStatus('Validating extraction criteria...');
    setError(null);
    setExtractResult(null);
    setResultType(null);

    let parsedSchema;
    try {
      parsedSchema = JSON.parse(schemaJson);
    } catch {
      setError('Invalid JSON Schema format. Please fix syntax errors before extracting.');
      setLoading(false);
      return;
    }

    try {
      setLoadingStatus('Instructing browser service to fetch HTML...');
      const res = await fetch(`${apiUrl}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          schema: parsedSchema,
          provider,
          apiKey
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Extraction failed with status ${res.status}`);
      }

      setExtractResult(data.data);
      setResultType('extract');
    } catch (err: any) {
      setError(err.message || 'An unexpected structured extraction error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCrawl = async () => {
    setLoading(true);
    setLoadingStatus('Registering crawler task...');
    setError(null);
    setCrawlResult(null);
    setResultType(null);
    setSelectedCrawlPage(null);

    try {
      const startRes = await fetch(`${apiUrl}/crawl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, maxPages })
      });

      const startData = await startRes.json();
      if (!startRes.ok || !startData.success) {
        throw new Error(startData.error || 'Failed to queue crawl job.');
      }

      const jobId = startData.jobId;
      setLoadingStatus(`Crawl enqueued. Job ID: ${jobId}`);

      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`${apiUrl}/jobs/${jobId}`);
          const pollData = await pollRes.json();

          if (!pollRes.ok || !pollData.success) {
            throw new Error(pollData.error || 'Failed to poll status.');
          }

          const job = pollData.job;
          setCrawlResult(job);
          setResultType('crawl');

          if (job.status === 'active') {
            setLoadingStatus(`Crawling pages: ${job.progress.current} of ${job.progress.total} parsed.`);
          } else if (job.status === 'completed') {
            clearInterval(pollInterval);
            setLoading(false);
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setError(job.error || 'The crawl background job failed.');
            setLoading(false);
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          setError(`Polling error: ${pollErr.message}`);
          setLoading(false);
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An unexpected crawling error occurred.');
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (structuredExtract) {
      handleExtract();
    } else if (mode === 'scrape') {
      handleScrape();
    } else {
      handleCrawl();
    }
  };

  return (
    <section id="pipeline" className="pb-16 pt-8 scroll-mt-20">
      <div className="mb-10 text-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.10em] text-[var(--color-bark-grey)]">
          Launch live crawl sessions
        </span>
        <h2 className="display-serif mt-3 text-3xl font-bold text-[var(--color-charcoal)] md:text-4xl">
          Scrape sandbox pipeline.
        </h2>
      </div>

      <div className="panel-surface soft-shadow overflow-hidden bg-[var(--color-paper-white)] p-5 md:p-6">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Form Side */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {showConfig && (
              <div className="border border-[var(--color-stone-mist)] rounded-xl p-1 bg-[var(--color-warm-bone)]">
                <ConfigPanel apiUrl={apiUrl} setApiUrl={setApiUrl} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-5">
              {/* Target URL */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--color-charcoal)] uppercase tracking-wider font-mono">
                  Target URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://example.com/item"
                  className="w-full rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-3 text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-pebble)] focus:border-[var(--color-electric-indigo)] focus:outline-none focus:ring-4 focus:ring-[rgba(97,95,255,0.15)] transition duration-200"
                />
              </div>

              {/* Job Mode */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--color-charcoal)] uppercase tracking-wider font-mono">
                  Job Mode
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--color-warm-bone)] p-1">
                  <button
                    type="button"
                    disabled={structuredExtract}
                    onClick={() => setMode('scrape')}
                    className={`rounded-lg py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                      mode === 'scrape' && !structuredExtract
                        ? 'bg-[var(--color-electric-indigo)] text-white shadow-sm'
                        : 'text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)] disabled:opacity-30'
                    }`}
                  >
                    Single Scrape
                  </button>
                  <button
                    type="button"
                    disabled={structuredExtract}
                    onClick={() => setMode('crawl')}
                    className={`rounded-lg py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                      mode === 'crawl' && !structuredExtract
                        ? 'bg-[var(--color-electric-indigo)] text-white shadow-sm'
                        : 'text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)] disabled:opacity-30'
                    }`}
                  >
                    Multi Crawl
                  </button>
                </div>
              </div>

              {/* Max Pages Range for Multi Crawl */}
              {mode === 'crawl' && !structuredExtract && (
                <div className="animate-slideDown rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] p-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium">
                    <span className="text-[var(--color-charcoal)] font-mono">MAX CRAWL PAGES</span>
                    <span className="font-semibold text-[var(--color-electric-indigo)]">{maxPages} pages</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={maxPages}
                    onChange={(e) => setMaxPages(parseInt(e.target.value))}
                    className="h-1 w-full cursor-pointer accent-[var(--color-electric-indigo)]"
                  />
                </div>
              )}

              {/* AI Extraction Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] p-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-charcoal)] font-mono">Structured AI Extraction</div>
                  <div className="mt-1 text-[10px] text-[var(--color-bark-grey)]">Extract fields into clean JSON</div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={structuredExtract}
                    onChange={(e) => setStructuredExtract(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-[var(--color-stone-mist)] transition peer-checked:bg-[var(--color-electric-indigo)]">
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>

              {/* AI Extraction Settings */}
              {structuredExtract && (
                <div className="animate-slideDown space-y-4 rounded-xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] p-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-bark-grey)] font-mono">LLM Provider</label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as any)}
                      className="w-full rounded-lg border border-[var(--color-stone-mist)] bg-white px-3 py-2 text-xs text-[var(--color-charcoal)] focus:border-[var(--color-electric-indigo)] focus:outline-none"
                    >
                      <option value="openai">OpenAI (gpt-4o-mini)</option>
                      <option value="anthropic">Anthropic (claude-3-5-haiku)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-bark-grey)] font-mono">Your API KEY</label>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        required
                        placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                        className="w-full rounded-lg border border-[var(--color-stone-mist)] bg-white px-3 pr-10 py-2 text-xs text-[var(--color-charcoal)] focus:border-[var(--color-electric-indigo)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)] text-[10px] font-mono"
                      >
                        {showKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-bark-grey)] font-mono">Schema Template</label>
                    <div className="flex gap-2">
                      {Object.keys(SCHEMA_TEMPLATES).map((tmpl) => (
                        <button
                          key={tmpl}
                          type="button"
                          onClick={() => setSchemaTemplate(tmpl as any)}
                          className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] transition ${
                            schemaTemplate === tmpl
                              ? 'border-[var(--color-electric-indigo)] bg-[rgba(97,95,255,0.08)] text-[var(--color-electric-indigo)]'
                              : 'border-[var(--color-stone-mist)] bg-white text-[var(--color-bark-grey)] hover:border-[var(--color-pebble)]'
                          }`}
                        >
                          {tmpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-bark-grey)] font-mono">Target JSON Schema</label>
                    <textarea
                      rows={6}
                      value={schemaJson}
                      onChange={(e) => setSchemaJson(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-stone-mist)] bg-white p-2 text-[10px] font-mono text-[var(--color-charcoal)] focus:border-[var(--color-electric-indigo)] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Submit Action */}
              <button
                type="submit"
                disabled={loading || !url}
                className="flex w-full items-center justify-center rounded-lg bg-[var(--color-electric-indigo)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[var(--color-deep-violet)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Processing...' : structuredExtract ? 'Extract JSON' : mode === 'scrape' ? 'Scrape Markdown' : 'Crawl Website'}
              </button>
            </form>
          </div>

          {/* Results Side */}
          <div className="lg:col-span-7">
            <div className="h-full min-h-[460px] rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] p-4 flex flex-col">
              {(!loading && !error && !resultType) && <EmptyState />}
              {loading && <LoadingPanel status={loadingStatus} progress={crawlResult?.progress} />}

              {error && !loading && (
                <div className="flex h-full flex-col items-center justify-center rounded-[16px] border border-red-200 bg-red-50 p-8 text-center my-auto">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider font-mono">Execution failed</h3>
                  <p className="mt-2 max-w-md text-left text-xs text-red-600 font-mono bg-red-100/50 p-3 rounded-lg border border-red-200 overflow-x-auto">{error}</p>
                </div>
              )}

              {resultType === 'scrape' && scrapeResult && !loading && (
                <div className="flex-1 flex flex-col">
                  <ScrapeResult
                    title={scrapeResult.title}
                    excerpt={scrapeResult.excerpt}
                    markdown={scrapeResult.markdown}
                    activeTab={activeScrapeTab}
                    setActiveTab={setActiveScrapeTab}
                    onCopy={handleCopy}
                    copied={copied}
                  />
                </div>
              )}

              {resultType === 'extract' && extractResult && !loading && (
                <div className="flex-1 flex flex-col">
                  <ExtractResult data={extractResult} onCopy={handleCopy} copied={copied} />
                </div>
              )}

              {resultType === 'crawl' && crawlResult && !loading && (
                <div className="flex-1 flex flex-col">
                  <CrawlResult
                    crawlResult={crawlResult}
                    selectedPage={selectedCrawlPage}
                    setSelectedPage={setSelectedCrawlPage}
                    onCopy={handleCopy}
                    copied={copied}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
