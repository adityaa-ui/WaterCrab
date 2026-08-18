'use strict';

/**
 * Extraction-specific error classes for clear error handling and sanitization.
 * All errors are safe to serialize and expose to clients.
 */

class ExtractionError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.name = 'ExtractionError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

class ProviderError extends ExtractionError {
  constructor(message, code, statusCode = 502, providerStatus) {
    super(message, code, statusCode);
    this.name = 'ProviderError';
    this.providerStatus = providerStatus;
  }
}

class ValidationError extends ExtractionError {
  constructor(message, code, statusCode = 400) {
    super(message, code, statusCode);
    this.name = 'ValidationError';
  }
}

class SchemaValidationError extends ValidationError {
  constructor(message, code = 'SCHEMA_VALIDATION_FAILED') {
    super(message, code, 400);
    this.name = 'SchemaValidationError';
  }
}

class ContentTooLargeError extends ValidationError {
  constructor(message, code = 'CONTENT_TOO_LARGE') {
    super(message, code, 413);
    this.name = 'ContentTooLargeError';
  }
}

class ProviderTimeoutError extends ProviderError {
  constructor(message = 'Provider request timed out') {
    super(message, 'PROVIDER_TIMEOUT', 504);
    this.name = 'ProviderTimeoutError';
  }
}

class ProviderAuthError extends ProviderError {
  constructor(message = 'Invalid provider credentials') {
    super(message, 'PROVIDER_AUTH_ERROR', 401);
    this.name = 'ProviderAuthError';
  }
}

class ProviderRateLimitError extends ProviderError {
  constructor(message = 'Provider rate limit exceeded', retryAfter) {
    super(message, 'PROVIDER_RATE_LIMIT', 429);
    this.name = 'ProviderRateLimitError';
    this.retryAfter = retryAfter;
  }
}

class ProviderUnavailableError extends ProviderError {
  constructor(message = 'Provider temporarily unavailable') {
    super(message, 'PROVIDER_UNAVAILABLE', 503);
    this.name = 'ProviderUnavailableError';
  }
}

class MalformedResponseError extends ExtractionError {
  constructor(message = 'Provider returned malformed response') {
    super(message, 'MALFORMED_RESPONSE', 502);
    this.name = 'MalformedResponseError';
  }
}

class OutputValidationError extends ExtractionError {
  constructor(message, details, code = 'OUTPUT_VALIDATION_FAILED') {
    super(message, code, 500);
    this.name = 'OutputValidationError';
    this.details = details;
  }
}

module.exports = {
  ExtractionError,
  ProviderError,
  ValidationError,
  SchemaValidationError,
  ContentTooLargeError,
  ProviderTimeoutError,
  ProviderAuthError,
  ProviderRateLimitError,
  ProviderUnavailableError,
  MalformedResponseError,
  OutputValidationError
};