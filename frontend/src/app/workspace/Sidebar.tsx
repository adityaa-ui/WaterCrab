"use client";

import React from "react";
import Link from "next/link";
import { NAV_GROUPS, type NavItem, type ViewId } from "./nav";
import { HomeIcon, XIcon } from "@/lib/icons";

interface SidebarProps {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
  collapsed: boolean;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-4">
      <div className="shrink-0 text-[var(--color-electric-indigo)]">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="7.5" r="3" />
          <circle cx="7.5" cy="13.5" r="3" />
          <circle cx="16.5" cy="13.5" r="3" />
          <path d="M12 12v7.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V12h2z" />
        </svg>
      </div>
      {!collapsed && <span className="truncate font-mono text-sm font-semibold uppercase tracking-[0.1em]">WATERCRAB</span>}
    </div>
  );
}

function NavRow({ item, active, collapsed, onPick }: { item: NavItem; active: ViewId; collapsed: boolean; onPick: (v: ViewId) => void }) {
  const Icon = item.icon;

  if (!item.available || !item.viewId) {
    return (
      <div title={item.description} className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--color-foreground-muted)]/60" />
        {!collapsed && (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate text-[13px] text-[var(--color-foreground-muted)]/60">{item.label}</span>
            <span className="shrink-0 rounded border border-[var(--color-border)] px-1 py-px font-mono text-[9px] font-semibold uppercase tracking-wide text-[var(--color-foreground-muted)]">Soon</span>
          </span>
        )}
      </div>
    );
  }

  const selected = active === item.viewId;
  return (
    <button
      type="button"
      onClick={() => onPick(item.viewId as ViewId)}
      title={collapsed ? item.label : undefined}
      aria-current={selected ? "page" : undefined}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
        selected
          ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
          : "text-[var(--color-foreground-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}

function SidebarContent({ active, onNavigate, collapsed, onClose }: { active: ViewId; onNavigate: (v: ViewId) => void; collapsed: boolean; onClose?: () => void }) {
  return (
    <>
      <Brand collapsed={collapsed} />
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {collapsed ? (
              <div className="mx-2 mb-2 border-t border-[var(--color-border)]" />
            ) : (
              <div className="px-3 pb-1.5 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-foreground-muted)]">{group.label}</div>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavRow key={item.id} item={item} active={active} collapsed={collapsed} onPick={v => { onNavigate(v); onClose?.(); }} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--color-border)] p-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--color-foreground-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]">
          <HomeIcon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Back to site</span>}
        </Link>
      </div>
    </>
  );
}

export default function Sidebar({ active, onNavigate, collapsed, drawerOpen, onCloseDrawer }: SidebarProps) {
  return (
    <>
      {/* Desktop / tablet: persistent, collapsible rail */}
      <aside className={`hidden h-screen shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 lg:flex ${collapsed ? "w-[68px]" : "w-[240px]"}`}>
        <SidebarContent active={active} onNavigate={onNavigate} collapsed={collapsed} />
      </aside>

      {/* Mobile / tablet: overlay drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? "" : "pointer-events-none"}`}>
        {drawerOpen && <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={onCloseDrawer} aria-hidden="true" />}
        <div className={`absolute inset-y-0 left-0 flex w-[264px] flex-col bg-[var(--color-surface)] shadow-2xl transition-transform duration-200 ease-out ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-14 shrink-0 items-center justify-end border-b border-[var(--color-border)] pr-3">
            <button type="button" onClick={onCloseDrawer} aria-label="Close navigation" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-foreground-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <SidebarContent active={active} onNavigate={onNavigate} collapsed={false} onClose={onCloseDrawer} />
        </div>
      </div>
    </>
  );
}