"use client";
import React from "react";
import { renderMarkdown } from "@/lib/markdown";

export interface ResultPreviewProps {
  title: string;
  excerpt?: string;
  markdown: string;
}

/** Rendered article view: readable line length, typographic hierarchy and
    graceful handling when no content was extracted. */
export default function ResultPreview({ title, excerpt, markdown }: ResultPreviewProps) {
  const hasContent = markdown.trim().length > 0;

  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto w-full max-w-[72ch] px-5 py-6 md:px-8 md:py-8">
        <h1 className="font-serif text-2xl font-semibold tracking-[-0.01em] text-[var(--color-charcoal)] md:text-3xl">
          {title}
        </h1>
        {excerpt && (
          <blockquote className="mt-3 border-l-2 border-[var(--color-accent)] pl-4 font-serif text-sm italic leading-relaxed text-[var(--color-foreground-secondary)] md:text-base">
            {excerpt}
          </blockquote>
        )}
        {hasContent ? (
          <div className="mt-5">{renderMarkdown(markdown)}</div>
        ) : (
          <p className="mt-6 text-sm leading-relaxed text-[var(--color-foreground-secondary)]">
            No readable content was extracted from this page. Try the Markdown
            tab for the raw collected text, or scrape again.
          </p>
        )}
      </article>
    </div>
  );
}
