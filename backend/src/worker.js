const { Worker } = require('bullmq');
const { processCrawlTask } = require('./worker-processor');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.log('Worker skipped initialization: REDIS_URL environment variable is not defined.');
  // Exit gracefully in local dev when no Redis is running
  process.exit(0);
}

console.log(`Starting BullMQ worker connecting to Redis: ${REDIS_URL}`);

const worker = new Worker('crawl-queue', async (job) => {
  const { url, maxPages } = job.data;
  const jobId = job.opts.jobId || job.id;
  console.log(`[Worker] Picked up job ${jobId} for URL ${url}`);
  
  await processCrawlTask(jobId, url, maxPages);
}, {
  connection: {
    url: REDIS_URL
  },
  concurrency: 2 // Allow concurrent crawling tasks
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} failed:`, err.message);
});

// Graceful worker close on shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Worker closing...');
  await worker.close();
  process.exit(0);
});
