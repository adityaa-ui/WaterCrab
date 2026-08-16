"use client";
import React from 'react';

const stats = [
  { value: '755,470', label: 'PAGES SCRAPED' },
  { value: '96.82%', label: 'SUCCESS RATE' },
  { value: '1.87s', label: 'MEDIAN READ TIME' },
  { value: '3.10%', label: 'AVG. EXTRACTION DRIFT' }
];

export default function StatsBar() {
  return (
    <section className="w-full bg-[var(--color-paper-white)] border-t border-b border-[var(--color-stone-mist)]">
      <div className="mx-auto max-w-[1200px] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--color-stone-mist)]">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            className="flex flex-col items-center justify-center py-6 px-4 text-center md:py-8"
          >
            <div className="font-datatype text-[24px] font-normal text-[var(--color-charcoal)]">
              {stat.value}
            </div>
            <div className="mt-2 text-[12px] font-sans tracking-[0.10em] uppercase text-[var(--color-bark-grey)]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
