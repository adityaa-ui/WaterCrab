'use strict';

/**
 * Single-page scrape: call browser-service, run Readability, convert to Markdown.
 * Shared by POST /scrape and the extraction pipeline so extraction does not
 * have to require the Express app (which would create a circular dependency).
 */

const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const TurndownService = require('turndown');

function browserServiceUrl() {
  return process.env.BROWSER_SERVICE_URL || 'http://localhost:3002';
}

// Headers for the internal browser-service call. Fails closed if the backend
// has not been configured with INTERNAL_TOKEN (never sends an unauthenticated
// request). The token is never logged or echoed to clients.
function internalAuthHeaders() {
  const token = process.env.INTERNAL_TOKEN;
  if (!token) {
    throw new Error('INTERNAL_TOKEN is not configured on the backend. Refusing to call browser-service.');
  }
  return {
    'Content-Type': 'application/json',
    'x-internal-token': token
  };
}

/**
 * Render `url` via browser-service and return cleaned markdown.
 * @param {string} url
 * @returns {Promise<{url: string, title: string, excerpt: string, markdown: string}>}
 */
async function performScrape(url) {
  const response = await fetch(`${browserServiceUrl()}/render`, {
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
    url,
    title: extractedTitle,
    excerpt,
    markdown,
    html  // needed by map.js for DOM link extraction
  };
}

module.exports = {
  performScrape,
  internalAuthHeaders
};
