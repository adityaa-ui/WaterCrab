'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const express = require('express');
const { createRouteLimiter } = require('../src/rate-limit');

let server;
let base;

before(async () => {
  const app = express();
  const limited = createRouteLimiter({ windowMs: 60000, limit: 3 });
  app.post('/scrape', limited, (req, res) => res.json({ success: true }));
  app.get('/jobs/:id', (req, res) => res.json({ success: true, job: {} }));

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test('allows requests under the limit, then returns 429 with the JSON envelope', async () => {
  let limitedResponse = null;
  for (let i = 0; i < 4; i += 1) {
    const res = await fetch(`${base}/scrape`, { method: 'POST' });
    if (i === 0) assert.strictEqual(res.status, 200, 'first request should pass');
    if (i === 3) limitedResponse = res;
  }

  assert.ok(limitedResponse, 'expected a 4th response');
  assert.strictEqual(limitedResponse.status, 429);
  const data = await limitedResponse.json();
  assert.strictEqual(data.success, false);
  assert.match(String(data.error), /too many requests/i);
});

test('emits standard rate-limit response headers', async () => {
  // draft-8 emits RateLimit and RateLimit-Policy (no RateLimit-Limit).
  const res = await fetch(`${base}/scrape`, { method: 'POST' });
  assert.ok(
    res.headers.get('ratelimit-policy') || res.headers.get('ratelimit'),
    'expected a standard RateLimit header'
  );
});

test('does not throttle an un-limited route', async () => {
  for (let i = 0; i < 5; i += 1) {
    const res = await fetch(`${base}/jobs/abc`, { method: 'GET' });
    assert.strictEqual(res.status, 200, `request ${i} should pass on the un-limited route`);
  }
});
