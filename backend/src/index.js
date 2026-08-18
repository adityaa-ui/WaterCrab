const express = require('express');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const TurndownService = require('turndown');
const db = require('./db');
const { addCrawlJob } = require('./queue');
const { validatePublicHttpUrl } = require('./ssrf');
const { validateExtractionSchema } = require('./schema-validation');
const { createRouteLimiter } = require('./rate-limit');
const { extract, ExtractionError, ValidationError, SchemaValidationError, ContentTooLargeError, ProviderError, ProviderTimeoutError, ProviderAuthError, ProviderRateLimitError, ProviderUnavailableError, MalformedResponseError, OutputValidationError } = require('./extraction');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const BROWSER_SERVICE_URL = process.env.BROWSER_SERVICE_URL || 'http://localhost:3002';
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

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

// Headers for the internal browser-service call. Fails closed if the backend
// has not been configured with INTERNAL_TOKEN (never sends an unauthenticated
// request). The token is never logged or echoed to clients.
function internalAuthHeaders() {
  if (!INTERNAL_TOKEN) {
    throw new Error('INTERNAL_TOKEN is not configured on the backend. Refusing to call browser-service.');
  }
  return {
    'Content-Type': 'application/json',
    'x-internal-token': INTERNAL_TOKEN
  };
}

// Core scraping function calling the browser-service
async function performScrape(url) {
  const response = await fetch(`${BROWSER_SERVICE_URL}/render`, {
    method: 'POST',
    headers: internalAuthHeaders(),
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Browser service returned status code ${response.status}`);
  }

  const { html, title } = await response.json();

  // Parse HTML with jsdom & Readability
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  // Convert to Markdown
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  let markdown = '';
  let extractedTitle = title;
  let excerpt = '';

  if (article) {
    extractedTitle = article.title || title;
    excerpt = article.excerpt || '';
    markdown = turndownService.turndown(article.content);
  } else {
    const bodyHtml = dom.window.document.body ? dom.window.document.body.innerHTML : html;
    markdown = turndownService.turndown(bodyHtml);
  }

  return {
    title: extractedTitle,
    excerpt,
    markdown
  };
}

// Per-route rate limits (windowed per client IP). Values are configurable via
// env; defaults are deliberately non-aggressive because each request triggers a
// browser render and/or a BYOK LLM call.
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
    
    // Handle specific extraction errors
    if (error instanceof ValidationError) {
      return res.status(400).json({ success: false, error: safeErrorMsg, code: error.code });
    }
    if (error instanceof SchemaValidationError) {
      return res.status(400).json({ success: false, error: safeErrorMsg, code: 'SCHEMA_VALIDATION_ERROR' });
    }
    if (error instanceof ContentTooLargeError) {
      return res.status(413).json({ success: false, error: safeErrorMsg, code: 'CONTENT_TOO_LARGE' });
    }
    if (error instanceof ProviderAuthError) {
      return res.status(401).json({ success: false, error: safeErrorMsg, code: 'PROVIDER_AUTH_ERROR' });
    }
    if (error instanceof ProviderRateLimitError) {
      const retryAfter = error.retryAfter || 60;
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ success: false, error: safeErrorMsg, code: 'PROVIDER_RATE_LIMIT', retryAfter });
    }
    if (error instanceof ProviderTimeoutError) {
      return res.status(504).json({ success: false, error: safeErrorMsg, code: 'PROVIDER_TIMEOUT' });
    }
    if (error instanceof ProviderUnavailableError) {
      return res.status(503).json({ success: false, error: safeErrorMsg, code: 'PROVIDER_UNAVAILABLE' });
    }
    if (error instanceof MalformedResponseError) {
      return res.status(502).json({ success: false, error: safeErrorMsg, code: 'MALFORMED_RESPONSE' });
    }
    if (error instanceof OutputValidationError) {
      return res.status(422).json({ success: false, error: safeErrorMsg, code: 'OUTPUT_VALIDATION_ERROR', details: error.details });
    }
    if (error instanceof ProviderError) {
      return res.status(502).json({ success: false, error: safeErrorMsg, code: 'PROVIDER_ERROR' });
    }
    if (error instanceof ExtractionError) {
      return res.status(500).json({ success: false, error: safeErrorMsg, code: error.code || 'EXTRACTION_ERROR' });
    }
    
    // Unknown error
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
