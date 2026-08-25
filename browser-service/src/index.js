const express = require('express');
const playwright = require('playwright');
const crypto = require('node:crypto');
require('dotenv').config();
const { validatePublicUrl } = require('./ssrf');

const app = express();
const PORT = process.env.PORT || 3002;

// Internal token used to authenticate server-to-server /render calls from the
// backend. MUST be set via the environment (never hardcoded). We fail closed at
// startup rather than silently running with no authentication.
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
if (!INTERNAL_TOKEN) {
  console.error(
    '[Browser Service] INTERNAL_TOKEN environment variable is not set. Refusing to start for security.'
  );
  process.exit(1);
}

app.use(express.json());

// Constant-time comparison of the internal token (length-guarded).
function tokensEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Restrict /render to the backend only.
function requireInternalToken(req, res, next) {
  const provided = req.get('x-internal-token') || '';
  if (!tokensEqual(provided, INTERNAL_TOKEN)) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }
  return next();
}

// Share browser instance
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    console.log('Launching Playwright Chromium browser...');
    browserInstance = await playwright.chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browserInstance;
}

// POST /render endpoint (protected by internal token + SSRF checks)
app.post('/render', requireInternalToken, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required "url" parameter in request body.'
    });
  }

  // SSRF: scheme + userinfo + literal-IP + DNS-resolution checks.
  const check = await validatePublicUrl(url);
  if (!check.ok) {
    return res.status(check.status).json({ success: false, error: check.error });
  }

  let context = null;
  let page = null;

  try {
    const browser = await getBrowser();
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    
    console.log(`[Browser Service] Rendering: ${url}`);
    
    // Go to URL and wait for domcontentloaded
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Post-navigation SSRF re-check: if the page redirected to a private,
    // loopback, or otherwise blocked address, abort instead of scraping it.
    const finalUrl = page.url();
    if (finalUrl && finalUrl !== 'about:blank') {
      const post = await validatePublicUrl(finalUrl);
      if (!post.ok) {
        const redirectError = new Error(
          `Page redirected to a blocked/private address: ${post.error}`
        );
        redirectError.status = post.status;
        throw redirectError;
      }
    }

    const html = await page.content();
    const title = await page.title();

    return res.json({
      success: true,
      title,
      html
    });

  } catch (error) {
    console.error(`[Browser Service] Rendering error for ${url}:`, error.message);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: `Failed to render page: ${error.message}`
    });
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'browser-service' });
});

// Start server only when run directly (not when required by tests).
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`WaterCrab Browser Service listening on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received. Closing browser service...');
    server.close(async () => {
      if (browserInstance) {
        await browserInstance.close().catch(() => {});
      }
      console.log('Browser service closed.');
      process.exit(0);
    });
  });
}

module.exports = app;
