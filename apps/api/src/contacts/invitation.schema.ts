import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, type HydratedDocument } from 'mongoose';

export const INVITATION_STATUSES = ['sent', 'opened', 'accepted', 'expired', 'cancelled'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const INVITATION_TTL_DAYS = 14;
export const MAX_RESENDS = 3;
export const RESEND_INTERVAL_MS = 10 * 60 * 1000;

/** Invitación a la red de apoyo. Solo se guarda el hash del token (doc 02). */
@Schema({
  collection: 'invitations',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Invitation {
  @Prop({ type: Types.ObjectId, required: true })
  inviter_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  contact_id!: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  /** SHA-256 (hex) de un token aleatorio de 32 bytes. */
  @Prop({ required: true, unique: true })
  token_hash!: string;

  @Prop({ type: String, enum: INVITATION_STATUSES, required: true, default: 'sent' })
  status!: InvitationStatus;

  @Prop({ required: true })
  expires_at!: Date;

  @Prop({ required: true, default: 0 })
  resend_count!: number;

  @Prop({ required: true })
  last_sent_at!: Date;

  @Prop({ type: Types.ObjectId, default: null })
  task_id!: Types.ObjectId | null;
}

export type InvitationDocument = HydratedDocument<Invitation>;
export const InvitationSchema = SchemaFactory.createForClass(Invitation);

InvitationSchema.index({ email: 1, status: 1 });
// Se borran solas 30 días después de caducar
InvitationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
