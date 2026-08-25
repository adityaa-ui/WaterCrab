'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { validatePublicHttpUrl } = require('../src/ssrf');

test('accepts http/https URLs', () => {
  assert.strictEqual(validatePublicHttpUrl('http://example.com/').ok, true);
  assert.strictEqual(validatePublicHttpUrl('https://8.8.8.8/x').ok, true);
});

test('rejects non-http(s) schemes', () => {
  for (const u of ['file:///etc/passwd', 'ftp://a/b', 'data:text/html,hi', 'javascript:x', 'ssh://x']) {
    const r = validatePublicHttpUrl(u);
    assert.strictEqual(r.ok, false, u);
    assert.strictEqual(r.status, 400, u);
  }
});

test('rejects URLs with embedded credentials', () => {
  const r = validatePublicHttpUrl('http://user:pass@example.com/');
  assert.strictEqual(r.ok, false);
});

test('rejects private/literal IPs early', () => {
  for (const u of [
    'http://127.0.0.1/',
    'http://10.0.0.1/',
    'http://192.168.1.1/',
    'http://172.16.0.1/',
    'http://169.254.169.254/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[64:ff9b::7f00:1]/'
  ]) {
    const r = validatePublicHttpUrl(u);
    assert.strictEqual(r.ok, false, u);
  }
});

test('returns 400 for malformed URLs', () => {
  const r = validatePublicHttpUrl('not a url');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.status, 400);
});
