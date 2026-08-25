'use strict';

/**
 * Token/size limits and truncation for extraction pipeline.
 * Centralized to keep the extraction service predictable and configurable.
 */

const DEFAULT_MAX_INPUT_CHARS = 100000; // ~25k tokens for most models
const DEFAULT_MAX_SCHEMA_CHARS = 10000;
const DEFAULT_MAX_OUTPUT_TOKENS = 4096;
const DEFAULT_REQUEST_TIMEOUT_MS = 120000; // 2 minutes

/**
 * Rough character-to-token estimation (conservative).
 * 1 token ≈ 4 characters for English text.
 */
function estimateTokens(charCount) {
  return Math.ceil(charCount / 4);
}

/**
 * Truncates content to maxChars with a clear indicator.
 * Preserves beginning and end for context.
 */
function truncateContent(content, maxChars, label = 'content') {
  if (!content || content.length <= maxChars) return content;
  
  const half = Math.floor(maxChars / 2);
  const truncated = content.slice(0, half) + 
    `\n\n[... ${label} truncated: ${content.length} chars → ${maxChars} chars ...]\n\n` + 
    content.slice(-half);
  
  return truncated;
}

/**
 * Validates input size before sending to provider.
 */
function validateInputSize({ content, schema }, options = {}) {
  const maxInputChars = options.maxInputChars ?? DEFAULT_MAX_INPUT_CHARS;
  const maxSchemaChars = options.maxSchemaChars ?? DEFAULT_MAX_SCHEMA_CHARS;
  
  if (content && content.length > maxInputChars) {
    return {
      ok: false,
      error: `Input content too large: ${content.length} chars (max ${maxInputChars}). Consider a smaller page or more specific schema.`
    };
  }
  
  if (schema) {
    const schemaStr = JSON.stringify(schema);
    if (schemaStr.length > maxSchemaChars) {
      return {
        ok: false,
        error: `Schema too large: ${schemaStr.length} chars (max ${maxSchemaChars}).`
      };
    }
  }
  
  return { ok: true };
}

/**
 * Returns provider-agnostic limits configuration.
 */
function getLimitsConfig(overrides = {}) {
  return {
    maxInputChars: overrides.maxInputChars ?? DEFAULT_MAX_INPUT_CHARS,
    maxSchemaChars: overrides.maxSchemaChars ?? DEFAULT_MAX_SCHEMA_CHARS,
    maxOutputTokens: overrides.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    requestTimeoutMs: overrides.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
    estimateTokens
  };
}

module.exports = {
  DEFAULT_MAX_INPUT_CHARS,
  DEFAULT_MAX_SCHEMA_CHARS,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_REQUEST_TIMEOUT_MS,
  estimateTokens,
  truncateContent,
  validateInputSize,
  getLimitsConfig
};