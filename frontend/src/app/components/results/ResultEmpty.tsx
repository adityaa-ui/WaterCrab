"use client";
import React from "react";
import { GlobeIcon } from "@/lib/icons";

export interface ResultEmptyProps {
  title?: string;
  message?: string;
}

/** Polished "ready to scrape" state shown before the first run. */
export default function ResultEmpty({
  title = "Ready to scrape",
  message = "Enter a target URL and run a scrape — clean Markdown, a readable preview and structured JSON will appear here."
}: ResultEmptyProps) {
  return (
    <div className="result-surface animate-fadeIn flex min-h-[420px] flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper-white)] text-[var(--color-accent)] shadow-sm">
        <GlobeIcon className="h-8 w-8" />
      </div>
      <h3 className="mt-5 font-serif text-lg font-semibold text-[var(--color-charcoal)]">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-[var(--color-foreground-secondary)]">
        {message}
      </p>
    </div>
  );
}
