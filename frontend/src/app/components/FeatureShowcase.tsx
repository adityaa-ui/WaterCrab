"use client";
import React, { useState } from 'react';

// --- DATA DEFINITIONS ---

// Section 1: Structured Scraping
interface AccordionItem {
  id: string;
  title: string;
  description: string;
  code?: {
    [tab: string]: string;
  };
}

const SECTION_1_ITEMS: AccordionItem[] = [
  {
    id: 'api',
    title: 'SCRAPING API',
    description: 'A single GET request returns clean, structured Markdown. Perfect for feeding raw content to LLMs, search indexers, or local vector stores without HTML bloat.',
    code: {
      cURL: `curl -X POST https://api.watercrab.com/v1/scrape \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d url="https://example.com"`,
      'Node.js': `import { WaterCrab } from 'watercrab';
const crab = new WaterCrab({ apiKey: 'YOUR_API_KEY' });

const result = await crab.scrape({
  url: 'https://example.com'
});
console.log(result.markdown);`,
      Python: `from watercrab import WaterCrab
crab = WaterCrab(api_key="YOUR_API_KEY")

result = crab.scrape(url="https://example.com")
print(result["markdown"])`,
      Go: `package main
import (
	"context"
	"fmt"
	"github.com/watercrab/sdk-go"
)

func main() {
	client := watercrab.NewClient("YOUR_API_KEY")
	res, _ := client.Scrape(context.Background(), "https://example.com")
	fmt.Println(res.Markdown)
}`
    }
  },
  {
    id: 'sdks',
    title: 'OFFICIAL SDKs',
    description: 'Fully typed native libraries in TypeScript, Python, and Go. Handles connection retries, error propagation, and API key management out of the box.',
    code: {
      cURL: `# CLI package installation
npm install @watercrab/sdk
pip install watercrab-sdk`,
      'Node.js': `// Typed request schema
import { WaterCrabClient } from '@watercrab/sdk';
const client = new WaterCrabClient();`,
      Python: `from watercrab import Client
client = Client()`,
      Go: `import "github.com/watercrab/watercrab-go"`
    }
  },
  {
    id: 'webhooks',
    title: 'REALTIME WEBHOOKS',
    description: 'Configure endpoints to receive payload delivery immediately when large crawl jobs finish. Includes cryptographic signature headers to verify authentic requests.',
    code: {
      cURL: `# Wait for POST payloads on webhook trigger
https://api.yourdomain.com/webhooks/watercrab`,
      'Node.js': `// Verify signature header
const signature = req.headers['x-watercrab-signature'];
const isValid = client.webhooks.verify(req.body, signature);`,
      Python: `# Verify payload hash signature
is_valid = client.verify_webhook(payload, signature)`,
      Go: `isValid := watercrab.VerifyWebhook(payload, signature)`
    }
  },
  {
    id: 'mcp',
    title: 'MCP-READY CLIENTS',
    description: 'Implements Model Context Protocol. You can connect WaterCrab as a direct tool for Claude Desktop, Cursor, or any agent stack instantly.',
    code: {
      cURL: `# Run MCP server locally via npx
npx -y @watercrab/mcp-server --api-key YOUR_KEY`,
      'Node.js': `// Configure MCP tools
import { McpServer } from '@modelcontextprotocol/sdk';
const server = new McpServer({ name: 'WaterCrab' });`,
      Python: `# MCP Handler binding
from mcp.server import Server
server = Server("watercrab")`,
      Go: `// Start local stdio MCP channel
mcp.StartStdioServer(watercrabTools)`
    }
  }
];

// Section 2: Crawl Pipelines
interface CrawlPage {
  url: string;
  status: string;
  size: string;
}

type CrawlWidgetState =
  | { activeTab: 'crawler'; pages: CrawlPage[] }
  | { activeTab: 'robots'; directives: Array<Record<string, string>> }
  | { activeTab: 'filters'; exclusions: string[] }
  | { activeTab: 'logs'; logLines: string[] };

