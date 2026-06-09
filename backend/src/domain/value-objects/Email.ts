import { ValidationError } from '../errors/DomainError';

// Pragmatic email check — not RFC-perfect, but rejects obvious garbage.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validated, normalised (lower-cased, trimmed) email address. */
export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Email {
    const normalised = raw.trim().toLowerCase();
    if (!EMAIL_RE.test(normalised)) {
      throw new ValidationError(`Invalid email address: "${raw}"`);
    }
    return new Email(normalised);
  }

  toString(): string {
    return this.value;
  }
}
