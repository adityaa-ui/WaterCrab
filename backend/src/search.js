const { JSDOM } = require('jsdom');

/**
 * Clean DuckDuckGo redirect URLs to get the actual target URL.
 * DDG uses links like /l/?uddg=https%3A%2F%2Fexample.com...
 */
function cleanSearchUrl(urlStr) {
  if (!urlStr) return '';
  try {
    if (urlStr.startsWith('//')) {
      urlStr = 'https:' + urlStr;
    }
    if (urlStr.startsWith('/l/?uddg=')) {
      const parsed = new URL('https://duckduckgo.com' + urlStr);
      const target = parsed.searchParams.get('uddg');
      if (target) return target;
    }
    const parsed = new URL(urlStr);
    const target = parsed.searchParams.get('uddg');
    return target || urlStr;
  } catch (e) {
    return urlStr;
  }
}

/**
 * Extract hostname for clean domain badge display.
 */
function extractDomain(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

/**
 * Perform web search over DuckDuckGo search HTML & JSON endpoints.
 */
async function performSearch(query, maxResults = 10) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    throw new Error('Query must be a non-empty string.');
  }

  const trimmedQuery = query.trim();
  const limit = Math.min(Math.max(parseInt(maxResults, 10) || 10, 1), 25);

  const results = [];

  // Attempt 1: Fetch DuckDuckGo HTML search results
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(trimmedQuery)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (response.ok) {
      const html = await response.text();
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      const resultElements = doc.querySelectorAll('.result, .web-result');

      resultElements.forEach((el, index) => {
        if (results.length >= limit) return;

        const titleEl = el.querySelector('.result__title, .result__a');
        const snippetEl = el.querySelector('.result__snippet');
        const urlEl = el.querySelector('.result__url, .result__a');

        if (titleEl) {
          const rawUrl = urlEl?.getAttribute('href') || titleEl.getAttribute('href') || '';
          const cleanUrl = cleanSearchUrl(rawUrl);
          const title = titleEl.textContent.trim();
          const snippet = snippetEl ? snippetEl.textContent.trim() : '';

          if (cleanUrl && title && !cleanUrl.includes('duckduckgo.com/y.js')) {
            results.push({
              id: `search-${index + 1}`,
              title,
              url: cleanUrl,
              snippet,
              domain: extractDomain(cleanUrl)
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn('[Search] HTML scraping search fallback:', err.message);
  }

  // Attempt 2: Fallback to DuckDuckGo API if HTML yields no results
  if (results.length === 0) {
    try {
      const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(trimmedQuery)}&format=json&no_html=1&no_redirect=1`;
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        
        if (data.AbstractURL && data.Heading) {
          results.push({
            id: 'search-abstract',
            title: data.Heading,
            url: data.AbstractURL,
            snippet: data.AbstractText || data.Abstract || '',
            domain: extractDomain(data.AbstractURL)
          });
        }

        if (Array.isArray(data.RelatedTopics)) {
          data.RelatedTopics.forEach((topic, idx) => {
            if (results.length >= limit) return;
            if (topic.FirstURL && topic.Text) {
              results.push({
                id: `search-topic-${idx + 1}`,
                title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 60),
                url: topic.FirstURL,
                snippet: topic.Text,
                domain: extractDomain(topic.FirstURL)
              });
            }
          });
        }
      }
    } catch (err) {
      console.warn('[Search] API search fallback failed:', err.message);
    }
  }

  // If query itself looks like a URL and no results found, generate a direct hit result
  if (results.length === 0 && /^https?:\/\//i.test(trimmedQuery)) {
    results.push({
      id: 'search-direct',
      title: trimmedQuery,
      url: trimmedQuery,
      snippet: `Direct link search result for ${trimmedQuery}`,
      domain: extractDomain(trimmedQuery)
    });
  }

  return {
    success: true,
    query: trimmedQuery,
    count: results.length,
    results
  };
}

module.exports = { performSearch };
