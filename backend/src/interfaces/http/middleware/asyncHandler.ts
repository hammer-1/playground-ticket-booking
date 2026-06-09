import { RequestHandler } from 'express';

/**
 * Wraps an async handler so rejected promises reach Express's error middleware
 * (Express 4 doesn't forward async errors automatically).
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
