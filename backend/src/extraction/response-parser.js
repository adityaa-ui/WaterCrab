'use strict';

/**
 * Response parser and output validator for structured extraction.
 * Parses model output, validates JSON, validates against schema.
 * Never blindly trusts model output.
 */

const { validateExtractionSchema } = require('../schema-validation');
const { OutputValidationError, MalformedResponseError } = require('./errors');

/**
 * Attempt to extract JSON from model response.
 * Handles markdown code fences, extra text, etc.
 */
function extractJsonFromResponse(content) {
  if (!content || typeof content !== 'string') {
    throw new MalformedResponseError('Response content is empty or not a string');
  }
  
  const trimmed = content.trim();
  
  // Try direct JSON parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Not direct JSON, try to extract from markdown code fence
  }
  
  // Try to find JSON in markdown code fences ```json ... ```
  const jsonFenceMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
  if (jsonFenceMatch && jsonFenceMatch[1]) {
    try {
      return JSON.parse(jsonFenceMatch[1].trim());
    } catch {
      // Fall through
    }
  }
  
  // Try to find any JSON-like object in the response
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      // Fall through
    }
  }
  
  throw new MalformedResponseError('Could not parse valid JSON from provider response');
}

module.exports = {
  extractJsonFromResponse,
  validateOutputAgainstSchema,
  validateType,
  parseAndValidateResponse
};