/**
 * Lead Generation Extractor Module for WaterCrab
 * Parses emails, phone numbers, social media links, and domain links from raw text, HTML, or scraped page content.
 */

// Common false positive extensions or placeholder domains to filter out
const FILTER_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot|mp4|webm|pdf)$/i;
const PLACEHOLDER_EMAILS = /^(example|domain|yourname|username|email|test|sample|admin@localhost|info@example\.com)/i;

/**
 * Clean trailing punctuation from a matched string (like trailing dots, commas, parens)
 */
function cleanPunctuation(str) {
  return str.replace(/[.,;:)\s]+$/, '').replace(/^[(<\s]+/, '');
}

/**
 * Extract email addresses from text with strict filtering & deduplication
 */
function extractEmails(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const rawMatches = text.match(emailRegex) || [];
  const emailsMap = new Map();

  for (const raw of rawMatches) {
    const cleaned = cleanPunctuation(raw).toLowerCase();
    if (FILTER_EXTENSIONS.test(cleaned)) continue;
    if (PLACEHOLDER_EMAILS.test(cleaned)) continue;
    if (cleaned.length < 5 || cleaned.length > 100) continue;

    const parts = cleaned.split('@');
    if (parts.length !== 2) continue;
    const [user, domain] = parts;
    if (!domain.includes('.')) continue;

    if (!emailsMap.has(cleaned)) {
      // Categorize email type hint
      let type = 'General';
      if (/^(support|help|info|contact|sales|hello|office|admin|team|billing|press|media)/i.test(user)) {
        type = 'Company / Department';
      } else if (/^(ceo|founder|cto|cfo|director|manager|vp|head|president)/i.test(user)) {
        type = 'Executive / Management';
      } else {
        type = 'Direct / Personal';
      }

      emailsMap.set(cleaned, {
        email: cleaned,
        user,
        domain,
        type
      });
    }
  }

  return Array.from(emailsMap.values());
}

/**
 * Extract phone numbers from text using multi-pattern detection
 */
function extractPhones(text) {
  // Regex pattern matching common international, US, UK, EU, Indian, and E.164 phone formats
  const phoneRegexes = [
    // International with + prefix: e.g. +1 800-555-0199, +91 9876543210, +44 (0)20 7946 0912
    /\+(?:[0-9][\s.-]?){8,15}\b/g,
    // Standard US/North American: (555) 019-2834, 555-019-2834, 1-800-555-0199
    /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    // Indian 10-digit mobile/landline with optional +91 or 0 prefix: +91-98765-43210, 09876543210
    /(?:\+?91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}\b/g,
    // General formatted phone: 3-4 digits, separator, 3-4 digits, separator, 3-4 digits
    /\b\d{3,4}[\s.-]\d{3,4}[\s.-]\d{3,4}\b/g
  ];

  const phonesMap = new Map();

  for (const regex of phoneRegexes) {
    const matches = text.match(regex) || [];
    for (const raw of matches) {
      const cleaned = cleanPunctuation(raw);
      // Remove all non-digit characters to check digit count
      const digitsOnly = cleaned.replace(/\D/g, '');

      // Valid phone length filter (between 7 and 15 digits)
      if (digitsOnly.length < 7 || digitsOnly.length > 15) continue;

      // Filter out dates (e.g. 20260825, 2026-08-25), timestamps, dimensions (1920x1080), zip code repetitions
      if (/^(19|20)\d{6}$/.test(digitsOnly)) continue; // Date YYYYMMDD
      if (/^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/.test(digitsOnly)) continue;
      if (/^(00000|11111|12345|99999)/.test(digitsOnly)) continue;

      // Format canonical phone key (deduplicate international vs national prefix by last 10 digits)
      const canonKey = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
      if (!phonesMap.has(canonKey)) {
        let type = 'Phone';
        if (cleaned.startsWith('+1') || digitsOnly.length === 10) type = 'Mobile / Office';
        if (cleaned.startsWith('+91')) type = 'India Telecom';
        if (cleaned.startsWith('+44')) type = 'UK Telecom';
        if (/800|888|877|866/.test(digitsOnly)) type = 'Toll-Free';

        phonesMap.set(canonKey, {
          phone: cleaned,
          rawDigits: digitsOnly,
          type
        });
      } else {
        const existing = phonesMap.get(canonKey);
        if (cleaned.startsWith('+') && !existing.phone.startsWith('+')) {
          phonesMap.set(canonKey, {
            phone: cleaned,
            rawDigits: digitsOnly,
            type: existing.type
          });
        }
      }
    }
  }

  return Array.from(phonesMap.values());
}

