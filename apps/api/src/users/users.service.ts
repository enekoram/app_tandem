import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Model, Types } from 'mongoose';
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
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true },
      )
      .orFail();
  }

  /** Perfil por id (null si no existe o la cuenta está borrada). */
  async findById(id: Types.ObjectId | string): Promise<UserDocument | null> {
    return this.users.findOne({ _id: id, deleted_at: { $exists: false } });
  }

  /** Cambia «¿Cómo quieres que te llamemos?». */
  async rename(me: UserDocument, displayName: string): Promise<UserDocument> {
    me.display_name = displayName;
    return me.save();
  }

  /** Eliminar cuenta: borra el perfil (libera el email para una cuenta nueva). */
  async purge(id: Types.ObjectId, session: ClientSession): Promise<void> {
    await this.users.deleteOne({ _id: id }, { session });
  }
}
