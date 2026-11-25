import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ACTIVE_SESSION_STATUSES,
  DEFAULT_SESSION_DURATION,
  effectiveSessionStatus,
  SESSION_MIN_LEAD_MS,
  sessionEndsAt,
  type CreateSessionInput,
  type ProposeTimeInput,
  type SessionStatus,
} from '@tandems/shared';
import { Types, type ClientSession, type Model } from 'mongoose';
import { DomainError, notFound } from '../common/errors.js';
import { Task, type TaskDocument } from '../tasks/task.schema.js';
import type { UserDocument } from '../users/user.schema.js';
import { Session, type SessionDocument } from './session.schema.js';

/** Se puede entrar 10 min antes (SesionPorEmpezar, doc 04 · decisión 2). */
export const JOIN_EARLY_MS = 10 * 60 * 1000;

export interface VisibleSession {
  session: SessionDocument;
  task: TaskDocument;
  status: SessionStatus;
}

const invalidState = (message = 'La sesión ya no está en ese estado') =>
  new DomainError(HttpStatus.CONFLICT, 'INVALID_STATE', message);

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private readonly sessions: Model<Session>,
    @InjectModel(Task.name) private readonly tasks: Model<Task>,
  ) {}

  // ── Lectura ─────────────────────────────────────────────────────────────────

  /** Mis sesiones que aún pueden pasar (por confirmar, aceptadas y en curso), por hora. */
  async listActive(me: UserDocument, now = Date.now()): Promise<VisibleSession[]> {
    const found = await this.sessions
      .find({
        $or: [{ owner_id: me._id }, { companion_user_id: me._id }],
        status: { $in: ACTIVE_SESSION_STATUSES },
      })
      .sort({ scheduled_at: 1 });
    const tasks = await this.tasks.find({ _id: { $in: found.map((s) => s.task_id) } });
    return found
      .map((session) => this.view(session, tasks, now))
      .filter((v): v is VisibleSession => !!v && v.status !== 'ended');
  }

  /** Sesión visible para `me` (404 si es ajena o su tarea ya no la sostiene). */
  async get(me: UserDocument, id: string, now = Date.now()): Promise<VisibleSession> {
    if (!Types.ObjectId.isValid(id)) throw notFound('Sesión');
    const session = await this.sessions.findOne({
      _id: id,
      $or: [{ owner_id: me._id }, { companion_user_id: me._id }],
    });
    if (!session) throw notFound('Sesión');
    const task = await this.tasks.findById(session.task_id);
    const view = task ? this.view(session, [task], now) : null;
    if (!view) throw notFound('Sesión');
    return view;
  }

  // ── Acciones ────────────────────────────────────────────────────────────────

  /** Programar: la dueña o su acompañante (aceptada) invita a la otra persona. */
  async create(
    me: UserDocument,
    input: CreateSessionInput,
    now = Date.now(),
  ): Promise<VisibleSession> {
    if (!Types.ObjectId.isValid(input.taskId)) throw notFound('Tarea');
    const task = await this.tasks.findOne({ _id: input.taskId, status: 'open' });
    const isOwner = !!task?.owner_id.equals(me._id);
    const isCompanion =
      !!task?.companion.user_id?.equals(me._id) && task.companion.status === 'accepted';
    if (!task || (!isOwner && !isCompanion)) throw notFound('Tarea');
    if (task.companion.status !== 'accepted' || !task.companion.user_id) {
      throw new DomainError(
        HttpStatus.CONFLICT,
        'NO_COMPANION',
        'La tarea necesita una persona que la acompañe y haya aceptado',
      );
    }
    this.checkFuture(input.scheduledAt, now);
    const active = await this.listActiveForTask(task._id, now);
    if (active.length) {
      throw new DomainError(
        HttpStatus.CONFLICT,
        'SESSION_EXISTS',
        'Esta tarea ya tiene una sesión',
        {
          sessionId: active[0]!.id as string,
        },
      );
    }
    const session = await this.sessions.create({
      task_id: task._id,
      owner_id: task.owner_id,
      companion_user_id: task.companion.user_id,
      scheduled_at: new Date(input.scheduledAt),
      duration_min: input.durationMin ?? DEFAULT_SESSION_DURATION,
      proposed_by: me._id,
      meet_url: input.meetUrl,
    });
    return { session, task, status: 'proposed' };
  }

  /** Aceptar o rechazar una propuesta: solo quien NO la hizo. */
  async respond(me: UserDocument, id: string, action: 'accept' | 'reject', now = Date.now()) {
    const view = await this.get(me, id, now);
    const { session } = view;
    if (view.status !== 'proposed' || session.proposed_by.equals(me._id)) throw invalidState();
    session.status = action === 'accept' ? 'accepted' : 'rejected';
    await session.save();
    return { ...view, status: session.status };
  }

  /**
   * Proponer otra hora (al recibir una invitación) o reprogramar (una aceptada): pasa a ser
   * una propuesta mía que la otra persona tiene que aceptar.
   */
  async propose(me: UserDocument, id: string, input: ProposeTimeInput, now = Date.now()) {
    const view = await this.get(me, id, now);
    const { session } = view;
    if (view.status !== 'proposed' && view.status !== 'accepted') throw invalidState();
    this.checkFuture(input.scheduledAt, now);
    session.previous_scheduled_at = session.scheduled_at;
    session.scheduled_at = new Date(input.scheduledAt);
    session.proposed_by = me._id;
    session.status = 'proposed';
    session.message = input.message;
    await session.save();
    return { ...view, status: 'proposed' as const };
  }

  /**
   * Cancelar: una aceptada (cualquiera de las dos) o retirar mi propia propuesta.
   * Una propuesta ajena se rechaza, no se cancela.
   */
  async cancel(me: UserDocument, id: string, now = Date.now()) {
    const view = await this.get(me, id, now);
    const { session } = view;
    const mine = session.proposed_by.equals(me._id);
    if (!(view.status === 'accepted' || (view.status === 'proposed' && mine))) throw invalidState();
    session.status = 'cancelled';
    await session.save();
    return { ...view, status: 'cancelled' as const };
  }

  /** Unirse (SesionActiva): desde 10 min antes hasta el final; la primera entrada → en vivo. */
  async join(me: UserDocument, id: string, now = Date.now()) {
    const view = await this.get(me, id, now);
    const { session } = view;
    if (view.status !== 'accepted' && view.status !== 'live') throw invalidState();
    if (now < session.scheduled_at.getTime() - JOIN_EARLY_MS) {
      throw new DomainError(HttpStatus.CONFLICT, 'NOT_STARTED', 'Aún no se puede entrar');
    }
    if (!session.joined.some((j) => j.user_id.equals(me._id))) {
      session.joined.push({ user_id: me._id, at: new Date(now) });
    }
    session.status = 'live';
    await session.save();
    return { ...view, status: 'live' as const };
  }

  /** Eliminar cuenta: fuera las sesiones en las que participa. */
  async purgeAccount(userId: Types.ObjectId, session: ClientSession) {
    await this.sessions.deleteMany(
      { $or: [{ owner_id: userId }, { companion_user_id: userId }] },
      { session },
    );
  }

  // ── Auxiliares ──────────────────────────────────────────────────────────────

  /**
   * Una sesión solo vale mientras su tarea siga abierta y acompañada (aceptada) por la misma
   * persona: si la tarea se termina, se borra o cambia de acompañante, deja de verse.
   */
  private view(
    session: SessionDocument,
    tasks: TaskDocument[],
    now: number,
  ): VisibleSession | null {
    const task = tasks.find((t) => t._id.equals(session.task_id));
    if (
      !task ||
      task.status !== 'open' ||
      task.companion.status !== 'accepted' ||
      !task.companion.user_id?.equals(session.companion_user_id)
    ) {
      return null;
    }
    const status = effectiveSessionStatus(
      {
        status: session.status,
        scheduledAt: session.scheduled_at,
        durationMin: session.duration_min,
      },
      now,
    );
    // Una propuesta que nadie aceptó antes de la hora ya no sirve
    if (session.status === 'proposed' && now >= session.scheduled_at.getTime()) return null;
    return { session, task, status };
  }

  private async listActiveForTask(taskId: Types.ObjectId, now: number) {
    const found = await this.sessions.find({
      task_id: taskId,
      status: { $in: ACTIVE_SESSION_STATUSES },
    });
    return found.filter(
      (s) =>
        now < sessionEndsAt(s.scheduled_at, s.duration_min) &&
        !(s.status === 'proposed' && now >= s.scheduled_at.getTime()),
    );
  }

  /** ErrProgramarSesion: «Esa hora ya ha pasado». */
  private checkFuture(iso: string, now: number): void {
    if (new Date(iso).getTime() < now + SESSION_MIN_LEAD_MS) {
      throw new DomainError(HttpStatus.BAD_REQUEST, 'SESSION_IN_PAST', 'Esa hora ya ha pasado');
    }
  }
}
