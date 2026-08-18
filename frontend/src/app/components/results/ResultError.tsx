"use client";
import React from "react";
import { AlertIcon, RefreshIcon } from "@/lib/icons";

export interface ResultErrorProps {
  title: string;
  message: string;
  /** Optional raw/technical detail shown in a collapsible section. */
  details?: string;
  onRetry?: () => void;
}

/** Premium error state with a retry action and collapsible technical detail. */
export default function ResultError({
  title,
  message,
  details,
  onRetry
}: ResultErrorProps) {
  return (
    <div
      role="alert"
      className="result-surface animate-fadeIn flex min-h-[420px] flex-1 flex-col items-center justify-center p-8 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(255,0,0,0.2)] bg-[rgba(255,0,0,0.08)] text-[var(--color-danger)]">
        <AlertIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-[var(--color-charcoal)]">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--color-foreground-secondary)]">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper-white)] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-charcoal)] shadow-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(97,95,255,0.35)]"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          Try again
        </button>
      )}

      {details && (
        <details className="mt-4 w-full max-w-md overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-paper-white)]/60 text-left">
          <summary className="cursor-pointer select-none px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-foreground-secondary)] transition hover:text-[var(--color-charcoal)]">
            Technical details
          </summary>
          <p className="break-words border-t border-[var(--color-border)] px-3 py-2 font-mono text-[10px] leading-relaxed text-[var(--color-foreground-muted)]">
            {details}
          </p>
        </details>
      )}
    </div>
  );
}
