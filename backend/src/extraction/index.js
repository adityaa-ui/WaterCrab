'use strict';

/**
 * Main Extraction Service
 * Orchestrates: scrape (if URL) → prompt → provider → parse/validate → return
 * Reuses existing scrape pipeline when URL is provided.
 */

const { validateExtractionSchema } = require('../schema-validation');
const { validatePublicHttpUrl } = require('../ssrf');
const { performScrape } = require('../index');
const { buildExtractionPrompt, buildExtractionPromptFromMarkdown } = require('./prompt');
const { executeProvider } = require('./provider');
const { parseAndValidateResponse } = require('./response-parser');
const { validateInputSize, truncateContent, getLimitsConfig } = require('./limits');
const {
  ExtractionError,
  ValidationError,
  SchemaValidationError,
  ContentTooLargeError,
  ProviderError,
  ProviderTimeoutError,
  ProviderAuthError,
  ProviderRateLimitError,
  ProviderUnavailableError,
  MalformedResponseError,
  OutputValidationError
} = require('./errors');

const DEFAULT_PROVIDER = process.env.DEFAULT_EXTRACTION_PROVIDER || 'openai';
const DEFAULT_MODEL_OPENAI = process.env.DEFAULT_OPENAI_MODEL || 'gpt-4o-mini';
const DEFAULT_MODEL_ANTHROPIC = process.env.DEFAULT_ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

/**
 * Main extraction function.
 * Accepts either { url, schema, provider, apiKey, model } or { markdown, schema, provider, apiKey, model }
 * 
 * @param {object} params
 * @param {string} [params.url] - URL to scrape and extract from
 * @param {string} [params.markdown] - Pre-scraped markdown content
 * @param {object} params.schema - JSON schema for extraction
 * @param {string} [params.provider] - 'openai' | 'anthropic' | 'openai-compatible'
 * @param {string} [params.apiKey] - BYOK API key
 * @param {string} [params.model] - Model name (defaults per provider)
 * @param {string} [params.baseURL] - Custom base URL for OpenAI-compatible
 * @returns {object} { success: true, data, usage } or throws ExtractionError
 */
async function extract(params) {
  const { url, markdown, schema, provider, apiKey, model, baseURL } = params;
  
  // Validate required inputs
  if (!url && !markdown) {
    throw new ValidationError('Either url or markdown must be provided', 'MISSING_CONTENT_SOURCE');
  }
  if (url && markdown) {
    throw new ValidationError('Provide either url or markdown, not both', 'CONFLICTING_CONTENT_SOURCE');
  }
  if (!schema) {
    throw new ValidationError('Schema is required', 'MISSING_SCHEMA');
  }
  
  // Validate schema using existing validator
  const schemaValidation = validateExtractionSchema(schema);
  if (!schemaValidation.valid) {
    throw new SchemaValidationError(schemaValidation.error);
  }
  
  // Determine provider and model
  const resolvedProvider = provider || DEFAULT_PROVIDER;
  const resolvedModel = model || (resolvedProvider === 'anthropic' ? DEFAULT_MODEL_ANTHROPIC : DEFAULT_MODEL_OPENAI);
  
  if (!apiKey) {
    throw new ValidationError('API key is required for extraction', 'MISSING_API_KEY');
  }
  
  // Get content (either from URL scrape or direct markdown)
  let content;
  let sourceInfo = {};
  
  if (url) {
    // Validate URL (SSRF pre-check)
    const urlCheck = validatePublicHttpUrl(url);
    if (!urlCheck.ok) {
      throw new ValidationError(urlCheck.error, 'INVALID_URL', urlCheck.status);
    }
    
    // Perform scrape (reuses existing pipeline)
    console.log(`[Extraction] Scraping URL for extraction: ${url}`);
    const scrapeResult = await performScrape(url);
    content = scrapeResult.markdown;
    sourceInfo = { url: scrapeResult.url, title: scrapeResult.title };
    
    if (!content || content.trim() === '') {
      throw new ValidationError('Scraped content is empty', 'EMPTY_SCRAPED_CONTENT');
    }
  } else {
    content = markdown;
    sourceInfo = { source: 'markdown' };
  }
  
  // Validate input size
  const sizeCheck = validateInputSize({ content, schema });
  if (!sizeCheck.ok) {
    throw new ContentTooLargeError(sizeCheck.error);
  }
  
  // Build prompt
  const prompt = url 
    ? buildExtractionPrompt(content, schema)
    : buildExtractionPromptFromMarkdown(content, schema);
  
  // Truncate content if needed (handled in prompt builder, but double-check)
  const limits = getLimitsConfig();
  if (prompt.user.length > limits.maxInputChars * 2) {
    // This shouldn't happen with prompt truncation, but safeguard
    throw new ContentTooLargeError('Prompt exceeds maximum size after construction');
  }
  
  // Execute provider
  console.log(`[Extraction] Calling provider: ${resolvedProvider} (model: ${resolvedModel})`);
  const providerConfig = { apiKey, model: resolvedModel, baseURL };
  
  let providerResult;
  try {
    providerResult = await executeProvider(
      resolvedProvider,
      providerConfig,
      prompt,
      limits.maxOutputTokens,
      limits.requestTimeoutMs
    );
  } catch (error) {
    // Re-throw extraction errors as-is
    if (error instanceof ExtractionError) throw error;
    // Wrap unexpected errors
    throw new ProviderError(`Unexpected provider error: ${error.message}`, 'UNEXPECTED_PROVIDER_ERROR', 502);
  }
  
  // Parse and validate response
  console.log('[Extraction] Parsing and validating provider response');
  let extractedData;
  try {
    extractedData = parseAndValidateResponse(providerResult.content, schema);
  } catch (error) {
    if (error instanceof OutputValidationError || error instanceof MalformedResponseError) {
      throw error;
    }
    throw new OutputValidationError(`Response validation failed: ${error.message}`);
  }
  
  console.log('[Extraction] Extraction completed successfully');
  
  return {
    success: true,
    data: extractedData,
    usage: providerResult.usage,
    source: sourceInfo
  };
}

/**
 * Extract with pre-scraped content (for reusing scrape results).
 * Convenience wrapper.
 */
async function extractFromMarkdown({ markdown, schema, provider, apiKey, model, baseURL }) {
  return extract({ markdown, schema, provider, apiKey, model, baseURL });
}

module.exports = {
  extract,
  extractFromMarkdown,
  DEFAULT_PROVIDER,
  DEFAULT_MODEL_OPENAI,
  DEFAULT_MODEL_ANTHROPIC,
  // Re-export errors for route handler
  ExtractionError,
  ValidationError,
  SchemaValidationError,
  ContentTooLargeError,
  ProviderError,
  ProviderTimeoutError,
  ProviderAuthError,
  ProviderRateLimitError,
  ProviderUnavailableError,
  MalformedResponseError,
  OutputValidationError
};