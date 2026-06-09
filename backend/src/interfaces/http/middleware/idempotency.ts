import { RequestHandler } from 'express';
import { IdempotencyStore } from '../../../application/ports/IdempotencyStore';

const PENDING_TTL = 30; // seconds an in-flight request blocks duplicates
const RESULT_TTL = 60 * 60; // keep a completed result replayable for an hour

/**
 * Makes a write endpoint safe to retry. If the client sends an `Idempotency-Key`,
 * the first request is processed and its response cached; identical retries replay the
 * cached response instead of executing the booking twice. Without the header the
 * endpoint behaves normally. Requires an authenticated request (keys are user-scoped).
 */
export function makeIdempotency(store: IdempotencyStore): RequestHandler {
  return async (req, res, next) => {
    const idemKey = req.header('Idempotency-Key');
    if (!idemKey || !req.userId) {
      next();
      return;
    }

    const key = `idem:${req.userId}:${idemKey}`;
    let claim;
    try {
      claim = await store.claim(key, PENDING_TTL);
    } catch {
      next(); // never let the dedup layer take down the real request
      return;
    }

    if (claim.kind === 'pending') {
      res.status(409).json({
        error: 'A request with this Idempotency-Key is already being processed.',
        code: 'REQUEST_IN_PROGRESS',
      });
      return;
    }
    if (claim.kind === 'replay') {
      res.status(claim.response.status).json(claim.response.body);
      return;
    }

    // claimed → capture the response so retries can replay it.
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode < 400) {
        void store.save(key, { status: res.statusCode, body }, RESULT_TTL);
      } else {
        // Failed — release the lock so the client can genuinely retry.
        void store.discard(key);
      }
      return originalJson(body);
    };
    next();
  };
}
