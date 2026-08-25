"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import ViewScaffold from "./ViewScaffold";
import OverviewView from "./OverviewView";
import PipelineTool from "@/app/components/PipelineTool";
import PdfUpload from "@/app/components/PdfUpload";
import LeadGenTool from "@/app/components/LeadGenTool";
import { logoutFirebase, subscribeToAuthChanges } from "@/lib/firebase";
import { type ViewId } from "./nav";

export default function Workspace({ email: initialEmail }: { email: string }) {
  const router = useRouter();
  const [active, setActive] = useState<ViewId>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuthChanges((user) => {
      if (!user) {
        // No Firebase session — redirect to homepage
        router.replace("/");
      } else {
        setEmail(user.email ?? user.uid);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [router]);

  const logout = async () => {
    await logoutFirebase();
    router.replace("/");
    router.refresh();
  };

  const navigate = (view: ViewId) => {
    setActive(view);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  // Show loading indicator until Firebase confirms auth session
  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-warm-bone)]">
        <div className="flex flex-col items-center gap-3">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-electric-indigo)] border-t-transparent" />
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-bark-grey)]">
            Authenticating…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col lg:flex-row overflow-hidden bg-[var(--color-warm-bone)] text-[var(--color-foreground)] antialiased">
      {/* Unified Left Sidebar navigation with embedded account & collapse controls */}
      <Sidebar
        active={active}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        onOpenDrawer={() => setDrawerOpen(true)}
        email={email}
        onLogout={logout}
      />

      {/* Main unified canvas area (TopBar removed for maximized screen workspace) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="relative flex-1 overflow-y-auto p-4 md:p-8">
          <div
            className="grid-canvas pointer-events-none absolute inset-0 opacity-30"
            aria-hidden="true"
          />
          <ViewScaffold view={active}>
            {active === "overview" && <OverviewView email={email} onNavigate={navigate} />}
            {active === "search" && <PipelineTool bare initialMode="search" />}
            {active === "scrape" && <PipelineTool bare initialMode="scrape" />}
            {active === "map" && <PipelineTool bare initialMode="map" />}
            {active === "crawl" && <PipelineTool bare initialMode="crawl" />}
            {active === "extract" && <PipelineTool bare initialExtract />}
            {active === "leadgen" && <LeadGenTool bare />}
            {active === "files" && <PdfUpload bare />}
          </ViewScaffold>
        </main>
      </div>
    </div>
  );
}
