"use client";

import React from "react";
import Link from "next/link";
import Dropdown from "./Dropdown";
import { ThemeToggle } from "@/lib/theme";
import { BellIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, HomeIcon, MenuIcon } from "@/lib/icons";

interface TopBarProps {
  title: string;
  eyebrow: string;
  email: string;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenDrawer: () => void;
}

export default function TopBar({ title, eyebrow, email, onLogout, collapsed, onToggleCollapse, onOpenDrawer }: TopBarProps) {
  const initials = (email.split("@")[0] || "U").slice(0, 2).toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-header-glass)] px-4 backdrop-blur-md md:px-6">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenDrawer}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
        >
          <MenuIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapse}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
        >
          {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
        </button>
        <div className="ml-2 hidden min-w-0 sm:block">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-foreground-muted)]">{eyebrow}</p>
          <h1 className="truncate font-serif text-lg leading-tight tracking-[-0.01em]">{title}</h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Workspace selector */}
        <Dropdown
          label="Switch workspace"
          buttonClassName="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface-hover)]"
          button={open => (
            <span className="inline-flex items-center gap-1.5">
              <span className="hidden sm:inline">Workspace</span>
              <ChevronDownIcon className={`h-3.5 w-3.5 text-[var(--color-foreground-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
            </span>
          )}
          panelClassName="w-[240px]"
        >
          <div className="p-1.5">
            <div className="px-2.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-foreground-muted)]">Workspace</div>
            <div className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium">
              <span>Personal workspace</span>
              <CheckIcon className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            </div>
            <div className="mt-0.5 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--color-foreground-muted)]">
              <span>Team workspace</span>
              <span className="rounded border border-[var(--color-border)] px-1 py-px font-mono text-[9px] uppercase tracking-wide">Soon</span>
            </div>
          </div>
        </Dropdown>

        {/* Notifications */}
        <Dropdown
          label="Notifications"
          buttonClassName="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
          button={() => (
            <span className="relative">
              <BellIcon className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            </span>
          )}
          panelClassName="w-[280px]"
        >
          <div className="p-4">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-foreground-muted)]">Notifications</div>
            <div className="mt-3 flex flex-col items-start gap-1">
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="text-[13px] leading-relaxed text-[var(--color-foreground-secondary)]">Status and run updates will appear here.</p>
            </div>
          </div>
        </Dropdown>

        <ThemeToggle className="hidden sm:inline-flex" />

        {/* User menu */}
        <Dropdown
          label="Account menu"
          buttonClassName="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 transition-colors hover:bg-[var(--color-surface-hover)]"
          button={() => (
            <span className="inline-flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--color-accent)]/15 text-[10px] font-bold uppercase text-[var(--color-accent)]">{initials}</span>
              <ChevronDownIcon className="h-3.5 w-3.5 text-[var(--color-foreground-muted)]" />
            </span>
          )}
          panelClassName="w-[240px]"
        >
          {close => (
            <div className="p-1.5">
              <div className="px-2.5 py-2">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-foreground-muted)]">Signed in as</div>
                <div className="mt-0.5 truncate text-[13px] font-medium" title={email}>{email}</div>
              </div>
              <div className="my-1 h-px bg-[var(--color-border)]" />
              <Link href="/" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[var(--color-foreground-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]">
                <HomeIcon className="h-4 w-4" />
                Back to site
              </Link>
              <button
                type="button"
                onClick={() => { onLogout(); close(); }}
                className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
              >
                Log out
              </button>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}