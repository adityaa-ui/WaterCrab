const { Queue } = require('bullmq');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const REDIS_URL = process.env.REDIS_URL;
let crawlQueue = null;

if (REDIS_URL) {
  crawlQueue = new Queue('crawl-queue', {
    connection: {
      url: REDIS_URL
    }
  });
}

// In-memory queue state (fallback)
const pendingLocalJobs = [];
let localWorkerRunning = false;

async function processLocalQueue() {
  if (localWorkerRunning) return;
  localWorkerRunning = true;

  const { processCrawlTask } = require('./worker-processor');

  while (pendingLocalJobs.length > 0) {
    const { jobId, url, maxPages } = pendingLocalJobs.shift();
    
    try {
      console.log(`[Local Queue Worker] Starting job ${jobId} for URL ${url}`);
      await processCrawlTask(jobId, url, maxPages);
      console.log(`[Local Queue Worker] Completed job ${jobId}`);
    } catch (err) {
      console.error(`[Local Queue Worker] Failed job ${jobId}:`, err.message);
    }
  }

  localWorkerRunning = false;
}

async function addCrawlJob(url, maxPages) {
  const jobId = `job-${uuidv4()}`;
  const jobData = {
    id: jobId,
    status: 'pending',
    progress: { current: 0, total: maxPages },
    results: [],
    error: null,
    url,
    maxPages
  };

  // Save initial status to DB
  await db.saveJob(jobId, jobData);

  if (crawlQueue) {
    // BullMQ enqueue
    await crawlQueue.add('crawl', { url, maxPages }, { jobId });
    console.log(`Enqueued job ${jobId} to BullMQ`);
  } else {
    // Local memory enqueue
    pendingLocalJobs.push({ jobId, url, maxPages });
    console.log(`Enqueued job ${jobId} to local fallback queue`);
    // Run local worker asynchronously
    processLocalQueue().catch(err => console.error('Local worker error:', err));
  }

  return jobId;
}

module.exports = {
  addCrawlJob
};
