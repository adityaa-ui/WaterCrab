"use client";
import React from 'react';
import { IconBolt, IconCircleCheck, IconClock, IconCpu } from "@tabler/icons-react";

const stats = [
  { value: '1.4M+', label: 'Pages Scraped Daily', sub: 'Verified DOM payloads', icon: IconBolt, color: 'text-[#FF5C38]', bg: 'bg-orange-50 dark:bg-orange-950/40' },
  { value: '99.8%', label: 'Extraction Precision', sub: 'Zero schema drift', icon: IconCircleCheck, color: 'text-[#10B981]', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { value: '1.87s', label: 'Median Response', sub: 'Playwright headless pipeline', icon: IconClock, color: 'text-[#5B5BD6]', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
  { value: '< 0.02%', label: 'Hallucination Rate', sub: 'Strict JSON adherence', icon: IconCpu, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' }
];

export default function StatsBar() {
  return (
    <section id="stats" className="my-16">
      <div className="mx-auto max-w-[1140px] rounded-[32px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] md:p-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:divide-x md:divide-[var(--color-stone-mist)]">
          {stats.map((stat, idx) => (
            <div 
              key={stat.label} 
              className={`flex flex-col items-center justify-center text-center ${idx > 0 ? 'md:pl-8' : ''}`}
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-extrabold tracking-tight text-[var(--color-charcoal)] md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1.5 text-xs font-bold text-[var(--color-charcoal)]">
                {stat.label}
              </div>
              <div className="mt-0.5 text-xs text-[var(--color-stone)]">
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
