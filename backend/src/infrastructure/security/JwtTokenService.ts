import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthTokenPayload, TokenService } from '../../application/ports/security';

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(payload: AuthTokenPayload): string {
    const options = { expiresIn: this.expiresIn } as SignOptions;
    return jwt.sign({ userId: payload.userId, email: payload.email }, this.secret, options);
  }

  /** Throws (JsonWebTokenError / TokenExpiredError) on an invalid token. */
  verify(token: string): AuthTokenPayload {
    const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload;
    return { userId: String(decoded.userId), email: String(decoded.email) };
  }
}
