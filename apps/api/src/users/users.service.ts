import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { User, type UserDocument } from './user.schema.js';

export interface AuthIdentity {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  /**
   * Crea el perfil la primera vez que la persona pide /me (idempotente). Solo se llama con
   * una sesión válida, así que la cuenta de Better Auth ya está confirmada.
   */
  async ensureProfile(identity: AuthIdentity): Promise<UserDocument> {
    return this.users
      .findOneAndUpdate(
        { auth_user_id: identity.id },
        {
          $setOnInsert: {
            auth_user_id: identity.id,
            display_name: identity.name.trim(),
            email: identity.email.toLowerCase(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
      )
      .orFail();
  }
}
