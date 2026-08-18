'use strict';

/**
 * Provider abstraction for LLM extraction.
 * Supports OpenAI, Anthropic, and OpenAI-compatible endpoints.
 * Each provider implements a common interface.
 */

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { ProviderError, ProviderTimeoutError, ProviderAuthError, ProviderRateLimitError, ProviderUnavailableError } = require('./errors');

/**
 * Build provider-specific client configuration.
 * @param {string} provider - 'openai' | 'anthropic' | 'openai-compatible'
 * @param {object} config - { apiKey, baseURL, model }
 * @returns {object} Initialized client
 */
function createProviderClient(provider, config) {
  const { apiKey, baseURL, model } = config;
  
  switch (provider) {
    case 'openai':
      return new OpenAI({
        apiKey,
        baseURL: baseURL || undefined,
        timeout: 120000,
        maxRetries: 0 // We handle retries/timeouts ourselves
      });
      
    case 'anthropic':
      return new Anthropic({
        apiKey,
        baseURL: baseURL || undefined,
        timeout: 120000,
        maxRetries: 0
      });
      
    case 'openai-compatible':
      // Generic OpenAI-compatible endpoint (e.g., OpenRouter, local vLLM)
      return new OpenAI({
        apiKey,
        baseURL: baseURL || 'https://openrouter.ai/api/v1',
        timeout: 120000,
        maxRetries: 0
      });
      
    default:
      throw new ProviderError(`Unsupported provider: ${provider}`, 'UNSUPPORTED_PROVIDER', 400);
  }
}

/**
 * Execute extraction with OpenAI-compatible API (OpenAI, OpenRouter, etc.)
 */
async function extractWithOpenAICompatible(client, model, prompt, maxOutputTokens) {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user }
    ],
    temperature: 0,
    max_tokens: maxOutputTokens,
    response_format: { type: 'json_object' }
  });
  
  const content = response.choices[0]?.message?.content;
  const usage = response.usage;
  
  return {
    content,
    usage: usage ? {
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens
    } : undefined
  };
}

/**
 * Execute extraction with Anthropic API.
 */
async function extractWithAnthropic(client, model, prompt, maxOutputTokens) {
  const response = await client.messages.create({
    model,
    max_tokens: maxOutputTokens,
    temperature: 0,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }]
  });
  
  // Anthropic returns content as array of blocks
  const contentBlock = response.content.find(b => b.type === 'text');
  const content = contentBlock?.text || '';
  
  return {
    content,
    usage: response.usage ? {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens
    } : undefined
  };
}

/**
 * Main provider execution - routes to correct provider implementation.
 * Handles provider-specific errors and normalizes them.
 * 
 * @param {string} provider - 'openai' | 'anthropic' | 'openai-compatible'
 * @param {object} config - { apiKey, baseURL, model }
 * @param {object} prompt - { system, user }
 * @param {number} maxOutputTokens
 * @param {number} timeoutMs
 * @returns {object} { content, usage }
 */
async function executeProvider(provider, config, prompt, maxOutputTokens, timeoutMs = 120000) {
  const client = createProviderClient(provider, config);
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    let result;
    
    if (provider === 'anthropic') {
      result = await extractWithAnthropic(client, config.model, prompt, maxOutputTokens);
    } else {
      // openai or openai-compatible
      result = await extractWithOpenAICompatible(client, config.model, prompt, maxOutputTokens);
    }
    
    clearTimeout(timeoutId);
    
    if (!result.content || result.content.trim() === '') {
      throw new ProviderError('Provider returned empty response', 'EMPTY_RESPONSE', 502);
    }
    
    return result;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle abort (timeout)
    if (error.name === 'AbortError' || error.code === 'ABORTED') {
      throw new ProviderTimeoutError(`Provider request timed out after ${timeoutMs}ms`);
    }
    
    // Handle provider SDK errors
    const status = error.status || error.statusCode || error.response?.status;
    const message = error.message || String(error);
    
    // Sanitize error message (remove potential API keys)
    const safeMessage = message
      .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_KEY]')
      .replace(/sk-ant-[a-zA-Z0-9-]{20,}/g, '[REDACTED_KEY]');
    
    switch (status) {
      case 401:
        throw new ProviderAuthError(`Authentication failed: ${safeMessage}`);
      case 429:
        const retryAfter = error.response?.headers?.['retry-after'] 
          ? parseInt(error.response.headers['retry-after'], 10) 
          : undefined;
        throw new ProviderRateLimitError(`Rate limited: ${safeMessage}`, retryAfter);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ProviderUnavailableError(`Provider unavailable: ${safeMessage}`);
      default:
        throw new ProviderError(`Provider error: ${safeMessage}`, 'PROVIDER_ERROR', status || 502, status);
    }
  }
}

module.exports = {
  createProviderClient,
  executeProvider,
  extractWithOpenAICompatible,
  extractWithAnthropic
};