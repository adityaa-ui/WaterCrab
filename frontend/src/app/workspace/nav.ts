import type { ComponentType } from "react";
import type { IconProps } from "@/lib/icons";
import {
  BotIcon,
  ClockIcon,
  CpuIcon,
  CrawlIcon,
  DatabaseIcon,
  DocumentIcon,
  DownloadIcon,
  GlobeIcon,
  GridIcon,
  KeyIcon,
  MapIcon,
  SearchIcon,
  SlidersIcon,
  SparkIcon,
  TransformIcon,
  UploadIcon,
  UsersIcon
} from "@/lib/icons";

export type ViewId = "overview" | "scrape" | "crawl" | "extract" | "files";

export interface NavItem {
  /** Stable id used as the URL hash segment. */
  id: string;
  label: string;
  description: string;
  icon: ComponentType<IconProps>;
  /** True when the feature is real and can be opened today. */
  available: boolean;
  viewId?: ViewId;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Single source of truth for the workspace navigation. Items that are not
    implemented are listed as "Soon" — never faked. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { id: "overview", label: "Overview", description: "Back to your workspace home", icon: GridIcon, available: true, viewId: "overview" }
    ]
  },
  {
    label: "Playground",
    items: [
      { id: "search", label: "Search", description: "Web search over the index", icon: SearchIcon, available: false },
      { id: "scrape", label: "Scrape", description: "Single page to clean Markdown", icon: GlobeIcon, available: true, viewId: "scrape" },
      { id: "map", label: "Map", description: "Site structure and link topology", icon: MapIcon, available: false },
      { id: "crawl", label: "Crawl", description: "Monitored multi-page crawl", icon: CrawlIcon, available: true, viewId: "crawl" },
      { id: "interact", label: "Interact", description: "Conversational page Q&A", icon: BotIcon, available: false },
      { id: "files", label: "Parse Files", description: "Prepare PDFs for processing", icon: UploadIcon, available: true, viewId: "files" }
    ]
  },
  {
    label: "Intelligence",
    items: [
      { id: "extract", label: "Extract", description: "Structured JSON from a page", icon: SparkIcon, available: true, viewId: "extract" },
      { id: "transform", label: "Transform", description: "Shape data into new formats", icon: TransformIcon, available: false },
      { id: "agent", label: "Agent", description: "Autonomous research runs", icon: CpuIcon, available: false }
    ]
  },
  {
    label: "Data",
    items: [
      { id: "documents", label: "Documents", description: "Saved page collections", icon: DocumentIcon, available: false },
      { id: "collections", label: "Collections", description: "Organize your saved data", icon: DatabaseIcon, available: false },
      { id: "exports", label: "Exports", description: "Bundled data delivery", icon: DownloadIcon, available: false }
    ]
  },
  {
    label: "Account",
    items: [
      { id: "activity", label: "Activity", description: "Recent workspace events", icon: ClockIcon, available: false },
      { id: "apikeys", label: "API Keys", description: "Manage API credentials", icon: KeyIcon, available: false },
      { id: "team", label: "Team", description: "Workspace members and roles", icon: UsersIcon, available: false },
      { id: "settings", label: "Settings", description: "Workspace preferences", icon: SlidersIcon, available: false }
    ]
  }
];

export const VIEW_META: Record<ViewId, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Workspace",
    title: "Overview",
    description: "Your collection, inspection and export workspace, all in one place."
  },
  scrape: {
    eyebrow: "Playground",
    title: "Scrape",
    description: "Pull any public page into clean, readable Markdown in one request."
  },
  crawl: {
    eyebrow: "Playground",
    title: "Crawl",
    description: "Crawl a site and watch pages collect with live progress."
  },
  extract: {
    eyebrow: "Intelligence",
    title: "Extract",
    description: "Turn any page into structured JSON with a schema you define."
  },
  files: {
    eyebrow: "Playground",
    title: "Parse Files",
    description: "Add PDFs to your workspace for processing and review."
  }
};

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);
