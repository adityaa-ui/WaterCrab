"use client";
import React from "react";
import type { CrawlProgress } from "@/lib/types";

export interface ResultLoadingProps {
  status: string;
  progress?: CrawlProgress;
}

/** Premium skeleton loading state: header + content shimmer, status text and
    optional live crawl progress. Shimmer is bounded, never infinite. */
export default function ResultLoading({ status, progress }: ResultLoadingProps) {
  const percent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;
  const showProgress = Boolean(progress && progress.total > 0);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Pipeline running"
      className="result-surface flex min-h-[420px] flex-1 flex-col overflow-hidden"
    >
      {/* Header skeleton */}
      <div className="border-b border-[var(--color-border)] px-5 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="skeleton-line h-3.5 w-16 rounded-md" />
          <div className="skeleton-line h-3.5 w-32 rounded-md" />
          <div className="skeleton-line hidden h-3.5 w-20 rounded-md sm:block" />
        </div>
        <div className="skeleton-line mt-3 h-6 w-2/3 rounded-md" />
        <div className="skeleton-line mt-2.5 h-3.5 w-1/2 rounded-md" />
      </div>

      {/* Tab skeleton */}
      <div className="flex items-center gap-5 border-b border-[var(--color-border)] px-5 py-3">
        <div className="skeleton-line h-3 w-12 rounded-md" />
        <div className="skeleton-line h-3 w-16 rounded-md" />
        <div className="skeleton-line h-3 w-10 rounded-md" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 space-y-3.5 p-6 md:p-8">
        <div className="skeleton-line h-4 w-full rounded-md" />
        <div className="skeleton-line h-4 w-[94%] rounded-md" />
        <div className="skeleton-line h-4 w-[88%] rounded-md" />
        <div className="skeleton-line h-4 w-[91%] rounded-md" />
        <div className="skeleton-line h-4 w-[60%] rounded-md" />
        <div className="pt-3">
          <div className="skeleton-line h-4 w-[97%] rounded-md" />
          <div className="skeleton-line mt-3.5 h-4 w-[82%] rounded-md" />
          <div className="skeleton-line mt-3.5 h-4 w-[70%] rounded-md" />
        </div>
      </div>

      {/* Status footer */}
      <div className="flex items-center gap-2 border-t border-[var(--color-border)] px-5 py-3">
        <span
          className="animate-statusPulse h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]"
          aria-hidden="true"
        />
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-foreground-secondary)]">
          {status}
        </span>
        {showProgress && (
          <div className="ml-auto flex w-32 items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-stone-mist)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-[var(--color-foreground-secondary)]">
              {percent}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
