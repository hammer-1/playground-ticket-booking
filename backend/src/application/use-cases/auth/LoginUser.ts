import { Email } from '../../../domain/value-objects/Email';
import { InvalidCredentialsError } from '../../../domain/errors/DomainError';
import { UserRepository } from '../../ports/UserRepository';
import { PasswordHasher, TokenService } from '../../ports/security';
import { AuthResult } from './RegisterUser';

export interface LoginUserInput {
  email: string;
  password: string;
}

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<AuthResult> {
    const email = Email.create(input.email);

    const user = await this.users.findByEmail(email);
    // Same error whether the user is missing or the password is wrong — don't leak
    // which emails are registered.
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const ok = await this.hasher.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    const token = this.tokens.sign({ userId: user.id, email: user.email.value });
    return { user: user.toPublic(), token };
  }
}
