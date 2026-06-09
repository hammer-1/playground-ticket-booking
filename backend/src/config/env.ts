import path from 'node:path';
import dotenv from 'dotenv';

// Single env file for the whole project lives at the repo root. Load it whether the
// backend is started from ./backend (host dev) or from the repo root. In Docker the
// values are injected via env_file, so these calls simply find nothing and no-op.
// dotenv never overrides already-set variables, so the order here is safe.
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value : fallback;
}

/**
 * Typed, validated configuration. Loaded once at the composition root and
 * injected where needed — nothing else reads process.env directly.
 */
export interface AppConfig {
  port: number;
  corsOrigins: string[];
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  reservationTtlSeconds: number;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(optional('PORT', '4000')),
    corsOrigins: optional('CORS_ORIGIN', 'http://localhost:5200')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    databaseUrl: required('DATABASE_URL'),
    redisUrl: required('REDIS_URL'),
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: optional('JWT_EXPIRES_IN', '1d'),
    reservationTtlSeconds: Number(optional('RESERVATION_TTL_SECONDS', '120')),
  };
}
