const { JSDOM } = require('jsdom');
const { performScrape } = require('./scrape');

/**
 * Normalizes URL path for clean sitemap listing.
 */
function getUrlPath(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.pathname + parsed.search;
  } catch (e) {
    return urlStr;
  }
}

/**
 * Extracts links from sitemap.xml if available.
 */
async function fetchSitemapLinks(baseUrl, targetHost) {
  const links = new Set();
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const res = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WaterCrabMap/1.0' }
      });
      if (res.ok) {
        const text = await res.text();
        const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/gi;
        let match;
        while ((match = locRegex.exec(text)) !== null) {
          const loc = match[1].trim();
          try {
            const locHost = new URL(loc).hostname;
            if (locHost === targetHost || locHost.endsWith(`.${targetHost}`)) {
              links.add(loc);
            }
          } catch (e) {
            // ignore invalid url
          }
        }
      }
    } catch (e) {
      // sitemap not found or blocked
    }
  }

  return Array.from(links);
}

/**
 * Perform Site Mapping (sitemap + DOM link topology discovery).
 */
async function performMap(targetUrl, maxLinks = 50) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('Target URL is required.');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
  } catch (err) {
    throw new Error(`Invalid target URL: ${targetUrl}`);
  }

  const origin = parsedUrl.origin;
  const host = parsedUrl.hostname;
  const limit = Math.min(Math.max(parseInt(maxLinks, 10) || 50, 5), 200);

  const discoveredMap = new Map(); // url -> { url, path, title, status }

  // Always include seed URL
  discoveredMap.set(parsedUrl.href, {
    url: parsedUrl.href,
    path: getUrlPath(parsedUrl.href) || '/',
    title: host,
    status: 'discovered'
  });

  // Step 1: Scrape target page HTML to extract live <a> links and title
  try {
    const scrapeData = await performScrape(parsedUrl.href);
    if (scrapeData && scrapeData.html) {
      const dom = new JSDOM(scrapeData.html);
      const doc = dom.window.document;
      
      // Update seed title if available
      const pageTitle = scrapeData.title || doc.title || host;
      discoveredMap.set(parsedUrl.href, {
        url: parsedUrl.href,
        path: getUrlPath(parsedUrl.href) || '/',
        title: pageTitle,
        status: 'discovered'
      });

      const anchorEls = doc.querySelectorAll('a[href]');
      anchorEls.forEach((a) => {
        if (discoveredMap.size >= limit) return;
        const rawHref = a.getAttribute('href');
        if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) return;

        try {
          const resolved = new URL(rawHref, parsedUrl.href);
          if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
            // Keep links within the same domain or subdomain
            if (resolved.hostname === host || resolved.hostname.endsWith(`.${host}`)) {
              const cleanHref = resolved.origin + resolved.pathname + resolved.search;
              if (!discoveredMap.has(cleanHref)) {
                const linkTitle = a.textContent.trim() || getUrlPath(cleanHref);
                discoveredMap.set(cleanHref, {
                  url: cleanHref,
                  path: getUrlPath(cleanHref),
                  title: linkTitle.slice(0, 80),
                  status: 'discovered'
                });
              }
            }
          }
        } catch (e) {
          // ignore link parsing failure
        }
      });
    }
  } catch (err) {
    console.warn(`[Map] Scrape extraction warning for ${parsedUrl.href}:`, err.message);
  }

  // Step 2: If we still need more links, check sitemap.xml
  if (discoveredMap.size < limit) {
    try {
      const sitemapLinks = await fetchSitemapLinks(origin, host);
      for (const linkUrl of sitemapLinks) {
        if (discoveredMap.size >= limit) break;
        if (!discoveredMap.has(linkUrl)) {
          discoveredMap.set(linkUrl, {
            url: linkUrl,
            path: getUrlPath(linkUrl),
            title: getUrlPath(linkUrl),
            status: 'discovered'
          });
        }
      }
    } catch (err) {
      console.warn(`[Map] Sitemap fetch warning for ${origin}:`, err.message);
    }
  }

  const linksList = Array.from(discoveredMap.values());

  return {
    success: true,
    url: parsedUrl.href,
    domain: host,
    total: linksList.length,
    links: linksList
  };
}

module.exports = { performMap };
