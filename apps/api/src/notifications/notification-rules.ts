import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SOON_WINDOW_MS } from '@tandems/shared';
import type { ChangeStreamDocument, Document } from 'mongodb';
import type { Model, Types } from 'mongoose';
import { ChangeFeed } from '../realtime/change-feed.js';
import { Session } from '../sessions/session.schema.js';
import { Notifier, type NotifyInput } from './notifier.js';

const REMINDER_EVERY_MS = 60_000;
type Id = Types.ObjectId;

/**
 * Qué cambio provoca qué aviso. Escucha los change streams (un solo sitio, sin tocar los
 * servicios) y, cada minuto, busca sesiones que empiezan pronto para recordarlas.
 */
@Injectable()
export class NotificationRules implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationRules.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly feed: ChangeFeed,
    private readonly notifier: Notifier,
    @InjectModel(Session.name) private readonly sessions: Model<Session>,
  ) {}

  onModuleInit(): void {
    this.feed.subscribe((collection, change) => void this.onChange(collection, change));
    this.timer = setInterval(() => void this.remindSessions(), REMINDER_EVERY_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  /** Decide los avisos de un cambio (exportado para los tests). */
  rulesFor(collection: string, change: ChangeStreamDocument): NotifyInput[] {
    if (change.operationType !== 'insert' && change.operationType !== 'update') return [];
    const doc = change.fullDocument as Document | undefined;
    if (!doc) return [];
    const id = String(doc._id);
    const inserted = change.operationType === 'insert';
    const updated =
      change.operationType === 'update'
        ? Object.keys(change.updateDescription.updatedFields ?? {})
        : [];
    const touched = (field: string) =>
      updated.some((f) => f === field || f.startsWith(`${field}.`));

    if (collection === 'support_events' && inserted) {
      if (doc.type === 'request') {
        return [
          {
            to: doc.to_user,
            from: doc.from_user,
            kind: 'supportRequests',
            dedupeKey: `support-request:${id}`,
          },
        ];
      }
      if (doc.type === 'sending') {
        return [
          {
            to: doc.to_user,
            from: doc.from_user,
            kind: 'supportReceived',
            dedupeKey: `support-sending:${id}`,
          },
        ];
      }
      return [];
    }

    if (collection === 'tasks') {
      const companion = doc.companion as {
        user_id?: Id | null;
        status?: string;
        changed_at?: Date;
      };
      const out: NotifyInput[] = [];
      // Tarea compartida (nueva, o con otra persona / persona que acaba de unirse)
      if (
        companion?.user_id &&
        companion.status === 'pending' &&
        (inserted || touched('companion'))
      ) {
        out.push({
          to: companion.user_id,
          from: doc.owner_id,
          kind: 'sharedTasks',
          dedupeKey: `shared:${id}:${companion.user_id}:${new Date(companion.changed_at ?? 0).getTime()}`,
        });
      }
      if (
        touched('status') &&
        doc.status === 'done' &&
        companion?.user_id &&
        companion.status === 'accepted'
      ) {
        out.push({
          to: companion.user_id,
          from: doc.owner_id,
          kind: 'tasksDone',
          dedupeKey: `done:${id}`,
        });
      }
      if (touched('thanks_at') && doc.thanks_at && companion?.user_id) {
        out.push({
          to: companion.user_id,
          from: doc.owner_id,
          kind: 'hurras',
          text: 'thanks',
          url: '/acompano/terminadas',
          dedupeKey: `thanks:${id}`,
        });
      }
      if (touched('hurra_at') && doc.hurra_at && companion?.user_id) {
        out.push({
          to: doc.owner_id,
          from: companion.user_id,
          kind: 'hurras',
          dedupeKey: `hurra:${id}`,
        });
      }
      return out;
    }

    if (
      collection === 'sessions' &&
      doc.status === 'proposed' &&
      (inserted || touched('proposed_by') || touched('scheduled_at'))
    ) {
      const proposer = doc.proposed_by as Id;
      const other = proposer.equals(doc.owner_id) ? doc.companion_user_id : doc.owner_id;
      return [
        {
          to: other,
          from: proposer,
          kind: 'sessionInvites',
          dedupeKey: `session:${id}:${new Date(doc.scheduled_at).getTime()}:${String(proposer)}`,
        },
      ];
    }
    return [];
  }

  private async onChange(collection: string, change: ChangeStreamDocument): Promise<void> {
    for (const input of this.rulesFor(collection, change)) {
      await this.notifier.notify(input).catch((error: Error) => {
        this.logger.warn(`No se ha podido avisar (${input.kind}): ${error.message}`);
      });
    }
  }

  /** Recordatorio 10 min antes (doc 04 · decisión 2), a las dos personas, una sola vez. */
  async remindSessions(now = Date.now()): Promise<void> {
    const soon = await this.sessions.find({
      status: 'accepted',
      scheduled_at: { $gt: new Date(now), $lte: new Date(now + SOON_WINDOW_MS) },
    });
    for (const s of soon) {
      const at = s.scheduled_at.getTime();
      for (const [to, from] of [
        [s.owner_id, s.companion_user_id],
        [s.companion_user_id, s.owner_id],
      ] as const) {
        await this.notifier
          .notify({ to, from, kind: 'sessionReminders', dedupeKey: `reminder:${s.id}:${at}:${to}` })
          .catch(() => undefined);
      }
    }
  }
}
