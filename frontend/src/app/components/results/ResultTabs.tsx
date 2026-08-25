"use client";
import React, { useRef } from "react";

export type ResultTabId = "preview" | "markdown" | "json";

const TABS: Array<{ id: ResultTabId; label: string }> = [
  { id: "preview", label: "Preview" },
  { id: "markdown", label: "Markdown" },
  { id: "json", label: "JSON" }
];

interface ResultTabsProps {
  active: ResultTabId;
  onChange: (tab: ResultTabId) => void;
}

/** Accessible tab list with a subtle underline indicator and keyboard support. */
export default function ResultTabs({ active, onChange }: ResultTabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = TABS.findIndex(t => t.id === active);
    if (idx < 0) return;
    let next = -1;
    if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next === -1) return;
    e.preventDefault();
    onChange(TABS[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Result views"
      onKeyDown={onKeyDown}
      className="flex items-center overflow-x-auto"
    >
      {TABS.map((tab, i) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={el => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`result-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls="result-panel"
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`relative -mb-px border-b-2 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(97,95,255,0.35)] focus-visible:ring-inset ${
              isActive
                ? "border-[var(--color-accent)] text-[var(--color-charcoal)]"
                : "border-transparent text-[var(--color-foreground-muted)] hover:text-[var(--color-charcoal)]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
