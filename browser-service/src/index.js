const express = require('express');
const playwright = require('playwright');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

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

// POST /render endpoint
app.post('/render', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required "url" parameter in request body.'
    });
  }

  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL format.'
    });
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

    const html = await page.content();
    const title = await page.title();

    return res.json({
      success: true,
      title,
      html
    });

  } catch (error) {
    console.error(`[Browser Service] Rendering error for ${url}:`, error.message);
    return res.status(500).json({
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
