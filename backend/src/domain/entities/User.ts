import { Email } from '../value-objects/Email';

/**
 * A registered user. `passwordHash` is always a hash — the domain never sees or
 * stores plaintext passwords.
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: Email,
    public readonly passwordHash: string,
    public readonly createdAt: Date,
  ) {}

  /** Public-safe projection (never includes the password hash). */
  toPublic(): { id: string; name: string; email: string; createdAt: string } {
    return {
      id: this.id,
      name: this.name,
      email: this.email.value,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
