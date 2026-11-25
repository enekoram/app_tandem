import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SUPPORT_SEND_MAX_MS,
  THINKING_INTERVAL_MS,
  type SendSupportInput,
  type SupportRequestInput,
  type ThinkingInput,
} from '@tandems/shared';
import { Types, type ClientSession, type Model } from 'mongoose';
import { DomainError, notFound } from '../common/errors.js';
import { Contact } from '../contacts/contact.schema.js';
import {
  RealtimeGateway,
  SUPPORT,
  THINKING,
  type SupportPayload,
  type ThinkingPayload,
} from '../realtime/realtime.gateway.js';
import { Task, type TaskDocument } from '../tasks/task.schema.js';
import type { UserDocument } from '../users/user.schema.js';
import { SupportEvent, type SupportEventDocument } from './support-event.schema.js';

/** Lo que la Home necesita del apoyo (las peticiones vivas y quién me envía apoyo ahora). */
export interface SupportState {
  incoming: { event: SupportEventDocument; task: TaskDocument }[];
  outgoing: { event: SupportEventDocument; task: TaskDocument }[];
  /** Usuarias que me están enviando apoyo ahora. */
  sendingToMe: Types.ObjectId[];
}

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportEvent.name) private readonly events: Model<SupportEvent>,
    @InjectModel(Task.name) private readonly tasks: Model<Task>,
    @InjectModel(Contact.name) private readonly contacts: Model<Contact>,
    private readonly gateway: RealtimeGateway,
  ) {}

  // ── Pedir apoyo (dueña → acompañante) ───────────────────────────────────────

  /** PedirApoyo: una petición abierta por tarea (si ya hay una, se devuelve esa). No caduca. */
  async request(me: UserDocument, input: SupportRequestInput, now = Date.now()) {
    const task = await this.ownTaskWithCompanion(me, input.taskId);
    const existing = await this.events.findOne({
      type: 'request',
      task_id: task._id,
      from_user: me._id,
      status: 'open',
    });
    if (existing) return { event: existing, task };
    const event = await this.events.create({
      from_user: me._id,
      to_user: task.companion.user_id!,
      task_id: task._id,
      type: 'request',
      message: input.message,
      started_at: new Date(now),
    });
    return { event, task };
  }

  /** «Ahora no»: solo quien la recibe, mientras siga abierta. */
  async decline(me: UserDocument, id: string, now = Date.now()) {
    const event = await this.liveEvent(id, { type: 'request', to_user: me._id }, now);
    event.status = 'declined';
    event.ended_at = new Date(now);
    await event.save();
    return event;
  }

  // ── Enviar apoyo en vivo (acompañante → dueña) ──────────────────────────────

  /** Empieza a enviar apoyo (mantener pulsado). Atiende la petición abierta de esa tarea. */
  async startSending(me: UserDocument, input: SendSupportInput, now = Date.now()) {
    if (!Types.ObjectId.isValid(input.taskId)) throw notFound('Tarea');
    const task = await this.tasks.findOne({
      _id: input.taskId,
      status: 'open',
      'companion.user_id': me._id,
      'companion.status': 'accepted',
    });
    if (!task) throw notFound('Tarea');
    // Un solo envío vivo por persona y tarea
    await this.events.updateMany(
      { type: 'sending', from_user: me._id, task_id: task._id, status: 'open' },
      { status: 'ended', ended_at: new Date(now) },
    );
    await this.events.updateMany(
      {
        type: 'request',
        task_id: task._id,
        to_user: me._id,
        status: 'open',
      },
      { status: 'accepted', ended_at: new Date(now) },
    );
    const event = await this.events.create({
      from_user: me._id,
      to_user: task.owner_id,
      task_id: task._id,
      type: 'sending',
      started_at: new Date(now),
      expires_at: new Date(now + SUPPORT_SEND_MAX_MS),
    });
    await this.emitSupport(me._id, task.owner_id, 'started');
    return event;
  }

  /** Latido: sigue enviando (sin escribir en la base de datos: solo se reenvía). */
  async beat(me: UserDocument, id: string, now = Date.now()): Promise<void> {
    const event = await this.liveEvent(id, { type: 'sending', from_user: me._id }, now, true);
    await this.emitSupport(me._id, event.to_user, 'beat');
  }

  /** Soltar: termina el envío. */
  async end(me: UserDocument, id: string, now = Date.now()): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw notFound('Apoyo');
    const event = await this.events.findOne({
      _id: id,
      type: 'sending',
      from_user: me._id,
      status: 'open',
    });
    if (!event) return; // Ya terminado (o caducado): soltar no es un error
    event.status = 'ended';
    event.ended_at = new Date(now);
    await event.save();
    await this.emitSupport(me._id, event.to_user, 'ended');
  }

  // ── «Pensé en ti» ───────────────────────────────────────────────────────────

  async thinking(me: UserDocument, input: ThinkingInput, now = Date.now()): Promise<void> {
    if (!Types.ObjectId.isValid(input.contactId)) throw notFound('Contacto');
    const contact = await this.contacts.findOne({
      _id: input.contactId,
      owner_id: me._id,
      status: 'accepted',
      contact_user_id: { $ne: null },
    });
    if (!contact?.contact_user_id) throw notFound('Contacto');
    const to = contact.contact_user_id;
    const recent = await this.events.exists({
      type: 'thinking_of_you',
      from_user: me._id,
      to_user: to,
      started_at: { $gt: new Date(now - THINKING_INTERVAL_MS) },
    });
    if (recent) {
      throw new DomainError(
        HttpStatus.TOO_MANY_REQUESTS,
        'THINKING_LIMIT',
        'Ya se lo dijiste hace poco',
      );
    }
    await this.events.create({
      from_user: me._id,
      to_user: to,
      type: 'thinking_of_you',
      status: 'ended',
      started_at: new Date(now),
      ended_at: new Date(now),
      expires_at: new Date(now),
    });
    const theirs = await this.contactOfMeFor(to, me._id);
    if (theirs) {
      const payload: ThinkingPayload = { contactId: theirs };
      this.gateway.toUser(to, THINKING, payload);
    }
  }

  // ── Lectura ─────────────────────────────────────────────────────────────────

  async state(me: UserDocument, now = Date.now()): Promise<SupportState> {
    const live = await this.events.find({
      $and: [
        { $or: [{ to_user: me._id }, { from_user: me._id }] },
        // Peticiones abiertas (no caducan) y envíos en vivo dentro de sus 5 min
        { $or: [{ type: 'request' }, { type: 'sending', expires_at: { $gt: new Date(now) } }] },
      ],
      status: 'open',
    });
    const tasks = await this.tasks.find({
      _id: { $in: live.map((e) => e.task_id).filter((id) => id) },
      status: 'open',
    });
    const withTask = (e: SupportEventDocument) => {
      const task = tasks.find((t) => e.task_id && t._id.equals(e.task_id));
      return task ? [{ event: e, task }] : [];
    };
    const requests = live.filter((e) => e.type === 'request');
    return {
      incoming: requests.filter((e) => e.to_user.equals(me._id)).flatMap(withTask),
      outgoing: requests.filter((e) => e.from_user.equals(me._id)).flatMap(withTask),
      sendingToMe: live
        .filter((e) => e.type === 'sending' && e.to_user.equals(me._id))
        .map((e) => e.from_user),
    };
  }

  /** Eliminar cuenta: fuera sus eventos de apoyo (en los dos sentidos). */
  async purgeAccount(userId: Types.ObjectId, session: ClientSession): Promise<void> {
    await this.events.deleteMany(
      { $or: [{ from_user: userId }, { to_user: userId }] },
      { session },
    );
  }

  // ── Auxiliares ──────────────────────────────────────────────────────────────

  private async ownTaskWithCompanion(me: UserDocument, taskId: string): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(taskId)) throw notFound('Tarea');
    const task = await this.tasks.findOne({ _id: taskId, owner_id: me._id, status: 'open' });
    if (!task) throw notFound('Tarea');
    if (task.companion.status !== 'accepted' || !task.companion.user_id) {
      throw new DomainError(
        HttpStatus.CONFLICT,
        'NO_COMPANION',
        'La tarea necesita una persona que la acompañe y haya aceptado',
      );
    }
    return task;
  }

  /** Evento vivo con ese filtro (404 si no es suyo; 409 si ya no está vivo). */
  private async liveEvent(
    id: string,
    filter: Record<string, unknown>,
    now: number,
    endIfExpired = false,
  ): Promise<SupportEventDocument> {
    if (!Types.ObjectId.isValid(id)) throw notFound('Apoyo');
    const event = await this.events.findOne({ _id: id, ...filter });
    if (!event) throw notFound('Apoyo');
    const expired = !!event.expires_at && event.expires_at.getTime() <= now;
    if (event.status !== 'open' || expired) {
      if (endIfExpired && event.status === 'open') {
        event.status = 'ended';
        event.ended_at = new Date(now);
        await event.save();
        await this.emitSupport(event.from_user, event.to_user, 'ended');
      }
      throw new DomainError(HttpStatus.CONFLICT, 'SUPPORT_OVER', 'Ya ha terminado');
    }
    return event;
  }

  /** Id del contacto con el que `owner` tiene guardada a `who` (para su paleta). */
  private async contactOfMeFor(owner: Types.ObjectId, who: Types.ObjectId): Promise<string | null> {
    const c = await this.contacts.findOne(
      { owner_id: owner, contact_user_id: who, status: 'accepted' },
      { _id: 1 },
    );
    return c ? (c.id as string) : null;
  }

  private async emitSupport(
    from: Types.ObjectId,
    to: Types.ObjectId,
    state: SupportPayload['state'],
  ): Promise<void> {
    const contactId = await this.contactOfMeFor(to, from);
    if (!contactId) return;
    const payload: SupportPayload = { contactId, state };
    this.gateway.toUser(to, SUPPORT, payload);
  }
}
