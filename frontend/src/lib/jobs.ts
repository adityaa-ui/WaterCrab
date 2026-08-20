import type {
  CrawlJob,
  CrawlStatus,
  CreateCrawlResponse,
  JobStatusResponse
} from "./types";

export const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export function normalizeUrl(value: string): string {
  return /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
}

export function validateUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return "Please enter a URL.";

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return "That doesn't look like a valid URL.";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Only http(s) URLs are supported.";
  }
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    return "Please enter a complete URL, e.g. https://example.com.";
  }
  return null;
}

async function readJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(`Unexpected response (${res.status}).`);
  }
}


export function mapCrawlStatus(raw: string): CrawlStatus {
  const s = raw.toLowerCase();
  if (s === "completed") return "completed";
  if (s === "failed") return "failed";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "running" || s === "active") return "running";
  return "queued"; // pending / queued / unknown all map to queued
}

/** Create a crawl job and return its id. The backend remains authoritative. */
export async function createCrawlJob(
  url: string,
  maxPages: number,
  apiUrl: string = DEFAULT_API_URL
): Promise<string> {
  const res = await fetch(`${apiUrl}/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: normalizeUrl(url), maxPages })
  });
  const data = await readJson<CreateCrawlResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to start the crawl (${res.status}).`);
  }
  if (!data.jobId) {
    throw new Error("No job id was returned.");
  }
  return data.jobId;
}

/** Fetch a single crawl job by id. */
export async function fetchCrawlJob(
  id: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<CrawlJob> {
  const res = await fetch(`${apiUrl}/jobs/${encodeURIComponent(id)}`);
  const data = await readJson<JobStatusResponse>(res);
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to fetch job status (${res.status}).`);
  }
  if (!data.job) {
    throw new Error("Job details were missing from the response.");
  }
  return data.job;
}

export interface PollCrawlOptions {
  jobId: string;
  apiUrl?: string;
  /** Poll interval in milliseconds. */
  intervalMs?: number;
  /** Called on every successful poll with the latest job snapshot. */
  onJob: (job: CrawlJob) => void;
  /** Called once when the job reaches a terminal state (completed/failed/cancelled). */
  onTerminal: (job: CrawlJob) => void;
  /** Called when polling fails (network / server error). */
  onError: (error: Error) => void;
}

/**
 * Poll a crawl job until it reaches a terminal state. Prevents overlapping
 * requests and cleans up its interval. Returns a stop function for early
 * cancellation (e.g. component unmount).
 */
export function pollCrawlJob(opts: PollCrawlOptions): () => void {
  const intervalMs = opts.intervalMs ?? 1500;
  const apiUrl = opts.apiUrl ?? DEFAULT_API_URL;
  let stopped = false;
  let inflight = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const stop = () => {
    stopped = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const tick = async () => {
    if (stopped || inflight) return;
    inflight = true;
    try {
      const job = await fetchCrawlJob(opts.jobId, apiUrl);
      if (stopped) return;
      opts.onJob(job);

      const status = mapCrawlStatus(job.status);
      if (status === "completed" || status === "failed" || status === "cancelled") {
        stop();
        opts.onTerminal(job);
      }
    } catch (err) {
      if (stopped) return;
      stop();
      opts.onError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      inflight = false;
    }
  };

  timer = setInterval(tick, intervalMs);
  return stop;
}