/**
 * Extract social media profiles and handles from text
 */
function extractSocials(text) {
  const socialsMap = new Map();

  const platforms = [
    { name: 'LinkedIn', regex: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company|school)\/([a-zA-Z0-9_-]+)\/?/gi },
    { name: 'Twitter / X', regex: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,30})\/?/gi },
    { name: 'GitHub', regex: /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/?/gi },
    { name: 'Facebook', regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:pages\/)?([a-zA-Z0-9._-]+)\/?/gi },
    { name: 'Instagram', regex: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._-]+)\/?/gi },
    { name: 'YouTube', regex: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|c\/|channel\/)?([a-zA-Z0-9._-]+)\/?/gi },
    { name: 'WhatsApp', regex: /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com\/send\?phone=)(\+?[0-9]+)/gi },
    { name: 'Telegram', regex: /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/?/gi }
  ];

  for (const p of platforms) {
    let match;
    p.regex.lastIndex = 0; // Reset stateful regex
    while ((match = p.regex.exec(text)) !== null) {
      const fullUrl = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
      const handle = match[1] || '';
      
      // Skip generic endpoints
      if (['sharing', 'intent', 'sharer', 'home', 'login', 'signup', 'about', 'help', 'terms', 'privacy'].includes(handle.toLowerCase())) {
        continue;
      }

      const key = `${p.name}:${handle.toLowerCase()}`;
      if (!socialsMap.has(key)) {
        socialsMap.set(key, {
          platform: p.name,
          url: cleanPunctuation(fullUrl),
          handle: handle ? `@${handle.replace(/^@/, '')}` : handle
        });
      }
    }
  }

  return Array.from(socialsMap.values());
}

/**
 * Extract website domain links mentioned in content
 */
function extractWebsites(text, sourceDomain = '') {
  const urlRegex = /(?:https?:\/\/)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s"<>]*)?/gi;
  const matches = text.match(urlRegex) || [];
  const sitesMap = new Map();

  for (const raw of matches) {
    const cleaned = cleanPunctuation(raw);
    try {
      const parsedUrl = new URL(cleaned);
      const host = parsedUrl.hostname.replace(/^www\./, '');

      // Skip common static asset CDNs or source domain
      if (/gstatic|googleapis|cloudflare|fontawesome|unpkg|jsdelivr|w3\.org/i.test(host)) continue;
      if (sourceDomain && host === sourceDomain) continue;

      if (!sitesMap.has(host)) {
        sitesMap.set(host, {
          domain: host,
          url: parsedUrl.origin
        });
      }
    } catch {
      // Ignore malformed URLs
    }
  }

  return Array.from(sitesMap.values()).slice(0, 15);
}

/**
 * Main lead generation parser entry point
 */
function parseLeads(content, sourceInfo = { type: 'text', name: 'Raw Input' }) {
  const safeText = typeof content === 'string' ? content : '';

  const emails = extractEmails(safeText);
  const phones = extractPhones(safeText);
  const socials = extractSocials(safeText);
  const websites = extractWebsites(safeText, sourceInfo.domain || '');

  return {
    success: true,
    source: sourceInfo,
    summary: {
      totalEmails: emails.length,
      totalPhones: phones.length,
      totalSocials: socials.length,
      totalWebsites: websites.length,
      totalLeads: emails.length + phones.length + socials.length
    },
    leads: {
      emails,
      phones,
      socials,
      websites
    },
    previewText: safeText.slice(0, 300)
  };
}

module.exports = {
  parseLeads,
  extractEmails,
  extractPhones,
  extractSocials,
  extractWebsites
};