interface CrawlItem {
  id: string;
  title: string;
  description: string;
  widgetState: CrawlWidgetState;
}

const SECTION_2_ITEMS: CrawlItem[] = [
  {
    id: 'multi',
    title: 'MULTI-PAGE CRAWL',
    description: 'Discover and queue URLs dynamically based on prefix matching or page depth rules. Handles queue pagination without blocking backend threads.',
    widgetState: {
      activeTab: 'crawler',
      pages: [
        { url: '/pricing', status: 'completed', size: '14.2kb' },
        { url: '/blog/launch-day', status: 'completed', size: '32.1kb' },
        { url: '/docs/intro', status: 'active', size: 'Pending' },
        { url: '/contact', status: 'queued', size: '0kb' }
      ]
    }
  },
  {
    id: 'robots',
    title: 'ROBOTS COMPLIANCE',
    description: 'Respects robots.txt directives and crawls with customizable rate-limiting headers. Keeps your scraping operations ethical and prevents server overloading.',
    widgetState: {
      activeTab: 'robots',
      directives: [
        { agent: '*', allow: '/docs', disallow: '/admin' },
        { crawlDelay: '1.5 seconds' },
        { userAgentUsed: 'WaterCrabBot/1.0' }
      ]
    }
  },
  {
    id: 'filters',
    title: 'DYNAMIC FILTERS',
    description: 'Exclude common tracking parameters, external domains, static image file paths, or CSS files to save bandwidth and focus strictly on semantic text.',
    widgetState: {
      activeTab: 'filters',
      exclusions: [
        '*.png', '*.jpg', '*utm_source*', '*fbclid*', '**/assets/**'
      ]
    }
  },
  {
    id: 'logs',
    title: 'PIPELINE LOGS',
    description: 'Monitor request status, latency, response sizes, and proxy rotations in a live streaming log tail. Pinpoint scraper blocks instantly.',
    widgetState: {
      activeTab: 'logs',
      logLines: [
        "[10:24:01] GET /pricing - Status 200 - 1.2s",
        "[10:24:02] Proxy rotated -> US-West-4",
        "[10:24:05] GET /docs/intro - Parsing schema...",
        "[10:24:08] Webhook sent -> OK 200"
      ]
    }
  }
];

// Section 3: AI Extraction
interface ExtractionItem {
  id: string;
  title: string;
  description: string;
  nodes: Array<{ id: string; name: string; status: 'completed' | 'active' | 'pending'; type: string }>;
}

const SECTION_3_ITEMS: ExtractionItem[] = [
  {
    id: 'schema',
    title: 'AI SCHEMA MATCHING',
    description: 'Provide an arbitrary JSON Schema and let the LLM extract matching structured nodes from the raw HTML content, ensuring complete datatype safety.',
    nodes: [
      { id: '1', name: 'Raw HTML Stream', status: 'completed', type: 'source' },
      { id: '2', name: 'LLM Parser (Schema)', status: 'active', type: 'processor' },
      { id: '3', name: 'Output Validation', status: 'pending', type: 'validator' },
      { id: '4', name: 'JSON Delivery', status: 'pending', type: 'destination' }
    ]
  },
  {
    id: 'filters',
    title: 'SMART AI FILTERS',
    description: 'Extract only what you describe in plain text instructions (e.g. "Ignore comments and footers, extract only customer reviews"). Reduces LLM token overhead.',
    nodes: [
      { id: '1', name: 'Select Text Only', status: 'completed', type: 'source' },
      { id: '2', name: 'Instruction Filter', status: 'active', type: 'processor' },
      { id: '3', name: 'Structure Generator', status: 'pending', type: 'validator' },
      { id: '4', name: 'Filtered Output', status: 'pending', type: 'destination' }
    ]
  },
  {
    id: 'drift',
    title: 'ANALYTICS & DRIFT',
    description: 'Monitor structural drift over time. Get alerted if a layout change on the target website breaks your JSON schema fields.',
    nodes: [
      { id: '1', name: 'Schema Snapshot', status: 'completed', type: 'source' },
      { id: '2', name: 'Drift Evaluator', status: 'active', type: 'processor' },
      { id: '3', name: 'Similarity Score', status: 'completed', type: 'validator' },
      { id: '4', name: 'Alert Dispatcher', status: 'pending', type: 'destination' }
    ]
  }
];

