import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  DEFAULT_SESSION_DURATION,
  SESSION_DURATIONS,
  SESSION_STATUSES,
  type SessionStatus,
} from '@tandems/shared';
import { Types, type HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class Joined {
  @Prop({ type: Types.ObjectId, required: true })
  user_id!: Types.ObjectId;

  @Prop({ required: true })
  at!: Date;
}
const JoinedSchema = SchemaFactory.createForClass(Joined);

/** Sesión de trabajo juntas sobre una tarea (doc 02). */
@Schema({
  collection: 'sessions',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Session {
  @Prop({ type: Types.ObjectId, required: true })
  task_id!: Types.ObjectId;

  /** Desnormalizados para autorizar: dueña de la tarea y su acompañante. */
  @Prop({ type: Types.ObjectId, required: true })
  owner_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  companion_user_id!: Types.ObjectId;

  @Prop({ required: true })
  scheduled_at!: Date;

  @Prop({
    type: Number,
    enum: SESSION_DURATIONS,
    required: true,
    default: DEFAULT_SESSION_DURATION,
  })
  duration_min!: number;

  @Prop({ type: String, enum: ['video', 'presence'], required: true, default: 'video' })
  mode!: 'video' | 'presence';

  @Prop({ type: String, enum: SESSION_STATUSES, required: true, default: 'proposed' })
  status!: SessionStatus;

  /** Quien hizo la última propuesta: la otra persona es quien acepta o rechaza. */
  @Prop({ type: Types.ObjectId, required: true })
  proposed_by!: Types.ObjectId;

  /** Reprogramar = nueva propuesta con la hora anterior aquí. */
  @Prop()
  previous_scheduled_at?: Date;

  @Prop({ trim: true })
  message?: string;

  @Prop()
  meet_url?: string;

  @Prop({ type: [JoinedSchema], default: [] })
  joined!: Joined[];

  created_at!: Date;
}

export type SessionDocument = HydratedDocument<Session>;
export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ task_id: 1, scheduled_at: 1 });
SessionSchema.index({ owner_id: 1, scheduled_at: 1 });
SessionSchema.index({ companion_user_id: 1, scheduled_at: 1 });
