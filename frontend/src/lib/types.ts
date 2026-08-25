// Shared result/job types used across the WaterCrab pipeline.
// Centralizing these avoids duplicated interfaces between components.

export type PipelineMode = "search" | "scrape" | "map" | "crawl" | "extract" | "leadgen";

export interface EmailLead {
  email: string;
  user: string;
  domain: string;
  type: string;
}

export interface PhoneLead {
  phone: string;
  rawDigits: string;
  type: string;
}

export interface SocialLead {
  platform: string;
  url: string;
  handle: string;
}

export interface WebsiteLead {
  domain: string;
  url: string;
}

export interface LeadGenResponse {
  success: boolean;
  source?: {
    type: "website" | "file" | "text";
    name: string;
    domain?: string;
  };
  summary?: {
    totalEmails: number;
    totalPhones: number;
    totalSocials: number;
    totalWebsites: number;
    totalLeads: number;
  };
  leads?: {
    emails: EmailLead[];
    phones: PhoneLead[];
    socials: SocialLead[];
    websites: WebsiteLead[];
  };
  previewText?: string;
  error?: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain?: string;
}

export interface SearchResponse {
  success: boolean;
  query?: string;
  count?: number;
  results?: SearchResultItem[];
  error?: string;
}

export interface MapResultItem {
  url: string;
  path: string;
  title: string;
  status: string;
}

export interface MapResponse {
  success: boolean;
  url?: string;
  domain?: string;
  total?: number;
  links?: MapResultItem[];
  error?: string;
}

/** Client-facing crawl status, mapped from the backend's raw status string. */
export type CrawlStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface CrawlProgress {
  current: number;
  total: number;
}

export interface CrawlResultPage {
  url: string;
  title: string;
  markdown: string;
}

/**
 * A crawl job as returned by GET /jobs/:id. The `status` field is the raw
 * backend status (pending / active / completed / failed). Use
 * `mapCrawlStatus()` from lib/jobs to translate it to a `CrawlStatus`.
 */
export interface CrawlJob {
  id: string;
  status: string;
  progress?: CrawlProgress;
  results: CrawlResultPage[];
  error?: string | null;
  url?: string;
  maxPages?: number;
}

/** A successful single-page scrape result. */
export interface ScrapeData {
  url: string;
  title: string;
  excerpt?: string;
  markdown: string;
}

/** Payload returned by GET /jobs/:id. */
export interface JobStatusResponse {
  success: boolean;
  job?: CrawlJob;
  error?: string;
}

/** Payload returned by POST /crawl. */
export interface CreateCrawlResponse {
  success: boolean;
  jobId?: string;
  error?: string;
}

/** Payload returned by POST /scrape. */
export interface ScrapeResponse {
  success: boolean;
  url?: string;
  title?: string;
  excerpt?: string;
  markdown?: string;
  error?: string;
}

/** Payload returned by POST /extract. */
export interface ExtractResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}
