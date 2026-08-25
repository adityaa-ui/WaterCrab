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

export type ViewId = "overview" | "search" | "scrape" | "map" | "crawl" | "extract" | "files" | "leadgen";

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

/** Single source of truth for the workspace navigation. */
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
      { id: "search", label: "Search", description: "Web search over the live index", icon: SearchIcon, available: true, viewId: "search" },
      { id: "scrape", label: "Scrape", description: "Single page to clean Markdown", icon: GlobeIcon, available: true, viewId: "scrape" },
      { id: "map", label: "Map", description: "Site structure and link topology", icon: MapIcon, available: true, viewId: "map" },
      { id: "crawl", label: "Crawl", description: "Monitored multi-page crawl", icon: CrawlIcon, available: true, viewId: "crawl" },
      { id: "files", label: "Parse Files", description: "Prepare PDFs for processing", icon: UploadIcon, available: true, viewId: "files" }
    ]
  },
  {
    label: "Intelligence",
    items: [
      { id: "leadgen", label: "Lead Generation", description: "Extract emails, phones & socials", icon: UsersIcon, available: true, viewId: "leadgen" },
      { id: "extract", label: "Extract", description: "Structured JSON from a page", icon: SparkIcon, available: true, viewId: "extract" }
    ]
  }
];

export const VIEW_META: Record<ViewId, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Workspace",
    title: "Overview",
    description: "Your collection, inspection and export workspace, all in one place."
  },
  search: {
    eyebrow: "Playground",
    title: "Search",
    description: "Execute web search over live index to discover endpoints and content."
  },
  scrape: {
    eyebrow: "Playground",
    title: "Scrape",
    description: "Pull any public page into clean, readable Markdown in one request."
  },
  map: {
    eyebrow: "Playground",
    title: "Map",
    description: "Map site topology, sitemap links and endpoints."
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
  leadgen: {
    eyebrow: "Intelligence",
    title: "Lead Generation",
    description: "Parse emails, telephone numbers, and social media links from websites, PDFs, or raw text."
  },
  files: {
    eyebrow: "Playground",
    title: "Parse Files",
    description: "Add PDFs to your workspace for processing and review."
  }
};

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);
