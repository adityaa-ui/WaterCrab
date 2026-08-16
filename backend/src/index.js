const express = require('express');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const TurndownService = require('turndown');
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('./db');
const { addCrawlJob } = require('./queue');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const BROWSER_SERVICE_URL = process.env.BROWSER_SERVICE_URL || 'http://localhost:3002';

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

// Core scraping function calling the browser-service
async function performScrape(url) {
  const response = await fetch(`${BROWSER_SERVICE_URL}/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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

// Extraction logic using OpenAI
async function extractWithOpenAI(markdown, schema, apiKey) {
  const openai = new OpenAI({ apiKey });
  
  const systemPrompt = `You are a precise data extraction assistant. Extract information from the provided markdown content according to this JSON Schema. You MUST respond with a valid JSON object matching the schema exactly.
  
  JSON Schema:
  ${JSON.stringify(schema, null, 2)}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: markdown }
    ],
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}

// Extraction logic using Anthropic
async function extractWithAnthropic(markdown, schema, apiKey) {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 4000,
    system: 'Extract structured data from the user input using the extract_data tool.',
    messages: [
      { role: 'user', content: markdown }
    ],
    tools: [
      {
        name: 'extract_data',
        description: 'Extract structured data matching the schema',
        input_schema: schema
      }
    ],
    tool_choice: { type: 'tool', name: 'extract_data' }
  });

  const toolUseBlock = response.content.find(block => block.type === 'tool_use' && block.name === 'extract_data');
  if (!toolUseBlock) {
    throw new Error('Anthropic did not invoke the extract_data tool.');
  }

  return toolUseBlock.input;
}

// POST /scrape endpoint
app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Missing "url" parameter in request body.'
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
app.post('/extract', async (req, res) => {
  const { url, schema, provider, apiKey } = req.body;

  if (!url || !schema || !provider || !apiKey) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters. Required: url, schema, provider, apiKey.'
    });
  }

  if (provider !== 'openai' && provider !== 'anthropic') {
    return res.status(400).json({
      success: false,
      error: 'Invalid provider. Must be "openai" or "anthropic".'
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

  try {
    console.log(`Scraping content for extraction: ${url}`);
    const scrapeResult = await performScrape(url);

    console.log(`Extracting structured data using provider: ${provider}`);
    let extractedData;
    if (provider === 'openai') {
      extractedData = await extractWithOpenAI(scrapeResult.markdown, schema, apiKey);
    } else {
      extractedData = await extractWithAnthropic(scrapeResult.markdown, schema, apiKey);
    }

    return res.json({
      success: true,
      data: extractedData
    });
  } catch (error) {
    const safeErrorMsg = redactString(error.message);
    console.error(`Extraction error for ${url}:`, safeErrorMsg);
    return res.status(500).json({
      success: false,
      error: `Extraction failed: ${safeErrorMsg}`
    });
  }
});

// POST /crawl endpoint (Queued multi-page scraping)
app.post('/crawl', async (req, res) => {
  const { url, maxPages } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: url.'
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
app.get('/jobs/:id', async (req, res) => {
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

// Start Express Server
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
