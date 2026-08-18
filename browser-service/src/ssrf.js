'use strict';

/**
 * SSRF (Server-Side Request Forgery) protection for the browser-service.
 *
 * The /render endpoint fetches arbitrary URLs with a headless browser, so we
 * MUST NOT allow it to be used as an open proxy into internal/private networks.
 * This module:
 *   - restricts the URL scheme to http:/https:
 *   - rejects URLs with embedded credentials (userinfo)
 *   - blocks IP literals in private / loopback / link-local / CGNAT /
 *     reserved / multicast / metadata ranges (IPv4 and IPv6)
 *   - resolves hostnames and rejects them if ANY A/AAAA record resolves to a
 *     blocked address (DNS-based SSRF)
 *
 * Known residual limitation: Playwright performs its own DNS resolution for the
 * actual network connection, so a malicious host that flips its DNS answer
 * AFTER this check (a classic TOCTOU / DNS-rebinding race) cannot be fully
 * eliminated without replacing Playwright's resolver. This check still covers
 * the dominant vectors: the cloud metadata endpoint (169.254.169.254),
 * loopback, LAN ranges, link-local addresses, IPv6-mapped / NAT64 forms, and
 * redirect targets (validated again after navigation in src/index.js).
 *
 * Zero runtime dependencies: only Node built-ins are used.
 */

const net = require('node:net');
const dns = require('node:dns');
const dnsPromises = dns.promises;

// --- Forbidden IPv4 CIDR ranges [start, end] --------------------------------
const IPV4_RANGES = [
  ['0.0.0.0', '0.255.255.255'], // "this" network / unspecified
  ['10.0.0.0', '10.255.255.255'], // private
  ['100.64.0.0', '100.127.255.255'], // CGNAT
  ['127.0.0.0', '127.255.255.255'], // loopback
  ['169.254.0.0', '169.254.255.255'], // link-local (incl. AWS metadata 169.254.169.254)
  ['172.16.0.0', '172.31.255.255'], // private
  ['192.0.0.0', '192.0.0.255'], // IETF protocol assignments
  ['192.0.2.0', '192.0.2.255'], // TEST-NET-1
  ['192.168.0.0', '192.168.255.255'], // private
  ['198.18.0.0', '198.19.255.255'], // benchmarking
  ['198.51.100.0', '198.51.100.255'], // TEST-NET-2
  ['203.0.113.0', '203.0.113.255'], // TEST-NET-3
  ['224.0.0.0', '239.255.255.255'], // multicast
  ['240.0.0.0', '255.255.255.255'], // reserved
];

// --- Forbidden IPv6 CIDR ranges [start, end] --------------------------------
const IPV6_RANGES = [
  ['::', '::'], // unspecified
  ['::1', '::1'], // loopback
  ['fc00::', 'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'], // ULA
  ['fe80::', 'febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff'], // link-local
  ['ff00::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'], // multicast
  ['2001:db8::', '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff'], // documentation
];

function ipv4ToBigInt(ip) {
  const parts = ip.split('.');
  return (
    (BigInt(parts[0]) * 256n + BigInt(parts[1])) * 256n +
    BigInt(parts[2])
  ) * 256n + BigInt(parts[3]);
}

/**
 * Converts an IPv6 address (possibly an IPv4-mapped / IPv4-compatible form such
 * as ::ffff:127.0.0.1 or ::127.0.0.1) into a BigInt so range compares are easy.
 */
function ipv6ToBigInt(ip) {
  let v4Int = null;
  let addr = ip;

  // Handle embedded dotted-quad (IPv4-mapped / IPv4-compatible).
  if (addr.includes('.')) {
    const lastColon = addr.lastIndexOf(':');
    const v4 = addr.slice(lastColon + 1);
    v4Int = ipv4ToBigInt(v4);
    // Keep the prefix including the final ':' so '::ffff:' / '::' remain.
    addr = addr.slice(0, lastColon + 1);
  }

  let [head, tail] = addr.split('::');
  const headGroups = head ? head.split(':').filter(Boolean) : [];
  const tailGroups = tail ? tail.split(':').filter(Boolean) : [];

  let fillCount = 8 - headGroups.length - tailGroups.length;
  if (v4Int !== null) fillCount -= 2; // the embedded IPv4 occupies the last 2 groups

  const groups = [...headGroups];
  for (let i = 0; i < fillCount; i += 1) groups.push('0');
  groups.push(...tailGroups);

  if (v4Int !== null) {
    groups.push(((v4Int >> 16n) & 0xffffn).toString(16));
    groups.push((v4Int & 0xffffn).toString(16));
  }

  let value = 0n;
  for (const g of groups) {
    value = (value << 16n) | BigInt(parseInt(g || '0', 16));
  }
  return value;
}

