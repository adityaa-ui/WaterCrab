const express = require('express');
const db = require('./db');
const { addCrawlJob } = require('./queue');
const { validatePublicHttpUrl } = require('./ssrf');
const { createRouteLimiter } = require('./rate-limit');
const { performScrape } = require('./scrape');
const { performSearch } = require('./search');
const { performMap } = require('./map');
const { extract, ExtractionError, ProviderRateLimitError, OutputValidationError } = require('./extraction');
const { parseLeads } = require('./lead-gen');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy headers. Local / docker-compose use no external proxy, so we
// default to trusting loopback. When deployed behind polyglot proxies that
// terminate TLS and inject X-Forwarded-For (e.g. some Render configurations),
// set TRUST_PROXY=1 (trust the first hop) so rate limiting keys by the real
// client IP instead of the proxy's. See the implementation summary for details.
const TRUST_PROXY = process.env.TRUST_PROXY;
app.set('trust proxy', TRUST_PROXY !== undefined ? TRUST_PROXY : 'loopback');

// Middleware
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Redaction Helpers for Security
function redactApiKey(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key === 'apiKey' || key === 'api_key' || key === 'authorization') {
        sanitized[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = redactApiKey(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  return sanitized;
}

function redactString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_KEY]')
    .replace(/sk-ant-[a-zA-Z0-9-]{20,}/g, '[REDACTED_KEY]');
}

// Request Logger (redacted)
app.use((req, res, next) => {
  const sanitizedBody = redactApiKey(req.body);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, sanitizedBody);
  next();
});

// Per-route rate limits (windowed per client IP). Values are configurable via
// env; defaults are deliberately non-aggressive because each request triggers a
// browser render and/or a BYOK LLM call.
const LIMITER_SEARCH = createRouteLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  limit: Number(process.env.RATE_LIMIT_SEARCH) || 60
});
const LIMITER_MAP = createRouteLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  limit: Number(process.env.RATE_LIMIT_MAP) || 30
});
const LIMITER_SCRAPE = createRouteLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  limit: Number(process.env.RATE_LIMIT_SCRAPE) || 60
});
const LIMITER_EXTRACT = createRouteLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  limit: Number(process.env.RATE_LIMIT_EXTRACT) || 30
});
const LIMITER_CRAWL = createRouteLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  limit: Number(process.env.RATE_LIMIT_CRAWL) || 10
});
const LIMITER_JOBS = createRouteLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  limit: Number(process.env.RATE_LIMIT_JOBS) || 120
});
const LIMITER_LEAD_GEN = createRouteLimiter({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  limit: Number(process.env.RATE_LIMIT_LEAD_GEN) || 60
});

// POST /search endpoint
app.post('/search', LIMITER_SEARCH, async (req, res) => {
  const { query, limit } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing required "query" string parameter in request body.'
    });
  }

  try {
    const data = await performSearch(query, limit);
    return res.json(data);
  } catch (error) {
    const safeErrorMsg = redactString(error.message);
    console.error(`Search error for "${query}":`, safeErrorMsg);
    return res.status(500).json({
      success: false,
      error: `Search failed: ${safeErrorMsg}`
    });
  }
});

// POST /map endpoint
app.post('/map', LIMITER_MAP, async (req, res) => {
  const { url, maxLinks } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required "url" parameter in request body.'
    });
  }

  const urlCheck = validatePublicHttpUrl(url);
  if (!urlCheck.ok) {
    return res.status(urlCheck.status).json({ success: false, error: urlCheck.error });
  }

  try {
    const data = await performMap(url, maxLinks);
    return res.json(data);
  } catch (error) {
    const safeErrorMsg = redactString(error.message);
    console.error(`Map error for ${url}:`, safeErrorMsg);
    return res.status(500).json({
      success: false,
      error: `Map failed: ${safeErrorMsg}`
    });
  }
});

// POST /scrape endpoint
app.post('/scrape', LIMITER_SCRAPE, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Missing "url" parameter in request body.'
    });
  }

  // Fail-fast scheme/URL pre-check (authoritative DNS check is in browser-service).
  const urlCheck = validatePublicHttpUrl(url);
  if (!urlCheck.ok) {
    return res.status(urlCheck.status).json({ success: false, error: urlCheck.error });
  }

  try {
    const data = await performScrape(url);
    return res.json({
      success: true,
      ...data
    });
  } catch (error) {
    const safeErrorMsg = redactString(error.message);
    console.error(`Scraping error for ${url}:`, safeErrorMsg);
    return res.status(500).json({
      success: false,
      error: `Failed to scrape page: ${safeErrorMsg}`
    });
  }
});