export default function FeatureShowcase() {
  // Section 1 State
  const [sec1Active, setSec1Active] = useState('api');
  const [sec1Lang, setSec1Lang] = useState('cURL');

  // Section 2 State
  const [sec2Active, setSec2Active] = useState('multi');

  // Section 3 State
  const [sec3Active, setSec3Active] = useState('schema');

  // Helpers to retrieve current states
  const sec1Data = SECTION_1_ITEMS.find(item => item.id === sec1Active) || SECTION_1_ITEMS[0];
  const sec2Data = SECTION_2_ITEMS.find(item => item.id === sec2Active) || SECTION_2_ITEMS[0];
  const sec3Data = SECTION_3_ITEMS.find(item => item.id === sec3Active) || SECTION_3_ITEMS[0];

  return (
    <div className="space-y-24 py-16 md:py-24">
      {/* ---------------- SECTION #01 ---------------- */}
      <section className="mx-auto max-w-[1200px] grid gap-12 lg:grid-cols-12 items-center">
        {/* Left Column: Accordion */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-semibold tracking-[0.10em] text-[var(--color-bark-grey)] uppercase">
            <span>[ SECTION #01 ]</span>
            <span className="text-[var(--color-pebble)]">{'// STRUCTURED SCRAPING'}</span>
          </div>

          <h2 className="display-serif text-3xl font-bold leading-tight text-[var(--color-charcoal)] md:text-4xl">
            From raw DOM to <span className="font-serif italic font-normal text-[var(--color-electric-indigo)]">clean code.</span>
          </h2>

          <div className="space-y-3">
            {SECTION_1_ITEMS.map((item) => {
              const isActive = sec1Active === item.id;
              return (
                <div 
                  key={item.id} 
                  onClick={() => setSec1Active(item.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
                    isActive 
                      ? 'border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] shadow-sm' 
                      : 'border-transparent hover:bg-[rgba(41,37,36,0.02)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-semibold tracking-[0.06em] font-mono ${isActive ? 'text-[var(--color-charcoal)]' : 'text-[var(--color-bark-grey)]'}`}>
                      {item.title}
                    </h3>
                    <span className={`text-xs transition-transform duration-200 ${isActive ? 'rotate-90 text-[var(--color-electric-indigo)]' : 'text-[var(--color-pebble)]'}`}>
                      →
                    </span>
                  </div>
                  {isActive && (
                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-bark-grey)] animate-fadeIn">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Terminal */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-[var(--color-stone-mist)] bg-[#121214] shadow-xl">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#1a1a1e] px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex items-center gap-2">
                {['cURL', 'Node.js', 'Python', 'Go'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSec1Lang(lang)}
                    className={`rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] transition ${
                      sec1Lang === lang 
                        ? 'bg-[rgba(255,255,255,0.08)] text-white' 
                        : 'text-[var(--color-pebble)] hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Terminal Code Area */}
            <div className="p-5 font-mono text-[11px] md:text-[12px] leading-relaxed text-zinc-300 overflow-x-auto min-h-[190px]">
              <pre>{sec1Data.code ? sec1Data.code[sec1Lang] : ''}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SECTION #02 ---------------- */}
      <section className="mx-auto max-w-[1200px] grid gap-12 lg:grid-cols-12 items-center">
        {/* Left Column: Accordion */}
        <div className="lg:col-span-5 space-y-6 lg:order-last">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-semibold tracking-[0.10em] text-[var(--color-bark-grey)] uppercase">
            <span>[ SECTION #02 ]</span>
            <span className="text-[var(--color-pebble)]">{'// CRAWL PIPELINES'}</span>
          </div>

          <h2 className="display-serif text-3xl font-bold leading-tight text-[var(--color-charcoal)] md:text-4xl">
            Orchestrate crawls at <span className="font-serif italic font-normal text-[var(--color-electric-indigo)]">any scale.</span>
          </h2>

          <div className="space-y-3">
            {SECTION_2_ITEMS.map((item) => {
              const isActive = sec2Active === item.id;
              return (
                <div 
                  key={item.id} 
                  onClick={() => setSec2Active(item.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
                    isActive 
                      ? 'border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] shadow-sm' 
                      : 'border-transparent hover:bg-[rgba(41,37,36,0.02)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-semibold tracking-[0.06em] font-mono ${isActive ? 'text-[var(--color-charcoal)]' : 'text-[var(--color-bark-grey)]'}`}>
                      {item.title}
                    </h3>
                    <span className={`text-xs transition-transform duration-200 ${isActive ? 'rotate-90 text-[var(--color-electric-indigo)]' : 'text-[var(--color-pebble)]'}`}>
                      →
                    </span>
                  </div>
                  {isActive && (
                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-bark-grey)] animate-fadeIn">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visual Crawl Widget */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-6 shadow-xl min-h-[300px] flex flex-col justify-between">
            {/* Widget Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-stone-mist)] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-electric-indigo)] animate-ping" />
                <span className="text-xs font-mono font-semibold text-[var(--color-charcoal)]">CRAWLER_DAEMON (PID 8820)</span>
              </div>
              <span className="rounded bg-[var(--color-warm-bone)] px-2 py-0.5 font-mono text-[9px] text-[var(--color-bark-grey)]">ACTIVE</span>
            </div>

            {/* Dynamic Widget Body */}
            <div className="flex-1 flex flex-col justify-center">
              {sec2Data.widgetState.activeTab === 'crawler' && (
                <div className="space-y-2 animate-fadeIn">
                  {sec2Data.widgetState.pages.map((p) => (
                    <div key={p.url} className="flex items-center justify-between rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-4 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'completed' ? 'bg-green-500' : p.status === 'active' ? 'bg-[var(--color-electric-indigo)] animate-pulse' : 'bg-zinc-300'}`} />
                        <span className="font-mono text-[11px] text-[var(--color-charcoal)]">{p.url}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[var(--color-pebble)]">{p.size}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-[0.04em] ${p.status === 'completed' ? 'text-green-600' : p.status === 'active' ? 'text-[var(--color-electric-indigo)]' : 'text-zinc-400'}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sec2Data.widgetState.activeTab === 'robots' && (
                <div className="rounded-xl bg-[#121214] p-4 text-zinc-300 font-mono text-xs space-y-2 animate-fadeIn">
                  <div className="text-zinc-500"># robots.txt parsed for target host</div>
                  <div>User-agent: *</div>
                  <div>Allow: /docs</div>
                  <div>Disallow: /admin</div>
                  <div className="text-[var(--color-terracotta)] mt-2">Crawl-delay: 1.5s (Enforced dynamically)</div>
                </div>
              )}

              {sec2Data.widgetState.activeTab === 'filters' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="text-xs text-[var(--color-bark-grey)]">Applying active path filters to target URL patterns:</div>
                  <div className="flex flex-wrap gap-2">
                    {sec2Data.widgetState.exclusions.map((filter: string) => (
                      <span key={filter} className="rounded-lg border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] px-3 py-1 font-mono text-xs text-[var(--color-charcoal)]">
                        {filter}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sec2Data.widgetState.activeTab === 'logs' && (
                <div className="rounded-xl bg-[#121214] p-4 text-[10px] md:text-xs font-mono text-emerald-400 space-y-1.5 animate-fadeIn">
                  {sec2Data.widgetState.logLines.map((line: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-zinc-500">{index + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Widget Footer */}
            <div className="border-t border-[var(--color-stone-mist)] pt-3 mt-4 flex items-center justify-between text-[10px] font-mono text-[var(--color-pebble)]">
              <span>RATE_LIMIT: 20 req/s</span>
              <span>PROXIES: RESIDENTIAL_US</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SECTION #03 ---------------- */}
      <section className="mx-auto max-w-[1200px] grid gap-12 lg:grid-cols-12 items-center">
        {/* Left Column: Accordion */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-1.5 font-mono text-[12px] font-semibold tracking-[0.10em] text-[var(--color-bark-grey)] uppercase">
            <span>[ SECTION #03 ]</span>
            <span className="text-[var(--color-pebble)]">{'// AI EXTRACTION'}</span>
          </div>

          <h2 className="display-serif text-3xl font-bold leading-tight text-[var(--color-charcoal)] md:text-4xl">
            Supercharged structured <span className="font-serif italic font-normal text-[var(--color-electric-indigo)]">outputs.</span>
          </h2>

          <div className="space-y-3">
            {SECTION_3_ITEMS.map((item) => {
              const isActive = sec3Active === item.id;
              return (
                <div 
                  key={item.id} 
                  onClick={() => setSec3Active(item.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
                    isActive 
                      ? 'border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] shadow-sm' 
                      : 'border-transparent hover:bg-[rgba(41,37,36,0.02)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-semibold tracking-[0.06em] font-mono ${isActive ? 'text-[var(--color-charcoal)]' : 'text-[var(--color-bark-grey)]'}`}>
                      {item.title}
                    </h3>
                    <span className={`text-xs transition-transform duration-200 ${isActive ? 'rotate-90 text-[var(--color-electric-indigo)]' : 'text-[var(--color-pebble)]'}`}>
                      →
                    </span>
                  </div>
                  {isActive && (
                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-bark-grey)] animate-fadeIn">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Node Graph Visual */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] p-6 shadow-xl min-h-[300px] flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background grid pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(var(--color-stone-mist)_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            <div className="relative z-10 flex-1 flex flex-col justify-center items-center gap-4 py-4">
              {sec3Data.nodes.map((node, index) => (
                <React.Fragment key={node.id}>
                  {/* Node block */}
                  <div className={`w-[240px] rounded-xl border p-3 flex items-center justify-between bg-[var(--color-paper-white)] transition-all duration-300 ${
                    node.status === 'completed' 
                      ? 'border-green-300 shadow-sm' 
                      : node.status === 'active' 
                      ? 'border-[var(--color-electric-indigo)] ring-2 ring-[rgba(97,95,255,0.15)] shadow-md' 
                      : 'border-[var(--color-stone-mist)] opacity-60'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        node.status === 'completed' 
                          ? 'bg-green-500' 
                          : node.status === 'active' 
                          ? 'bg-[var(--color-electric-indigo)] animate-pulse' 
                          : 'bg-zinc-300'
                      }`} />
                      <div className="text-left">
                        <div className="text-[10px] font-mono text-[var(--color-pebble)] uppercase tracking-[0.04em]">{node.type}</div>
                        <div className="text-xs font-semibold text-[var(--color-charcoal)]">{node.name}</div>
                      </div>
                    </div>
                    {node.status === 'completed' && (
                      <span className="text-xs text-green-600 font-bold">✓</span>
                    )}
                  </div>

                  {/* Flow Arrow (don't render after the last node) */}
                  {index < sec3Data.nodes.length - 1 && (
                    <div className="flex flex-col items-center">
                      <svg className="h-6 w-6 text-[var(--color-stone-mist)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
