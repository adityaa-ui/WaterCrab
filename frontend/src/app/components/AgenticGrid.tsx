"use client";
import React from 'react';
import {
  IconCpu,
  IconCode,
  IconTerminal2,
  IconBracketsContain,
  IconRobot,
  IconDatabase,
  IconServer,
  IconArrowUpRight
} from "@tabler/icons-react";

const AGENTS = [
  { name: 'Claude Desktop', desc: 'Native Anthropic tool calling via Model Context Protocol', icon: IconCpu, color: 'text-[#FF5C38]', bg: 'bg-orange-50 dark:bg-orange-950/40', tag: 'MCP' },
  { name: 'Cursor IDE', desc: 'Direct editor codebase matching & live documentation crawling', icon: IconCode, color: 'text-[#5B5BD6]', bg: 'bg-indigo-50 dark:bg-indigo-950/40', tag: 'EDITOR' },
  { name: 'Antigravity', desc: 'Autonomous background tasks and multi-agent swarm loops', icon: IconRobot, color: 'text-[#10B981]', bg: 'bg-emerald-50 dark:bg-emerald-950/40', tag: 'SWARM' },
  { name: 'OpenAI Swarm', desc: 'Custom actions and structured JSON function execution', icon: IconTerminal2, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', tag: 'TOOL' },
  { name: 'LangChain', desc: 'Document loader chains for vector database retrieval', icon: IconDatabase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40', tag: 'RAG' },
  { name: 'LlamaIndex', desc: 'Structured web node parser and automated indexing pipeline', icon: IconServer, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40', tag: 'INDEX' },
  { name: 'v0 by Vercel', desc: 'Component generation from real website DOM snapshots', icon: IconBracketsContain, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40', tag: 'REACT' },
  { name: 'GitHub Copilot', desc: 'Automated test suite feeding and live reproduction snippets', icon: IconCode, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/40', tag: 'COMPANION' }
];

export default function AgenticGrid() {
  return (
    <section id="integrations" className="py-20 md:py-28">
      <div className="mx-auto max-w-[1140px]">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-1.5 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#10B981]" />
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--color-charcoal)]">
              Ecosystem
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-charcoal)] sm:text-5xl">
            Works with your favorite agent.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--color-bark-grey)]">
            Standardized Markdown, JSON Schema, and citations designed specifically to minimize token usage and maximize LLM reasoning accuracy.
          </p>
        </div>

        {/* 8-Card Matrix */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map((agent) => (
            <div
              key={agent.name}
              className="family-card group flex flex-col justify-between p-6 transition-all duration-300 hover:scale-[1.02]"
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--color-stone-mist)]">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${agent.bg} ${agent.color}`}>
                    <agent.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-[var(--color-ivory)] px-2.5 py-1 text-[10px] font-bold tracking-wider text-[var(--color-stone)]">
                    {agent.tag}
                  </span>
                </div>

                <div className="text-base font-bold text-[var(--color-charcoal)]">
                  {agent.name}
                </div>

                <p className="mt-2 text-xs leading-relaxed text-[var(--color-bark-grey)]">
                  {agent.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--color-stone-mist)] flex items-center justify-between text-xs font-semibold text-[var(--color-charcoal)]">
                <span className="text-[#10B981] flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                  Verified
                </span>
                <IconArrowUpRight className="h-4 w-4 text-[var(--color-stone)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--color-charcoal)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