const IPV4_RANGES_N = IPV4_RANGES.map(([s, e]) => [ipv4ToBigInt(s), ipv4ToBigInt(e)]);
const IPV6_RANGES_N = IPV6_RANGES.map(([s, e]) => [ipv6ToBigInt(s), ipv6ToBigInt(e)]);

function inRanges(value, ranges) {
  for (const [lo, hi] of ranges) {
    if (value >= lo && value <= hi) return true;
  }
  return false;
}

// IPv4-embedded IPv6 prefixes. The well-known NAT64 prefix is 64:ff9b::/96;
// IPv4-mapped is ::ffff:0:0/96; IPv4-compatible is ::/96. These are detected
// by decomposing the address into four 32-bit words (see isBlockedIp).

/**
 * Returns true if the given IP literal (family 4 or 6) is in a blocked range.
 * Anything that isn't a clean IPv4/IPv6 literal is treated as blocked (safe).
 */
function isBlockedIp(ip, family) {
  if (family === 4) return inRanges(ipv4ToBigInt(ip), IPV4_RANGES_N);
  if (family === 6) {
    const value = ipv6ToBigInt(ip);
    if (inRanges(value, IPV6_RANGES_N)) return true;
    // Decompose into four 32-bit words (word0 = most significant).
    const w = [];
    for (let i = 0; i < 4; i += 1) w.push((value >> BigInt((3 - i) * 32)) & 0xffffffffn);
    // Decode any IPv4 embedded in a NAT64 / IPv4-mapped / IPv4-compatible
    // address and re-check it against the IPv4 ranges, so that e.g.
    // ::ffff:127.0.0.1 or 64:ff9b::7f00:1 (embedding 127.0.0.1) are blocked.
    let embedded = null;
    if (w[0] === 0x0064ff9bn && w[1] === 0n && w[2] === 0n) embedded = w[3]; // NAT64
    else if (w[0] === 0n && w[1] === 0n && w[2] === 0x0000ffffn) embedded = w[3]; // IPv4-mapped
    else if (w[0] === 0n && w[1] === 0n && w[2] === 0n) embedded = w[3]; // IPv4-compatible
    if (embedded !== null && inRanges(embedded, IPV4_RANGES_N)) return true;
    return false;
  }
  return true; // unknown family -> block
}

/**
 * Validates a raw URL string for public http/https fetching.
 *
 * @param {string} rawUrl
 * @param {{ resolver?: Function }} [options] resolver defaults to
 *        dns.promises.lookup; injectable for hermetic tests.
 * @returns {Promise<{ok:boolean, status?:number, error?:string, hostname?:string}>}
 */
async function validatePublicUrl(rawUrl, { resolver = dnsPromises.lookup } = {}) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, status: 400, error: 'Invalid URL format.' };
  }

  const protocol = parsed.protocol;
  if (protocol !== 'http:' && protocol !== 'https:') {
    return {
      ok: false,
      status: 400,
      error: `Only http:// and https:// URLs are allowed (got "${protocol}//").`,
    };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, status: 400, error: 'URLs with embedded credentials are not allowed.' };
  }

  // WHATWG URL keeps IPv6 hostnames in brackets (e.g. "[::1]"), strip them.
  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }
  if (!hostname) {
    return { ok: false, status: 400, error: 'URL must include a hostname.' };
  }

  // Literal IP address -> check it directly (no DNS involved).
  const ipFamily = net.isIP(hostname);
  if (ipFamily !== 0) {
    if (isBlockedIp(hostname, ipFamily)) {
      return { ok: false, status: 403, error: 'Requested address is in a blocked/private range.' };
    }
    return { ok: true, hostname, literal: true };
  }

  // Hostname -> resolve every A/AAAA record; block if ANY is private/internal.
  try {
    const records = await resolver(hostname, { all: true, verbatim: true });
    if (!Array.isArray(records) || records.length === 0) {
      return { ok: false, status: 403, error: 'Host could not be resolved.' };
    }
    for (const record of records) {
      if (isBlockedIp(String(record.address), record.family)) {
        return {
          ok: false,
          status: 403,
          error: 'Host resolves to a blocked/private address.',
        };
      }
    }
    return { ok: true, hostname };
  } catch (err) {
    if (err && (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'EAI_AGAIN')) {
      return { ok: false, status: 403, error: 'Host could not be resolved.' };
    }
    return { ok: false, status: 500, error: 'DNS resolution failed.' };
  }
}

module.exports = { validatePublicUrl, isBlockedIp };
