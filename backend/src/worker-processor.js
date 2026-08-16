const db = require('./db');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const TurndownService = require('turndown');

const BROWSER_SERVICE_URL = process.env.BROWSER_SERVICE_URL || 'http://localhost:3002';

async function processCrawlTask(jobId, startUrl, maxPages) {
  const visited = new Set();
  const queue = [startUrl];
  const results = [];
  
  const startDomain = new URL(startUrl).hostname;
  let currentCount = 0;

  try {
    while (queue.length > 0 && currentCount < maxPages) {
      const url = queue.shift();
      const normalizedUrl = url.split('#')[0];
      
      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);
      
      currentCount++;
      console.log(`[Job ${jobId}] Crawling ${currentCount}/${maxPages}: ${normalizedUrl}`);
      
      // Update job state in DB with active status and progress
      await db.saveJob(jobId, {
        status: 'active',
        progress: { current: currentCount, total: maxPages }
      });

      try {
        // Fetch rendered page from browser-service
        const response = await fetch(`${BROWSER_SERVICE_URL}/render`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: normalizedUrl })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Browser service status ${response.status}`);
        }

        const { html, title } = await response.json();

        // Extract links and parse content using JSDOM
        const dom = new JSDOM(html, { url: normalizedUrl });
        
        // Extract links
        const pageLinks = Array.from(dom.window.document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(href => href && href.startsWith('http'));
        
        // Parse readability
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced'
        });
        
        let markdown = '';
        let extractedTitle = title;
        
        if (article) {
          extractedTitle = article.title || title;
          markdown = turndownService.turndown(article.content);
        } else {
          const bodyHtml = dom.window.document.body ? dom.window.document.body.innerHTML : html;
          markdown = turndownService.turndown(bodyHtml);
        }
        
        results.push({
          url: normalizedUrl,
          title: extractedTitle,
          markdown
        });
        
        // Save results incrementally
        await db.saveJob(jobId, { results });
        
        // Enqueue same-domain undiscovered links
        for (const link of pageLinks) {
          try {
            const linkUrl = new URL(link);
            const linkDomain = linkUrl.hostname;
            const linkNormalized = link.split('#')[0];
            if (linkDomain === startDomain && !visited.has(linkNormalized) && !queue.includes(linkNormalized)) {
              queue.push(linkNormalized);
            }
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      } catch (err) {
        console.error(`[Job ${jobId}] Failed to scrape page ${normalizedUrl}:`, err.message);
        if (normalizedUrl === startUrl) {
          throw new Error(`Failed to scrape start URL: ${err.message}`);
        }
      }
    }
    
    // Mark completed
    await db.saveJob(jobId, { status: 'completed' });
    
  } catch (error) {
    await db.saveJob(jobId, { status: 'failed', error: error.message });
    throw error;
  }
}

module.exports = {
  processCrawlTask
};
