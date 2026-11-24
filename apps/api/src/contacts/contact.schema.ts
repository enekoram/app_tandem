import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CONTACT_NAME_MAX, CONTACT_STATUSES, type ContactStatus } from '@tandems/shared';
import { Types, type HydratedDocument } from 'mongoose';

/** «X es contacto de owner» (relación dirigida; al aceptar existen los dos sentidos). Doc 02. */
@Schema({
  collection: 'contacts',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Contact {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  owner_id!: Types.ObjectId;

  /** null mientras la persona no tiene cuenta / no ha aceptado. */
  @Prop({ type: Types.ObjectId, default: null })
  contact_user_id!: Types.ObjectId | null;

  /** Cómo la llama la dueña («Lucía»). */
  @Prop({ required: true, trim: true, minlength: 1, maxlength: CONTACT_NAME_MAX })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  invited_email!: string;

  @Prop({ type: String, enum: CONTACT_STATUSES, required: true, default: 'pending' })
  status!: ContactStatus;

  @Prop({ required: true, min: 0, max: 7 })
  color_index!: number;

  @Prop({ required: true })
  initials!: string;

  @Prop()
  accepted_at?: Date;

  created_at!: Date;
}

export type ContactDocument = HydratedDocument<Contact>;
export const ContactSchema = SchemaFactory.createForClass(Contact);

ContactSchema.index({ owner_id: 1, status: 1 });
ContactSchema.index({ contact_user_id: 1 });
// ErrContactoExiste: un email no puede estar dos veces entre los contactos vivos de alguien
ContactSchema.index(
  { owner_id: 1, invited_email: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'accepted'] } } },
);
