'use strict';

/**
 * Centralized per-route rate limiting for the backend API.
 *
 * Uses express-rate-limit (tiny, dependency-free) with a JSON response that
 * matches the existing { success, error } envelope, and standard RateLimit-*
 * response headers so clients can retry.
 */

const rateLimit = require('express-rate-limit');

function createRouteLimiter({ windowMs = 60000, limit = 30 }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }
  });
}

module.exports = { createRouteLimiter };
