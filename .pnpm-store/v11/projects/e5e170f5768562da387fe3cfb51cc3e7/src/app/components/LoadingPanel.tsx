"use client";
import React from "react";
import { Spinner } from "@/lib/icons";
import type { CrawlProgress } from "@/lib/types";

export interface LoadingPanelProps {
  status: string;
  progress?: CrawlProgress;
}

export default function LoadingPanel({ status, progress }: LoadingPanelProps) {
  const percent =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

  return (
    <div className="animate-fadeIn flex min-h-[420px] flex-1 flex-col items-center justify-center rounded-[18px] border border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-8 text-center shadow-[0_16px_40px_rgba(41,37,36,0.08)]">
      <Spinner className="text-[var(--color-electric-indigo)]" />
      <h3 className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.10em] text-[var(--color-charcoal)]">
        Pipeline executing
      </h3>
      <p className="mt-2 font-mono text-xs text-[var(--color-electric-indigo)]">{status}</p>

      {progress && progress.total > 0 && (
        <div className="mt-6 w-64">
          <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-[var(--color-bark-grey)]">
            <span>
              {progress.current} of {progress.total} pages
            </span>
            <span>{percent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-stone-mist)]">
            <div
              className="h-full rounded-full bg-[var(--color-electric-indigo)] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