// POST /extract endpoint (BYOK)
app.post('/extract', LIMITER_EXTRACT, async (req, res) => {
  try {
    const result = await extract(req.body);
    
    return res.json(result);
  } catch (error) {
    const safeErrorMsg = redactString(error.message);
    console.error(`Extraction error:`, safeErrorMsg);

    if (error instanceof ExtractionError) {
      const body = { success: false, error: safeErrorMsg, code: error.code };
      if (error instanceof ProviderRateLimitError) {
        const retryAfter = error.retryAfter || 60;
        res.set('Retry-After', String(retryAfter));
        body.retryAfter = retryAfter;
      }
      if (error instanceof OutputValidationError && error.details) {
        body.details = error.details;
      }
      return res.status(error.statusCode || 500).json(body);
    }

    return res.status(500).json({ success: false, error: 'Extraction failed', code: 'INTERNAL_ERROR' });
  }
});

// POST /crawl endpoint (Queued multi-page scraping)
app.post('/crawl', LIMITER_CRAWL, async (req, res) => {
  const { url, maxPages } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: url.'
    });
  }

  // Fail-fast scheme/URL pre-check (authoritative DNS check is in browser-service).
  const urlCheck = validatePublicHttpUrl(url);
  if (!urlCheck.ok) {
    return res.status(urlCheck.status).json({ success: false, error: urlCheck.error });
  }

  let pagesLimit = parseInt(maxPages, 10);
  if (isNaN(pagesLimit) || pagesLimit < 1) {
    pagesLimit = 1;
  }
  pagesLimit = Math.min(pagesLimit, 15);

  try {
    console.log(`Queueing crawl job for URL: ${url} (maxPages: ${pagesLimit})`);
    const jobId = await addCrawlJob(url, pagesLimit);
    
    return res.json({
      success: true,
      jobId
    });
  } catch (error) {
    console.error(`Failed to queue crawl job for ${url}:`, error.message);
    return res.status(500).json({
      success: false,
      error: `Failed to queue crawl job: ${error.message}`
    });
  }
});

// GET /jobs/:id endpoint (Poll crawl status)
app.get('/jobs/:id', LIMITER_JOBS, async (req, res) => {
  const jobId = req.params.id;

  try {
    const job = await db.getJob(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job with ID ${jobId} not found.`
      });
    }

    return res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error(`Failed to fetch status for job ${jobId}:`, error.message);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch job status: ${error.message}`
    });
  }
});

// POST /lead-gen endpoint (Extract emails, phones, socials from website URL or uploaded file/text)
app.post('/lead-gen', LIMITER_LEAD_GEN, async (req, res) => {
  const { url, text, sourceType, fileName } = req.body;

  if (!url && (!text || typeof text !== 'string' || !text.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: provide either "url" or "text" in request body.'
    });
  }

  try {
    let contentToParse = text || '';
    let sourceMeta = {
      type: sourceType || (url ? 'website' : 'text'),
      name: fileName || url || 'Input Content',
      domain: ''
    };

    if (url) {
      const urlCheck = validatePublicHttpUrl(url);
      if (!urlCheck.ok) {
        return res.status(urlCheck.status).json({ success: false, error: urlCheck.error });
      }

      try {
        const hostname = new URL(url).hostname;
        sourceMeta.domain = hostname;
      } catch {
        // ignore invalid URL format for domain extraction
      }

      console.log(`Scraping webpage for lead generation: ${url}`);
      const scrapedData = await performScrape(url);
      contentToParse = `${scrapedData.title || ''}\n${scrapedData.excerpt || ''}\n${scrapedData.markdown || ''}`;
    }

    const leadResults = parseLeads(contentToParse, sourceMeta);
    return res.json(leadResults);
  } catch (error) {
    const safeErrorMsg = redactString(error.message);
    console.error(`Lead generation error:`, safeErrorMsg);
    return res.status(500).json({
      success: false,
      error: `Lead generation failed: ${safeErrorMsg}`
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

// Start Express server only when run directly (not when required by tests).
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`WaterCrab Backend listening on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received. Shutting down server...');
    server.close(async () => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
}

module.exports = app;
