"use client";

import React from "react";
import { VIEW_META, type ViewId } from "./nav";

interface ViewScaffoldProps {
  view: ViewId;
  children: React.ReactNode;
}

/** Uniform page frame: eyebrow/title/description header + a translucent
    elevated panel that hosts the active tool. */
export default function ViewScaffold({ view, children }: ViewScaffoldProps) {
  const meta = VIEW_META[view];
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-8 md:px-8 md:pt-10">
      <div key={view} className="animate-fadeUp">
        <div className="mb-6 md:mb-8">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            {meta.eyebrow}
          </p>
          <h2 className="mt-1 font-serif text-3xl tracking-[-0.02em] md:text-4xl">{meta.title}</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--color-foreground-secondary)]">
            {meta.description}
          </p>
        </div>
        <div className="workspace-panel p-5 md:p-7">{children}</div>
      </div>
    </div>
  );
}