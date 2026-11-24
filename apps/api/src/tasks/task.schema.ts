import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  COMPANION_STATUSES,
  TASK_DESCRIPTION_MAX,
  TASK_STATUSES,
  TASK_TITLE_MAX,
  type CompanionStatus,
  type TaskStatus,
} from '@tandems/shared';
import { Types, type HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class Companion {
  /** Contacto de la dueña que acompaña. */
  @Prop({ type: Types.ObjectId, required: true })
  contact_id!: Types.ObjectId;

  /** Desnormalizado (solo el id) para «tareas que acompaño» y autorizar. null hasta que se une. */
  @Prop({ type: Types.ObjectId, default: null })
  user_id!: Types.ObjectId | null;

  @Prop({ type: String, enum: COMPANION_STATUSES, required: true })
  status!: CompanionStatus;

  @Prop({ required: true })
  changed_at!: Date;
}
const CompanionSchema = SchemaFactory.createForClass(Companion);

/** Tarea (doc 02): estado de la tarea y del acompañamiento en dos ejes. */
@Schema({ collection: 'tasks', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Task {
  @Prop({ type: Types.ObjectId, required: true })
  owner_id!: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 1, maxlength: TASK_TITLE_MAX })
  title!: string;

  @Prop({ trim: true, maxlength: TASK_DESCRIPTION_MAX })
  description?: string;

  @Prop()
  due_at?: Date;

  @Prop({ type: String, enum: TASK_STATUSES, required: true, default: 'open' })
  status!: TaskStatus;

  @Prop({ type: CompanionSchema, required: true })
  companion!: Companion;

  @Prop()
  done_at?: Date;

  @Prop()
  deleted_at?: Date;

  created_at!: Date;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ owner_id: 1, status: 1 });
TaskSchema.index({ 'companion.user_id': 1, status: 1 });
TaskSchema.index({ 'companion.contact_id': 1 });
