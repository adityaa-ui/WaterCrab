'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

// The app fails closed at startup if INTERNAL_TOKEN is unset, so set it before
// requiring the module. dotenv does not override already-set env vars.
process.env.INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || 'test-token-123';

const app = require('../src/index');

let server;
let base;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

async function postRender({ headers = {}, body = {} } = {}) {
  return fetch(`${base}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
}

test('rejects /render without a token (401)', async () => {
  const res = await postRender({ body: { url: 'http://example.com/' } });
  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('rejects /render with a wrong token (401)', async () => {
  const res = await postRender({
    headers: { 'x-internal-token': 'wrong-token' },
    body: { url: 'http://example.com/' }
  });
  assert.strictEqual(res.status, 401);
});

test('accepts token but blocks a private URL via SSRF (403) without launching a browser', async () => {
  const res = await postRender({
    headers: { 'x-internal-token': process.env.INTERNAL_TOKEN },
    body: { url: 'http://127.0.0.1/' }
  });
  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.strictEqual(data.success, false);
});

test('accepts token but rejects a non-http scheme (400)', async () => {
  const res = await postRender({
    headers: { 'x-internal-token': process.env.INTERNAL_TOKEN },
    body: { url: 'file:///etc/passwd' }
  });
  assert.strictEqual(res.status, 400);
});
