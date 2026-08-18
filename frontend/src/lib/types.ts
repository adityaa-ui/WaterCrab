// Shared result/job types used across the WaterCrab pipeline.
// Centralizing these avoids duplicated interfaces between components.

export type PipelineMode = "scrape" | "extract" | "crawl";

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
