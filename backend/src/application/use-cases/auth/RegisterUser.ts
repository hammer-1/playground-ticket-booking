import { Email } from '../../../domain/value-objects/Email';
import { EmailAlreadyInUseError } from '../../../domain/errors/DomainError';
import { UserRepository } from '../../ports/UserRepository';
import { PasswordHasher, TokenService } from '../../ports/security';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthResult {
  user: ReturnType<import('../../../domain/entities/User').User['toPublic']>;
  token: string;
}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: RegisterUserInput): Promise<AuthResult> {
    const email = Email.create(input.email);

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyInUseError();
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({ name: input.name.trim(), email, passwordHash });
    const token = this.tokens.sign({ userId: user.id, email: user.email.value });

    return { user: user.toPublic(), token };
  }
}
