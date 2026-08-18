"use client";

import React from "react";
import { ALL_NAV_ITEMS, type ViewId } from "./nav";

interface OverviewViewProps {
  email: string;
  onNavigate: (view: ViewId) => void;
}

/** Landing surface of the workspace: welcome, one-click quick actions for
    every shipped tool, and an explicit "coming next" list. */
export default function OverviewView({ email, onNavigate }: OverviewViewProps) {
  const available = ALL_NAV_ITEMS.filter(i => i.available && i.viewId);
  const upcoming = ALL_NAV_ITEMS.filter(i => !i.available && i.id !== "overview");

  return (
    <div className="space-y-9">
      <div>
        <h3 className="font-serif text-2xl tracking-[-0.01em]">Welcome back, {email.split("@")[0]}.</h3>
        <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[var(--color-foreground-secondary)]">
          Pick a tool to get going, or open any live tool from the sidebar on the left.
        </p>
      </div>

      <div>
        <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-foreground-muted)]">
          Quick actions
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {available.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.viewId as ViewId)}
                className="group flex flex-col items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-colors hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-hover)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)]/12 text-[var(--color-accent)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-[12px] leading-relaxed text-[var(--color-foreground-secondary)]">{item.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-foreground-muted)]">
          Coming next
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {upcoming.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-[var(--color-border)] p-4 opacity-70">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-foreground-muted)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="rounded border border-[var(--color-border)] px-1 py-px font-mono text-[9px] uppercase tracking-wide text-[var(--color-foreground-muted)]">
                  Soon
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}