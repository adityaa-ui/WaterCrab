const test = require('node:test');
const assert = require('node:assert');
const { parseLeads, extractEmails, extractPhones, extractSocials } = require('../src/lead-gen');

test('extractEmails extracts valid emails and ignores invalid false positives', () => {
  const sampleText = `
    Reach out to support@watercrab.dev or contact CEO john.doe@acme-corp.org.
    Please ignore image@2x.png and logo@3x.jpg and placeholder info@example.com.
    Also call us at sales@watercrab.dev!
  `;

  const emails = extractEmails(sampleText);
  const emailStrings = emails.map(e => e.email);

  assert.ok(emailStrings.includes('support@watercrab.dev'));
  assert.ok(emailStrings.includes('john.doe@acme-corp.org'));
  assert.ok(emailStrings.includes('sales@watercrab.dev'));
  assert.strictEqual(emailStrings.includes('image@2x.png'), false);
  assert.strictEqual(emailStrings.includes('info@example.com'), false);
});

test('extractPhones extracts formatted international and local phone numbers', () => {
  const sampleText = `
    Call US office at +1 (800) 555-0199 or 555-234-5678.
    India office: +91 98765 43210.
    Ignore date 2026-08-25 and screen dimensions 1920x1080.
  `;

  const phones = extractPhones(sampleText);
  const phoneNumbers = phones.map(p => p.phone);

  assert.ok(phoneNumbers.some(p => p.includes('800') || p.includes('555')));
  assert.ok(phoneNumbers.some(p => p.includes('98765')));
});

test('extractSocials extracts LinkedIn, Twitter/X, and GitHub handles', () => {
  const sampleText = `
    Follow us:
    LinkedIn: https://linkedin.com/company/watercrab
    Twitter: https://x.com/watercrab_io
    GitHub: https://github.com/adityaa-ui
  `;

  const socials = extractSocials(sampleText);
  assert.strictEqual(socials.length, 3);
  assert.ok(socials.some(s => s.platform === 'LinkedIn' && s.handle === '@watercrab'));
  assert.ok(socials.some(s => s.platform === 'Twitter / X' && s.handle === '@watercrab_io'));
  assert.ok(socials.some(s => s.platform === 'GitHub' && s.handle === '@adityaa-ui'));
});

test('parseLeads aggregates summary and lead arrays', () => {
  const sampleText = `
    Contact us at hello@acme.com or call +1 800-555-0199.
    LinkedIn: https://linkedin.com/in/johndoe
  `;

  const res = parseLeads(sampleText, { type: 'test', name: 'Sample' });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.summary.totalEmails, 1);
  assert.strictEqual(res.summary.totalPhones, 1);
  assert.strictEqual(res.summary.totalSocials, 1);
  assert.strictEqual(res.summary.totalLeads, 3);
});
