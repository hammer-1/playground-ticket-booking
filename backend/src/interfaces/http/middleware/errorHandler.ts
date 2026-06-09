import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../../../domain/errors/DomainError';
import { logger } from '../../../config/logger';

/** Maps domain error codes to HTTP status codes. */
const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  INVALID_CREDENTIALS: 401,
  UNAUTHENTICATED: 401,
  NOT_FOUND: 404,
  EMAIL_ALREADY_IN_USE: 409,
  SLOT_UNAVAILABLE: 409,
  SLOT_ALREADY_RESERVED: 409,
  RESERVATION_EXPIRED: 410,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (err instanceof DomainError) {
    const status = STATUS_BY_CODE[err.code] ?? 400;
    // A lost race (slot taken) is expected traffic, not a server fault — log as info.
    logger.info({ code: err.code }, err.message);
    res.status(status).json({ error: err.message, code: err.code });
    return;
  }

  logger.error(err, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
};
