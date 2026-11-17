"use client";
import React, { useState } from "react";
import {
  IconBrowser,
  IconShieldCheck,
  IconPlugConnected,
  IconCode,
  IconCheck,
  IconLock,
  IconServer,
  IconCpu,
  IconArrowRight,
  IconBracketsContain,
  IconSparkles,
  IconBolt,
  IconFileText
} from "@tabler/icons-react";

export default function FeatureGrid() {
  const [activeTab, setActiveTab] = useState<"markdown" | "json">("markdown");

  return (
    <section id="features" className="py-20 md:py-28">
      {/* Family Section Header */}
      <div className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-1.5 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-[#FF5C38]" />
          <span className="text-xs font-semibold tracking-wide uppercase text-[var(--color-charcoal)]">
            Core Architecture
          </span>
        </div>
        
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-charcoal)] sm:text-5xl">
          Everything you need to extract the web.
        </h2>
        
        <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--color-bark-grey)]">
          Built for teams who need clean data without the headaches of proxy rotation, bot protection, or messy HTML formatting.
        </p>
      </div>

      {/* Family.co Bento Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        
        {/* TILE 1: THE HEADLESS DOM WORKBENCH (Spans 8 cols) */}
        <div className="family-card flex flex-col justify-between p-6 md:col-span-8 md:p-8">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C38]">
                Runtime Engine
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#10B981] dark:bg-emerald-950/40">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                200 OK • 340ms
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-charcoal)] sm:text-3xl">
              Headless DOM Sanitizer
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-bark-grey)]">
              Playwright Chromium renders JavaScript hydration, purges ad networks, tracking tags, and consent popups, yielding clean LLM-ready markdown.
            </p>
          </div>

          {/* Interactive Window Preview */}
          <div className="mt-8 overflow-hidden rounded-[20px] border border-[var(--color-stone-mist)] bg-[var(--color-ivory)]">
            {/* Window Chrome */}
            <div className="flex items-center justify-between border-b border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>

              {/* URL Pill */}
              <div className="flex max-w-[280px] items-center gap-1.5 truncate rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-ivory)] px-3 py-1 text-xs font-medium text-[var(--color-charcoal)]">
                <IconLock className="h-3 w-3 text-[#10B981] shrink-0" />
                <span className="truncate">https://stripe.com/pricing</span>
              </div>

              {/* Tab Selector */}
              <div className="flex rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-ivory)] p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("markdown")}
                  className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                    activeTab === "markdown"
                      ? "bg-[var(--color-charcoal)] text-[var(--color-warm-bone)] shadow-sm"
                      : "text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
                  }`}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("json")}
                  className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                    activeTab === "json"
                      ? "bg-[var(--color-charcoal)] text-[var(--color-warm-bone)] shadow-sm"
                      : "text-[var(--color-bark-grey)] hover:text-[var(--color-charcoal)]"
                  }`}
                >
                  JSON Schema
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-5 font-mono text-[12px] leading-relaxed text-[var(--color-charcoal)]">
              {activeTab === "markdown" ? (
                <div className="space-y-2">
                  <div className="font-bold text-[#FF5C38]"># Stripe Global Pricing & Infrastructure</div>
                  <div className="text-[var(--color-stone)]">Last scraped: 2 minutes ago • Automated clean parse</div>
                  <div className="rounded-lg bg-[var(--color-paper-white)] p-3 border border-[var(--color-stone-mist)]">
                    | Feature | Starter Plan | Scale Tier | Enterprise |
                    <br />
                    | Fee | 2.9% + 30¢ | 2.4% + 25¢ | Volume Discount |
                    <br />
                    | Payouts | 2 Business Days | Instant Rails | Real-time |
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-[#10B981]">
                    <IconCheck className="h-3.5 w-3.5" />
                    <span>Payload reduced by 94.8% (1.2 MB raw HTML → 1.4 KB Markdown)</span>
                  </div>
                </div>
              ) : (
                <pre className="text-[11px] text-[var(--color-charcoal)] overflow-x-auto rounded-lg bg-[var(--color-paper-white)] p-3 border border-[var(--color-stone-mist)]">
{`{
  "entity": "Stripe Pricing",
  "currency": "USD",
  "rates": [
    { "tier": "standard", "percent": 2.9, "fixedFee": 0.30 },
    { "tier": "scale", "percent": 2.4, "fixedFee": 0.25 }
  ],
  "payoutRails": ["instant", "standard_ach"],
  "verified": true
}`}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* TILE 2: HIGH-IMPACT METRIC (Spans 4 cols) */}
        <div className="family-card flex flex-col justify-between p-6 md:col-span-4 md:p-8">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C38]">
                SLA Guarantee
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-[#FF5C38]">
                <IconShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-charcoal)]">
              Zero-Drift SLA
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-bark-grey)]">
              Reliable parsing fidelity across 1.4M daily pages.
            </p>
          </div>

          <div className="my-8">
            <div className="text-6xl font-extrabold tracking-tight text-[var(--color-charcoal)]">
              99.8<span className="text-[#FF5C38] text-4xl">%</span>
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)]">
              Verified Schema Accuracy
            </div>
          </div>

          <div className="rounded-[18px] bg-[var(--color-ivory)] p-4 text-xs font-medium text-[var(--color-bark-grey)]">
            <div className="flex justify-between items-center">
              <span>Drift Rate:</span>
              <span className="text-[#10B981] font-bold">&lt; 0.02%</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>Median Execution:</span>
              <span className="text-[var(--color-charcoal)] font-bold">1.87 seconds</span>
            </div>
          </div>
        </div>

        {/* TILE 3: STRICT TYPE CONTRACTS (Spans 4 cols) */}
        <div className="family-card flex flex-col justify-between p-6 md:col-span-4 md:p-8">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B5BD6]">
                Type Safety
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[#5B5BD6]">
                <IconBracketsContain className="h-4 w-4" />
              </div>
            </div>

            <h3 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-charcoal)]">
              Zod & JSON Schemas
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-bark-grey)]">
              Enforce strict type contracts. Prevent hallucinations and null errors from entering production.
            </p>
          </div>

          <div className="my-6 rounded-[18px] bg-[var(--color-ivory)] p-4 font-mono text-[11px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-stone-mist)] text-[var(--color-stone)] font-sans font-semibold">
              <span>SCHEMA RULES</span>
              <span className="text-[#10B981]">VALIDATED</span>
            </div>
            <div className="space-y-1.5 text-[var(--color-charcoal)]">
              <div><span className="text-[#FF5C38] font-bold">name</span>: string</div>
              <div><span className="text-[#5B5BD6] font-bold">price</span>: number</div>
              <div><span className="text-[#10B981] font-bold">inStock</span>: boolean</div>
              <div><span className="text-amber-500 font-bold">specs</span>: Record&lt;string, string&gt;</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#10B981]">
            <IconCheck className="h-4 w-4 shrink-0" />
            <span>Guaranteed zero null property leaks</span>
          </div>
        </div>

        {/* TILE 4: UNIVERSAL AGENT & MCP HUB (Spans 8 cols) */}
        <div className="family-card flex flex-col justify-between p-6 md:col-span-8 md:p-8">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF5C38]">
                Native Connectivity
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#FF5C38] dark:bg-orange-950/40">
                <IconPlugConnected className="h-3.5 w-3.5" />
                MCP Server Ready
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-charcoal)] sm:text-3xl">
              Model Context Protocol Native
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-bark-grey)]">
              WaterCrab acts as a remote tool server for Claude Desktop, Cursor, Antigravity, and autonomous agent swarms with zero glue code.
            </p>
          </div>

          {/* Interactive Agent Chips */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "Claude Desktop", mode: "Stdio Server", icon: IconCpu, color: "text-[#FF5C38]" },
              { name: "Cursor IDE", mode: "Editor Tool Call", icon: IconCode, color: "text-[#5B5BD6]" },
              { name: "Antigravity", mode: "Subagent Swarm", icon: IconBrowser, color: "text-[#10B981]" },
              { name: "LangChain", mode: "DocumentLoader", icon: IconFileText, color: "text-amber-500" }
            ].map((agent) => (
              <div
                key={agent.name}
                className="flex flex-col rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-ivory)] p-4 transition-all duration-300 hover:scale-[1.02] hover:bg-[var(--color-paper-white)]"
              >
                <div className="flex items-center justify-between">
                  <agent.icon className={`h-5 w-5 ${agent.color}`} />
                  <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                </div>
                <div className="mt-3 text-xs font-bold text-[var(--color-charcoal)]">
                  {agent.name}
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--color-stone)]">
                  {agent.mode}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-stone-mist)] pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-stone)]">
              Supported Transports: STDIO • HTTP SSE • JSON-RPC 2.0
            </span>
            <a
              href="#pipeline"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-charcoal)] hover:text-[#FF5C38] transition-colors"
            >
              <span>Explore Tool Definition</span>
              <IconArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
