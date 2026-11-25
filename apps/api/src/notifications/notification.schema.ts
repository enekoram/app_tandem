import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NOTIFICATION_KINDS, type NotificationKind } from '@tandems/shared';
import { Types, type HydratedDocument } from 'mongoose';

/** Registro de avisos enviados: idempotencia por `dedupe_key` (doc 02 · notifications). */
@Schema({ collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, required: true })
  user_id!: Types.ObjectId;

  @Prop({ type: String, enum: NOTIFICATION_KINDS, required: true })
  kind!: NotificationKind;

  /** Solo ids (nunca contenido de tareas). */
  @Prop({ type: Object, default: {} })
  payload!: Record<string, string>;

  @Prop({ required: true, unique: true })
  dedupe_key!: string;

  @Prop({ required: true, default: () => new Date() })
  sent_at!: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Se borran solos a los 90 días
NotificationSchema.index({ sent_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
