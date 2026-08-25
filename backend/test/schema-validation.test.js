'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { validateExtractionSchema } = require('../src/schema-validation');

// The same shapes used by the existing product/article/custom templates must
// continue to pass so existing frontend/LLM behavior is preserved.
const VALID_SCHEMAS = [
  {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Product name' },
      price: { type: 'number' },
      inStock: { type: 'boolean' }
    },
    required: ['name']
  },
  {
    type: 'object',
    properties: {
      title: { type: 'string' },
      author: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } }
    }
  },
  {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'Custom key' }
    },
    required: ['key']
  },
  {
    type: 'object',
    properties: {
      metadata: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          active: { type: 'boolean' }
        }
      }
    }
  }
];

test('accepts valid schemas (incl. existing templates)', () => {
  for (const schema of VALID_SCHEMAS) {
    assert.strictEqual(validateExtractionSchema(schema).valid, true, JSON.stringify(schema));
  }
});

test('rejects non-object schemas', () => {
  for (const s of [null, undefined, 'nope', 42, ['array'], true]) {
    const r = validateExtractionSchema(s);
    assert.strictEqual(r.valid, false, String(s));
  }
});

test('rejects wrong root type', () => {
  const r = validateExtractionSchema({ type: 'string', properties: { a: { type: 'string' } } });
  assert.strictEqual(r.valid, false);
});

test('rejects malformed properties values', () => {
  assert.strictEqual(validateExtractionSchema({ type: 'object', properties: { a: 'string' } }).valid, false);
  assert.strictEqual(validateExtractionSchema({ type: 'object', properties: { a: { type: 'bogus' } } }).valid, false);
  assert.strictEqual(validateExtractionSchema({ type: 'object', properties: [] }).valid, false);
});

test('rejects a required field missing from properties', () => {
  const r = validateExtractionSchema({ type: 'object', properties: { a: { type: 'string' } }, required: ['b'] });
  assert.strictEqual(r.valid, false);
});

test('rejects non-string required entries', () => {
  const r = validateExtractionSchema({ type: 'object', properties: { a: { type: 'string' } }, required: [1] });
  assert.strictEqual(r.valid, false);
});

test('rejects prototype-pollution keys', () => {
  // JSON.parse creates "__proto__" as an own property (the real request path),
  // whereas a JS object literal would treat it as the prototype settler.
  const schema = JSON.parse('{"type":"object","properties":{"__proto__":{"type":"string"}}}');
  const r = validateExtractionSchema(schema);
  assert.strictEqual(r.valid, false);
});

test('rejects over-sized schemas', () => {
  const big = { type: 'object', properties: {} };
  for (let i = 0; i < 200; i += 1) big.properties[`p${i}`] = { type: 'string', description: 'x'.repeat(500) };
  const r = validateExtractionSchema(big);
  assert.strictEqual(r.valid, false);
});

test('rejects over-deep schemas', () => {
  let schema = { type: 'object' };
  let cursor = schema;
  for (let i = 0; i < 10; i += 1) {
    cursor.properties = { child: { type: 'object' } };
    cursor = cursor.properties.child;
  }
  assert.strictEqual(validateExtractionSchema(schema).valid, false);
});
