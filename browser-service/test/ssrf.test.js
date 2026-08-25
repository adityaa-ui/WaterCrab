'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { validatePublicUrl } = require('../src/ssrf');

// Fake DNS resolver that returns a fixed set of records. The validator calls
// resolver(hostname, { all: true, verbatim: true }) and expects a resolved
// array of { address, family }.
function resolverWith(records) {
  return async () => records;
}

function errResolver(code) {
  return async () => {
    const err = new Error(code);
    err.code = code;
    throw err;
  };
}

test('allows a public IPv4 literal', async () => {
  const r = await validatePublicUrl('http://8.8.8.8/page');
  assert.strictEqual(r.ok, true);
});

test('allows a public https hostname that resolves to a public IP', async () => {
  const r = await validatePublicUrl('https://example.com/', {
    resolver: resolverWith([{ address: '93.184.216.34', family: 4 }])
  });
  assert.strictEqual(r.ok, true);
});

test('rejects loopback IPv4 literals', async () => {
  for (const u of ['http://127.0.0.1/', 'http://localhost/']) {
    const r = await validatePublicUrl(u, {
      resolver: resolverWith([{ address: '127.0.0.1', family: 4 }])
    });
    assert.strictEqual(r.ok, false, u);
    assert.strictEqual(r.status, 403, u);
  }
});

test('rejects all private IPv4 ranges', async () => {
  const bad = [
    'http://10.1.2.3/',
    'http://100.64.0.1/',
    'http://172.16.0.1/',
    'http://172.31.255.255/',
    'http://192.168.1.1/',
    'http://169.254.169.254/', // cloud metadata
    'http://0.0.0.0/',
    'http://224.0.0.1/',
    'http://240.0.0.1/',
    'http://255.255.255.255/',
    'http://192.0.2.1/',
    'http://198.51.100.1/',
    'http://203.0.113.1/'
  ];
  for (const u of bad) {
    const r = await validatePublicUrl(u);
    assert.strictEqual(r.ok, false, u);
    assert.strictEqual(r.status, 403, u);
  }
});

test('rejects link-local and multicast IPv6', async () => {
  for (const u of ['http://[::1]/', 'http://[fe80::1]/', 'http://[ff02::1]/', 'http://[fd00::1]/']) {
    const r = await validatePublicUrl(u);
    assert.strictEqual(r.ok, false, u);
  }
});

test('rejects IPv4-mapped loopback (::ffff:127.0.0.1)', async () => {
  const r = await validatePublicUrl('http://[::ffff:127.0.0.1]/');
  assert.strictEqual(r.ok, false);
});

test('rejects NAT64-embedded private addresses (64:ff9b::7f00:1)', async () => {
  const r = await validatePublicUrl('http://[64:ff9b::7f00:1]/'); // 127.0.0.1
  assert.strictEqual(r.ok, false);
});

test('rejects a hostname that resolves to any private/blocked IP', async () => {
  const r = await validatePublicUrl('http://evil.example/', {
    resolver: resolverWith([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.5', family: 4 }
    ])
  });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 403);
});

test('rejects a hostname that resolves only to a blocked IP', async () => {
  const r = await validatePublicUrl('http://internal.corp/', {
    resolver: resolverWith([{ address: '192.168.50.9', family: 4 }])
  });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 403);
});

test('rejects non-http(s) schemes', async () => {
  const bad = [
    'file:///etc/passwd',
    'ftp://example.com/file',
    'data:text/html,hi',
    'javascript:alert(1)',
    'ws://example.com/socket',
    'ssh://example.com'
  ];
  for (const u of bad) {
    const r = await validatePublicUrl(u);
    assert.strictEqual(r.ok, false, u);
    assert.strictEqual(r.status, 400, u);
  }
});

test('rejects URLs with embedded credentials', async () => {
  const r = await validatePublicUrl('http://user:pass@example.com/');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 400);
});

test('rejects unresolvable hostnames', async () => {
  const r = await validatePublicUrl('http://no-such-host.invalid/', {
    resolver: errResolver('ENOTFOUND')
  });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 403);
});

test('returns 400 for malformed URLs', async () => {
  const r = await validatePublicUrl('not a url');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 400);
});

test('normalizes tricky numeric/IP spellings to blocked literals', async () => {
  // WHATWG URL normalizes these to 127.0.0.1 / 0.0.0.0, which must be caught.
  const tricky = ['http://2130706433/', 'http://0x7f000001/', 'http://0/'];
  for (const u of tricky) {
    const r = await validatePublicUrl(u);
    assert.strictEqual(r.ok, false, u);
    assert.strictEqual(r.status, 403, u);
  }
});
