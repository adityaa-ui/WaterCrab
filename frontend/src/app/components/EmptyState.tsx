"use client";
import React from "react";
import { DocumentIcon } from "@/lib/icons";

export interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="animate-fadeIn flex min-h-[420px] flex-1 flex-col items-center justify-center rounded-[18px] border border-dashed border-[var(--color-stone-mist)] bg-[var(--color-paper-white)] p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-stone-mist)] bg-[var(--color-warm-bone)] text-[var(--color-pebble)]">
        <DocumentIcon className="h-8 w-8" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold text-[var(--color-charcoal)]">
        {message || "No content queued yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--color-bark-grey)]">
        Enter a target URL and choose a strategy to see results populate here.
      </p>
    </div>
  );
}
