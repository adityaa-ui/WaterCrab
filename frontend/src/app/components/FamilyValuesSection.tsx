"use client";
import React, { useState } from "react";
import { 
  IconSparkles, 
  IconArrowRight, 
  IconCheck, 
  IconLayersSubtract, 
  IconFlame, 
  IconHeartHandshake,
  IconCpu
} from "@tabler/icons-react";

const VALUES = [
  {
    num: "01",
    name: "Simplicity",
    sub: "Gradual revelation",
    desc: "Never overwhelm the screen with unnecessary knobs. Core extraction is instantaneous with a single URL, while schema options, proxies, and multi-page depth unfold contextually.",
    accent: "text-[#FF5C38]",
    bgAccent: "bg-orange-50 dark:bg-orange-950/30",
    pill: "Zero-Config"
  },
  {
    num: "02",
    name: "Fluidity",
    sub: "Seamless execution",
    desc: "Built on headless Chromium and BullMQ distributed queues. Every job flows with continuous identity, sub-second streaming, and resilient retries that never drop a connection.",
    accent: "text-[#5B5BD6]",
    bgAccent: "bg-indigo-50 dark:bg-indigo-950/30",
    pill: "Sub-second"
  },
  {
    num: "03",
    name: "Delight",
    sub: "Selective emphasis",
    desc: "Transforming the web shouldn't feel like wrestling with broken parsers. Clean typed outputs, native Model Context Protocol tools, and zero hallucinated schema fields.",
    accent: "text-[#10B981]",
    bgAccent: "bg-emerald-50 dark:bg-emerald-950/30",
    pill: "Type-Safe"
  }
];

export default function FamilyValuesSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="values" className="py-20 md:py-28">
      <div className="mx-auto max-w-[1140px]">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] px-4 py-1.5 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#FF5C38]" />
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--color-charcoal)]">
              Family Values
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-charcoal)] sm:text-5xl">
            Simplicity, Fluidity, & Delight.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--color-bark-grey)]">
            Inspired by Benji Taylor’s design manifesto: software that feels human, responsive, and tactile rather than a cold command terminal.
          </p>
        </div>

        {/* 3 Family Values Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VALUES.map((val, idx) => (
            <div
              key={val.name}
              onMouseEnter={() => setActiveTab(idx)}
              className="family-card group flex flex-col justify-between p-8"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-[var(--color-stone)]">
                    {val.num}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${val.bgAccent} ${val.accent}`}>
                    {val.pill}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-bold tracking-tight text-[var(--color-charcoal)]">
                  {val.name}
                </h3>
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-stone)] mt-1">
                  {val.sub}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[var(--color-bark-grey)]">
                  {val.desc}
                </p>
              </div>

              <div className="mt-8 border-t border-[var(--color-stone-mist)] pt-4 flex items-center justify-between text-xs font-semibold text-[var(--color-charcoal)]">
                <span>View Documentation</span>
                <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
