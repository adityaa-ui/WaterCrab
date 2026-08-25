"use client";
import React from "react";

export interface ResultMarkdownProps {
  markdown: string;
}

/** Monospace document view with line/byte metadata and a graceful empty state. */
export default function ResultMarkdown({ markdown }: ResultMarkdownProps) {
  const hasContent = markdown.length > 0;
  const lines = hasContent ? markdown.split("\n").length : 0;
  const sizeKb = (markdown.length / 1024).toFixed(1);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]/60 px-4 py-1.5 md:px-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-foreground-muted)]">
          text/markdown · {sizeKb} KB · {lines.toLocaleString()} lines
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {hasContent ? (
          <pre className="whitespace-pre p-5 font-mono text-xs leading-[1.7] text-[var(--color-charcoal)] selection:bg-[rgba(97,95,255,0.18)]">
            {markdown}
          </pre>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-[var(--color-foreground-secondary)]">
              No Markdown was returned for this page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
