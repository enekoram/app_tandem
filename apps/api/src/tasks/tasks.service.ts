import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  MAX_OPEN_TASKS,
  sortOpenTasks,
  type CompanionStatus,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@tandems/shared';
import { Types, type ClientSession, type Connection, type Model } from 'mongoose';
import { DomainError, notFound } from '../common/errors.js';
import { Contact, type ContactDocument } from '../contacts/contact.schema.js';
import { User, type UserDocument } from '../users/user.schema.js';
import { Task, type TaskDocument } from './task.schema.js';

/** Ventana de «Deshacer» (decisión 7: 8 s) más margen para la red. */
export const UNDO_WINDOW_MS = 8_000 + 7_000;
const VISIBLE_TO_COMPANION: CompanionStatus[] = ['pending', 'accepted'];

export type TaskRole = 'owner' | 'companion';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly tasks: Model<Task>,
    @InjectModel(Contact.name) private readonly contacts: Model<Contact>,
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  // ── Lectura ─────────────────────────────────────────────────────────────────

  async listMine(me: UserDocument, status: 'open' | 'done'): Promise<TaskDocument[]> {
    if (status === 'done') {
      return this.tasks.find({ owner_id: me._id, status }).sort({ done_at: -1 });
    }
    return openOrder(await this.tasks.find({ owner_id: me._id, status }));
  }

  async listAccompanying(me: UserDocument, status: 'open' | 'done'): Promise<TaskDocument[]> {
    const query = this.tasks.find({
      'companion.user_id': me._id,
      'companion.status': status === 'open' ? { $in: VISIBLE_TO_COMPANION } : 'accepted',
      status,
    });
    return status === 'done' ? query.sort({ done_at: -1 }) : openOrder(await query);
  }

  /** Tarea visible para `me` como dueña o acompañante (404 en otro caso: no se revela que existe). */
  async getVisible(me: UserDocument, id: string): Promise<{ task: TaskDocument; role: TaskRole }> {
    if (!Types.ObjectId.isValid(id)) throw notFound('Tarea');
    const task = await this.tasks.findOne({ _id: id, status: { $ne: 'deleted' } });
    if (task?.owner_id.equals(me._id)) return { task, role: 'owner' };
    if (
      task &&
      task.companion.user_id?.equals(me._id) &&
      VISIBLE_TO_COMPANION.includes(task.companion.status)
    ) {
      return { task, role: 'companion' };
    }
    throw notFound('Tarea');
  }

  // ── Dueña ───────────────────────────────────────────────────────────────────

  /** Crear: contador condicional (límite de 5) + tarea, en una transacción (doc 02). */
  async create(me: UserDocument, input: CreateTaskInput): Promise<TaskDocument> {
    const contact = await this.liveContact(me, input.companionContactId);
    let task!: TaskDocument;
    await this.connection.transaction(async (session) => {
      await this.takeSlot(me._id, session);
      const created = await this.tasks.create(
        [
          {
            owner_id: me._id,
            title: input.title,
            description: input.description,
            due_at: input.dueAt ? new Date(input.dueAt) : undefined,
            status: 'open',
            companion: this.companionFor(contact),
          },
        ],
        { session },
      );
      task = created[0]!;
    });
    return task;
  }

  async update(me: UserDocument, id: string, input: UpdateTaskInput): Promise<TaskDocument> {
    const task = await this.ownOpen(me, id);
    if (input.title !== undefined) task.title = input.title;
    if (input.description !== undefined) task.description = input.description || undefined;
    if (input.dueAt !== undefined) task.due_at = input.dueAt ? new Date(input.dueAt) : undefined;
    // CambiarAcompanante: otra persona → vuelve a «pendiente» hasta que acepte
    if (input.companionContactId && !task.companion.contact_id.equals(input.companionContactId)) {
      task.companion = this.companionFor(await this.liveContact(me, input.companionContactId));
    }
    return task.save();
  }

  /** «¿La das por hecha?» → terminada; libera un hueco. */
  async complete(me: UserDocument, id: string): Promise<TaskDocument> {
    return this.closeOpen(me, id, 'done');
  }

  /** Borrar (lógico): se puede deshacer durante la ventana; libera un hueco. */
  async remove(me: UserDocument, id: string): Promise<void> {
    await this.closeOpen(me, id, 'deleted');
  }

  /**
   * «Deshacer» de terminar o borrar: vuelve a abierta pasando otra vez por el límite
   * (si mientras tanto se llegó a 5, no se puede).
   */
  async restore(me: UserDocument, id: string): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(id)) throw notFound('Tarea');
    const task = await this.tasks.findOne({ _id: id, owner_id: me._id, status: { $ne: 'open' } });
    const closedAt = task?.status === 'done' ? task.done_at : task?.deleted_at;
    if (!task || !closedAt || Date.now() - closedAt.getTime() > UNDO_WINDOW_MS) {
      throw new DomainError(HttpStatus.CONFLICT, 'UNDO_EXPIRED', 'Ya no se puede deshacer');
    }
    await this.connection.transaction(async (session) => {
      await this.takeSlot(me._id, session);
      task.status = 'open';
      task.done_at = undefined;
      task.deleted_at = undefined;
      task.hurra_at = undefined;
      await task.save({ session });
    });
    return task;
  }

  // ── Acompañante ─────────────────────────────────────────────────────────────

  /** «¡hurra!»: quien acompañó una tarea terminada lo envía una vez. */
  async hurra(me: UserDocument, id: string): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(id)) throw notFound('Tarea');
    const task = await this.tasks.findOneAndUpdate(
      {
        _id: id,
        status: 'done',
        'companion.user_id': me._id,
        'companion.status': 'accepted',
        hurra_at: { $exists: false },
      },
      { $set: { hurra_at: new Date() } },
      { returnDocument: 'after' },
    );
    if (task) return task;
    const exists = await this.tasks.exists({
      _id: id,
      status: 'done',
      'companion.user_id': me._id,
      'companion.status': 'accepted',
    });
    if (exists) {
      throw new DomainError(HttpStatus.CONFLICT, 'HURRA_ALREADY_SENT', 'Ya enviaste un ¡hurra!');
    }
    throw notFound('Tarea');
  }

  async respond(
    me: UserDocument,
    id: string,
    action: 'accept' | 'reject' | 'leave',
  ): Promise<TaskDocument> {
    const { task, role } = await this.getVisible(me, id);
    if (role !== 'companion' || task.status !== 'open') throw notFound('Tarea');
    const from: CompanionStatus = action === 'leave' ? 'accepted' : 'pending';
    if (task.companion.status !== from) {
      throw new DomainError(
        HttpStatus.CONFLICT,
        'INVALID_STATE',
        'La tarea ya no está en ese estado',
      );
    }
    const to: Record<typeof action, CompanionStatus> = {
      accept: 'accepted',
      reject: 'rejected',
      leave: 'left',
    };
    task.companion.status = to[action];
    task.companion.changed_at = new Date();
    return task.save();
  }

  // ── Auxiliares ──────────────────────────────────────────────────────────────

  /** `$inc` condicional sobre el perfil: la única garantía real del límite (doc 02). */
  private async takeSlot(userId: Types.ObjectId, session: ClientSession): Promise<void> {
    const res = await this.users.updateOne(
      { _id: userId, open_task_count: { $lt: MAX_OPEN_TASKS } },
      { $inc: { open_task_count: 1 } },
      { session },
    );
    if (res.matchedCount === 0) {
      throw new DomainError(
        HttpStatus.CONFLICT,
        'TASK_LIMIT',
        `Ya tienes ${MAX_OPEN_TASKS} tareas abiertas`,
      );
    }
  }

  private async closeOpen(
    me: UserDocument,
    id: string,
    status: 'done' | 'deleted',
  ): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(id)) throw notFound('Tarea');
    let task: TaskDocument | null = null;
    await this.connection.transaction(async (session) => {
      const now = new Date();
      task = await this.tasks.findOneAndUpdate(
        { _id: id, owner_id: me._id, status: 'open' },
        status === 'done' ? { status, done_at: now } : { status, deleted_at: now },
        { session, returnDocument: 'after' },
      );
      if (!task) throw notFound('Tarea');
      await this.users.updateOne(
        { _id: me._id, open_task_count: { $gt: 0 } },
        { $inc: { open_task_count: -1 } },
        { session },
      );
    });
    return task!;
  }

  private async ownOpen(me: UserDocument, id: string): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(id)) throw notFound('Tarea');
    const task = await this.tasks.findOne({ _id: id, owner_id: me._id, status: 'open' });
    if (!task) throw notFound('Tarea');
    return task;
  }

  /** El acompañante tiene que ser un contacto vivo de la dueña (aceptado o pendiente de unirse). */
  private async liveContact(me: UserDocument, contactId: string): Promise<ContactDocument> {
    const contact = await this.contacts.findOne({
      _id: contactId,
      owner_id: me._id,
      status: { $in: ['pending', 'accepted'] },
    });
    if (!contact) {
      throw new DomainError(HttpStatus.NOT_FOUND, 'CONTACT_NOT_FOUND', 'Ese contacto no existe');
    }
    return contact;
  }

  private companionFor(contact: ContactDocument) {
    return {
      contact_id: contact._id,
      user_id: contact.contact_user_id,
      status: 'pending' as const,
      changed_at: new Date(),
    };
  }
}

/**
 * Orden de las tareas abiertas (el mismo que la Home, doc 03): con fecha por cercanía y
 * después sin fecha, de la más reciente. Mongo pone los `null` primero, así que se ordena aquí.
 */
function openOrder(tasks: TaskDocument[]): TaskDocument[] {
  const keyed = tasks.map((task) => ({ task, dueAt: task.due_at, createdAt: task.created_at }));
  return sortOpenTasks(keyed).map((x) => x.task);
}
