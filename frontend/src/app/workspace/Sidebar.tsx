"use client";

import React from "react";
import Link from "next/link";
import { NAV_GROUPS, type NavItem, type ViewId } from "./nav";
import { ThemeToggle } from "@/lib/theme";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  MenuIcon,
  XIcon
} from "@/lib/icons";

/** Inline Logout icon in case it's not exported from icons */
function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "h-4 w-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

interface SidebarProps {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
  onOpenDrawer: () => void;
  email: string;
  onLogout: () => void;
}

function Brand({
  collapsed,
  onToggleCollapse
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-electric-indigo)] text-white shadow-sm">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="7.5" r="3" />
            <circle cx="7.5" cy="13.5" r="3" />
            <circle cx="16.5" cy="13.5" r="3" />
            <path d="M12 12v7.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V12h2z" />
          </svg>
        </div>
        {!collapsed && (
          <span className="truncate font-serif text-base font-bold tracking-tight text-[var(--color-charcoal)]">
            WaterCrab
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleCollapse}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
      >
        {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

function NavRow({
  item,
  active,
  collapsed,
  onPick
}: {
  item: NavItem;
  active: ViewId;
  collapsed: boolean;
  onPick: (v: ViewId) => void;
}) {
  const Icon = item.icon;

  if (!item.available || !item.viewId) {
    return (
      <div
        title={item.description}
        className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 opacity-50"
      >
        <Icon className="h-4 w-4 shrink-0 text-[var(--color-foreground-muted)]" />
        {!collapsed && (
          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate text-[13px] text-[var(--color-foreground-muted)]">{item.label}</span>
            <span className="shrink-0 rounded border border-[var(--color-border)] px-1 py-px font-mono text-[9px] font-semibold uppercase tracking-wide text-[var(--color-foreground-muted)]">
              Soon
            </span>
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
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
        selected
          ? "bg-[var(--color-electric-indigo)] text-white shadow-sm font-semibold"
          : "text-[var(--color-foreground-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${selected ? "text-white" : "text-[var(--color-foreground-secondary)] group-hover:text-[var(--color-foreground)]"}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}

function SidebarContent({
  active,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onClose,
  email,
  onLogout
}: {
  active: ViewId;
  onNavigate: (v: ViewId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
  email: string;
  onLogout: () => void;
}) {
  const initials = (email.split("@")[0] || "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <Brand collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
        <nav className="space-y-4 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {collapsed ? (
                <div className="mx-2 mb-2 border-t border-[var(--color-border)]" />
              ) : (
                <div className="px-3 pb-1.5 pt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-foreground-muted)]">
                  {group.label}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavRow
                    key={item.id}
                    item={item}
                    active={active}
                    collapsed={collapsed}
                    onPick={(v) => {
                      onNavigate(v);
                      onClose?.();
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User profile & actions footer */}
      <div className="border-t border-[var(--color-border)] p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <ThemeToggle />
          {!collapsed && (
            <span className="flex items-center gap-1 rounded-full border border-[rgba(94,165,0,0.3)] bg-[rgba(94,165,0,0.08)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-success)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-success)]" />
              Online
            </span>
          )}
        </div>

        {/* User Card */}
        <div
          title={email}
          className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-2.5"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-electric-indigo)] font-mono text-[11px] font-bold uppercase text-white">
              {initials}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-[var(--color-charcoal)]">
                  {email.split("@")[0]}
                </div>
                <div className="truncate font-mono text-[10px] text-[var(--color-bark-grey)]">
                  {email}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation links & Logout */}
        <div className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--color-foreground-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
          >
            <HomeIcon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Homepage</span>}
          </Link>

          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Log out" : undefined}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--color-danger)] transition-colors hover:bg-[rgba(255,0,0,0.06)]"
          >
            <SignOutIcon className="h-4 w-4 shrink-0 text-[var(--color-danger)]" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  active,
  onNavigate,
  collapsed,
  onToggleCollapse,
  drawerOpen,
  onCloseDrawer,
  onOpenDrawer,
  email,
  onLogout
}: SidebarProps) {
  return (
    <>
      {/* Mobile top trigger when drawer is closed */}
      <div className="flex h-14 w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Open sidebar menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-charcoal)]"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="font-serif text-base font-bold text-[var(--color-charcoal)]">
            WaterCrab
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Desktop / tablet: persistent left navigation sidebar */}
      <aside
        className={`hidden h-screen shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        <SidebarContent
          active={active}
          onNavigate={onNavigate}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          email={email}
          onLogout={onLogout}
        />
      </aside>

      {/* Mobile / tablet: overlay drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? "" : "pointer-events-none"}`}>
        {drawerOpen && (
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={onCloseDrawer}
            aria-hidden="true"
          />
        )}
        <div
          className={`absolute inset-y-0 left-0 flex w-[264px] flex-col bg-[var(--color-surface)] shadow-2xl transition-transform duration-200 ease-out ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
            <span className="font-serif text-base font-bold text-[var(--color-charcoal)]">
              WaterCrab
            </span>
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Close navigation"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-foreground-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <SidebarContent
            active={active}
            onNavigate={onNavigate}
            collapsed={false}
            onToggleCollapse={onToggleCollapse}
            onClose={onCloseDrawer}
            email={email}
            onLogout={onLogout}
          />
        </div>
      </div>
    </>
  );
}