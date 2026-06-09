import { PrismaClient } from '@prisma/client';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { NewUser, UserRepository } from '../../application/ports/UserRepository';

interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

function toUser(row: UserRow): User {
  return new User(row.id, row.name, Email.create(row.email), row.passwordHash, row.createdAt);
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.value } });
    return row ? toUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }

  async create(user: NewUser): Promise<User> {
    const row = await this.prisma.user.create({
      data: { name: user.name, email: user.email.value, passwordHash: user.passwordHash },
    });
    return toUser(row);
  }
}
