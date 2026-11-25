import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  SUPPORT_STATUSES,
  SUPPORT_TYPES,
  type SupportStatus,
  type SupportType,
} from '@tandems/shared';
import { Types, type HydratedDocument } from 'mongoose';

/** Petición de apoyo, envío de apoyo en vivo o «Pensé en ti» (doc 02 · support_events). */
@Schema({ collection: 'support_events' })
export class SupportEvent {
  @Prop({ type: Types.ObjectId, required: true })
  from_user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  to_user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  task_id!: Types.ObjectId | null;

  @Prop({ type: String, enum: SUPPORT_TYPES, required: true })
  type!: SupportType;

  @Prop({ type: String, enum: SUPPORT_STATUSES, required: true, default: 'open' })
  status!: SupportStatus;

  @Prop({ trim: true })
  message?: string;

  @Prop({ required: true, default: () => new Date() })
  started_at!: Date;

  @Prop()
  ended_at?: Date;

  /** Solo el envío en vivo tiene límite (5 min); las peticiones esperan a que respondan. */
  @Prop({ type: Date, default: null })
  expires_at!: Date | null;
}

export type SupportEventDocument = HydratedDocument<SupportEvent>;
export const SupportEventSchema = SchemaFactory.createForClass(SupportEvent);

SupportEventSchema.index({ to_user: 1, started_at: -1 });
SupportEventSchema.index({ from_user: 1, type: 1, started_at: -1 });
// Se borran solos 30 días después de cerrarse (doc 02); las peticiones abiertas, nunca
SupportEventSchema.index({ ended_at: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
