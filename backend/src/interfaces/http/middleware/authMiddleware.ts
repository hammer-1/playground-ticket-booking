import { RequestHandler } from 'express';
import { TokenService } from '../../../application/ports/security';

/**
 * Verifies the Bearer token and attaches `req.userId`. Responds 401 on any
 * missing/invalid token. Construct with the app's TokenService at the composition root.
 */
export function makeAuthMiddleware(tokens: TokenService): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
      return;
    }
    try {
      const payload = tokens.verify(header.slice('Bearer '.length).trim());
      req.userId = payload.userId;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHENTICATED' });
    }
  };
}
