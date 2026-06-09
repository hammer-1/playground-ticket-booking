import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';

export interface NewUser {
  name: string;
  email: Email;
  passwordHash: string;
}

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
}
