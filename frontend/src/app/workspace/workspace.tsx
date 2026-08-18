"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ViewScaffold from "./ViewScaffold";
import OverviewView from "./OverviewView";
import PipelineTool from "@/app/components/PipelineTool";
import PdfUpload from "@/app/components/PdfUpload";
import { createClient } from "@/lib/supabase/client";
import { VIEW_META, type ViewId } from "./nav";

export default function Workspace({ email }: { email: string }) {
  const router = useRouter();
  const [active, setActive] = useState<ViewId>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const logout = async () => {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  };

  const navigate = (view: ViewId) => {
    setActive(view);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const meta = VIEW_META[active];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-warm-bone)] text-[var(--color-foreground)] antialiased">
      <Sidebar
        active={active}
        onNavigate={navigate}
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={meta.title}
          eyebrow={meta.eyebrow}
          email={email}
          onLogout={logout}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        <main className="relative flex-1 overflow-y-auto">
          <div className="grid-canvas pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <ViewScaffold view={active}>
            {active === "overview" && <OverviewView email={email} onNavigate={navigate} />}
            {active === "scrape" && <PipelineTool bare initialMode="scrape" />}
            {active === "crawl" && <PipelineTool bare initialMode="crawl" />}
            {active === "extract" && <PipelineTool bare initialExtract />}
            {active === "files" && <PdfUpload bare />}
          </ViewScaffold>
        </main>
      </div>
    </div>
  );
}
