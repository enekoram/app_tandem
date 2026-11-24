import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const DISPLAY_NAME_MAX = 40;
export const STIMULUS_LEVELS = ['full', 'soft', 'minimal'] as const;
export const MAX_OPEN_TASKS = 5;

@Schema({ _id: false })
export class UserPrefs {
  @Prop({ type: String, enum: STIMULUS_LEVELS, default: 'full' })
  stimulus!: (typeof STIMULUS_LEVELS)[number];

  @Prop({ type: Object, default: {} })
  notifications!: Record<string, boolean>;
}

/**
 * Perfil de la persona (doc 02). La identidad y la contraseña viven en `auth_users`
 * (Better Auth); aquí solo lo que usa el dominio.
 */
@Schema({
  collection: 'users',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class User {
  @Prop({ required: true, unique: true })
  auth_user_id!: string;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: DISPLAY_NAME_MAX })
  display_name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, default: 'Europe/Madrid' })
  timezone!: string;

  @Prop({ type: UserPrefs, default: () => ({}) })
  prefs!: UserPrefs;

  @Prop({ required: true, default: 0, min: 0, max: MAX_OPEN_TASKS })
  open_task_count!: number;

  @Prop()
  photo_key?: string;

  @Prop()
  deleted_at?: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
