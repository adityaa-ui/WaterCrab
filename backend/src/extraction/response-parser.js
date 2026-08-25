'use strict';

/**
 * Response parser and output validator for structured extraction.
 * Parses model output, validates JSON, validates against schema.
 */

const { OutputValidationError, MalformedResponseError } = require('./errors');

/**
 * Attempt to extract JSON from model response.
 * Handles markdown code fences, extra text, etc.
 */
function extractJsonFromResponse(content) {
  if (typeof content !== 'string' || content.trim() === '') {
    throw new MalformedResponseError('Response content is empty or not a string');
  }

  let trimmed = content.trim();
  if (trimmed.charCodeAt(0) === 0xFEFF) trimmed = trimmed.slice(1).trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Not direct JSON
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // Fall through
    }
  }

  const startObj = trimmed.indexOf('{');
  const startArr = trimmed.indexOf('[');
  let start = -1;
  if (startObj === -1) start = startArr;
  else if (startArr === -1) start = startObj;
  else start = Math.min(startObj, startArr);

  if (start !== -1) {
    try {
      return JSON.parse(trimmed.slice(start));
    } catch {
      // Fall through
    }
  }

  throw new MalformedResponseError('Could not parse valid JSON from provider response');
}

/**
 * Validates parsed data object against required fields in schema.
 */
function validateOutputAgainstSchema(data, schema) {
  if (!schema) return true;
  if (typeof data !== 'object' || data === null) {
    throw new OutputValidationError('Extracted data must be an object or array matching schema');
  }
  if (Array.isArray(schema.required)) {
    for (const req of schema.required) {
      if (!(req in data)) {
        throw new OutputValidationError(`Extracted data is missing required field: ${req}`);
      }
    }
  }
  return true;
}

/**
 * Combines extraction and schema validation.
 */
function parseAndValidateResponse(content, schema) {
  const data = extractJsonFromResponse(content);
  validateOutputAgainstSchema(data, schema);
  return data;
}

module.exports = {
  extractJsonFromResponse,
  validateOutputAgainstSchema,
  parseAndValidateResponse
};