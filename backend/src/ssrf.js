'use strict';

/**
 * Lightweight pre-checks for incoming scrape/extract/crawl URLs.
 *
 * The authoritative (DNS-resolution) SSRF guard lives in the browser-service
 * (src/ssrf.js) because that is where the actual fetch happens. This module
 * provides a cheap fail-fast scheme + userinfo + literal-IP-address check so the
 * backend returns a fast 400 and avoids forwarding obviously-bad URLs. It is
 * intentionally synchronous and does no DNS resolution (defense in depth only;
 * it must never be the only guard).
 */

const net = require('node:net');

const IPV4_RANGES = [
  ['0.0.0.0', '0.255.255.255'],
  ['10.0.0.0', '10.255.255.255'],
  ['100.64.0.0', '100.127.255.255'],
  ['127.0.0.0', '127.255.255.255'],
  ['169.254.0.0', '169.254.255.255'],
  ['172.16.0.0', '172.31.255.255'],
  ['192.0.0.0', '192.0.0.255'],
  ['192.0.2.0', '192.0.2.255'],
  ['192.168.0.0', '192.168.255.255'],
  ['198.18.0.0', '198.19.255.255'],
  ['198.51.100.0', '198.51.100.255'],
  ['203.0.113.0', '203.0.113.255'],
  ['224.0.0.0', '239.255.255.255'],
  ['240.0.0.0', '255.255.255.255'],
];

const IPV6_RANGES = [
  ['::', '::'],
  ['::1', '::1'],
  ['fc00::', 'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'],
  ['fe80::', 'febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff'],
  ['ff00::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'],
  ['2001:db8::', '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff'],
];

function ipv4ToBigInt(ip) {
  const p = ip.split('.');
  return (
    (BigInt(p[0]) * 256n + BigInt(p[1])) * 256n +
    BigInt(p[2])
  ) * 256n + BigInt(p[3]);
}

function ipv6ToBigInt(ip) {
  let v4Int = null;
  let addr = ip;
  if (addr.includes('.')) {
    const lastColon = addr.lastIndexOf(':');
    v4Int = ipv4ToBigInt(addr.slice(lastColon + 1));
    addr = addr.slice(0, lastColon + 1);
  }
  let [head, tail] = addr.split('::');
  const headGroups = head ? head.split(':').filter(Boolean) : [];
  const tailGroups = tail ? tail.split(':').filter(Boolean) : [];
  let fillCount = 8 - headGroups.length - tailGroups.length;
  if (v4Int !== null) fillCount -= 2;
  const groups = [...headGroups];
  for (let i = 0; i < fillCount; i += 1) groups.push('0');
  groups.push(...tailGroups);
  if (v4Int !== null) {
    groups.push(((v4Int >> 16n) & 0xffffn).toString(16));
    groups.push((v4Int & 0xffffn).toString(16));
  }
  let value = 0n;
  for (const g of groups) value = (value << 16n) | BigInt(parseInt(g || '0', 16));
  return value;
}

const IPV4_N = IPV4_RANGES.map(([s, e]) => [ipv4ToBigInt(s), ipv4ToBigInt(e)]);
const IPV6_N = IPV6_RANGES.map(([s, e]) => [ipv6ToBigInt(s), ipv6ToBigInt(e)]);

function isBlockedIp(ip, family) {
  const inRanges = (val, ranges) => ranges.some(([lo, hi]) => val >= lo && val <= hi);
  if (family === 4) return inRanges(ipv4ToBigInt(ip), IPV4_N);
  if (family === 6) {
    const value = ipv6ToBigInt(ip);
    if (inRanges(value, IPV6_N)) return true;
    // Decompose into four 32-bit words (word0 = most significant).
    const w = [];
    for (let i = 0; i < 4; i += 1) w.push((value >> BigInt((3 - i) * 32)) & 0xffffffffn);
    // Decode IPv4 embedded in NAT64 / IPv4-mapped / IPv4-compatible addresses.
    let embedded = null;
    if (w[0] === 0x0064ff9bn && w[1] === 0n && w[2] === 0n) embedded = w[3]; // NAT64
    else if (w[0] === 0n && w[1] === 0n && w[2] === 0x0000ffffn) embedded = w[3]; // IPv4-mapped
    else if (w[0] === 0n && w[1] === 0n && w[2] === 0n) embedded = w[3]; // IPv4-compatible
    if (embedded !== null && inRanges(embedded, IPV4_N)) return true;
    return false;
  }
  return true;
}

/**
 * Synchronous fail-fast pre-check used by the backend HTTP routes.
 * @param {string} rawUrl
 * @returns {{ok:boolean, status?:number, error?:string}}
 */
function validatePublicHttpUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, status: 400, error: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, status: 400, error: 'Only http:// and https:// URLs are allowed.' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, status: 400, error: 'URLs with embedded credentials are not allowed.' };
  }

  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith('[') && hostname.endsWith(']')) hostname = hostname.slice(1, -1);

  const ipFamily = net.isIP(hostname);
  if (ipFamily !== 0 && isBlockedIp(hostname, ipFamily)) {
    return { ok: false, status: 400, error: 'URLs pointing to private or internal addresses are not allowed.' };
  }

  return { ok: true };
}

module.exports = { validatePublicHttpUrl, isBlockedIp };
