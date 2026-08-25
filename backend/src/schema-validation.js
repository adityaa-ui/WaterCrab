'use strict';

/**
 * Validation for the JSON schema accepted by POST /extract.
 *
 * Hand-rolled (zero dependencies) to keep the dependency set minimal while
 * preventing malformed or abusive schema input from being sent to the LLM.
 * Preserves the shape used by the existing product/article/custom templates.
 */

const ALLOWED_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'object', 'array']);
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_PROPERTIES = 50;
const MAX_DEPTH = 5;
const MAX_SCHEMA_LENGTH = 20000;

function validateExtractionSchema(schema) {
  if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) {
    return { valid: false, error: 'Schema must be a JSON object.' };
  }

  let serialized;
  try {
    serialized = JSON.stringify(schema);
  } catch {
    return { valid: false, error: 'Schema is not valid JSON.' };
  }
  if (serialized.length > MAX_SCHEMA_LENGTH) {
    return { valid: false, error: `Schema is too large (max ${MAX_SCHEMA_LENGTH} bytes).` };
  }

  const error = checkObjectNode(schema, 'schema', 0);
  if (error) return { valid: false, error };
  return { valid: true };
}

// Validates an object-typed JSON Schema node (the root or a nested object).
function checkObjectNode(node, path, depth) {
  if (depth > MAX_DEPTH) {
    return `Schema is nested too deeply at ${path} (max depth ${MAX_DEPTH}).`;
  }
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    return `Schema field at ${path} must be an object.`;
  }

  for (const key of Object.keys(node)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return `Forbidden schema key "${key}" at ${path}.`;
    }
  }

  if (node.type !== undefined && node.type !== 'object') {
    return `Schema type at ${path} must be "object".`;
  }

  if (node.properties !== undefined) {
    if (node.properties === null || typeof node.properties !== 'object' || Array.isArray(node.properties)) {
      return `Schema "properties" at ${path} must be an object.`;
    }
    const keys = Object.keys(node.properties);
    if (keys.length > MAX_PROPERTIES) {
      return `Schema has too many properties (max ${MAX_PROPERTIES}) at ${path}.`;
    }
    for (const key of keys) {
      if (FORBIDDEN_KEYS.has(key)) {
        return `Forbidden schema key "${key}" at ${path}.`;
      }
      const propErr = validateProperty(node.properties[key], `${path}.properties.${key}`, depth + 1);
      if (propErr) return propErr;
    }
  }

  if (node.required !== undefined) {
    if (!Array.isArray(node.required)) {
      return `Schema "required" at ${path} must be an array.`;
    }
    for (const r of node.required) {
      if (typeof r !== 'string') {
        return `Schema "required" entries must be strings at ${path}.`;
      }
    }
    if (node.properties) {
      for (const r of node.required) {
        if (!Object.prototype.hasOwnProperty.call(node.properties, r)) {
          return `Required field "${r}" is missing from properties at ${path}.`;
        }
      }
    }
  }

  return null;
}

// Validates a single property definition (leaf, array, or nested object).
function validateProperty(prop, path, depth) {
  if (prop === null || typeof prop !== 'object' || Array.isArray(prop)) {
    return `Schema property at ${path} must be an object.`;
  }
  for (const key of Object.keys(prop)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return `Forbidden schema key "${key}" at ${path}.`;
    }
  }

  const type = prop.type;
  if (type !== undefined && !ALLOWED_TYPES.has(type)) {
    return `Invalid property type "${String(type)}" at ${path}.`;
  }
  if (prop.description !== undefined && typeof prop.description !== 'string') {
    return `Schema description at ${path} must be a string.`;
  }

  if (type === 'array') {
    if (prop.items !== undefined) {
      const itemsErr = validateProperty(prop.items, `${path}.items`, depth + 1);
      if (itemsErr) return itemsErr;
    }
  } else if (type === 'object' && prop.properties !== undefined) {
    const nestedErr = checkObjectNode(prop, path, depth + 1);
    if (nestedErr) return nestedErr;
  }

  return null;
}

module.exports = { validateExtractionSchema };
