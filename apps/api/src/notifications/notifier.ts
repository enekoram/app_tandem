import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { NotificationKind } from '@tandems/shared';
import type { Model, Types } from 'mongoose';
import { Contact } from '../contacts/contact.schema.js';
import { Presence } from '../realtime/presence.js';
import { User } from '../users/user.schema.js';
import { DeviceToken } from './device-token.schema.js';
import { Notification } from './notification.schema.js';
import { PushTransport } from './push-transport.js';
import { PUSH_ROUTES, PUSH_TEXTS } from './texts.js';

export interface NotifyInput {
  to: Types.ObjectId;
  /** Quien provoca el aviso (para escribir su nombre como lo tiene guardado `to`). */
  from: Types.ObjectId;
  kind: NotificationKind;
  /** Idempotencia: el mismo hecho nunca avisa dos veces. */
  dedupeKey: string;
  payload?: Record<string, string>;
}

/**
 * Envía un aviso push si: la persona lo tiene activado, no tiene la app abierta (en ese caso
 * ya lo ve en tiempo real), tiene algún dispositivo y no se le ha avisado ya de ese hecho.
 */
@Injectable()
export class Notifier {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Contact.name) private readonly contacts: Model<Contact>,
    @InjectModel(DeviceToken.name) private readonly tokens: Model<DeviceToken>,
    @InjectModel(Notification.name) private readonly log: Model<Notification>,
    private readonly presence: Presence,
    private readonly transport: PushTransport,
  ) {}

  async notify({ to, from, kind, dedupeKey, payload = {} }: NotifyInput): Promise<boolean> {
    const user = await this.users.findById(to, { prefs: 1 });
    if (!user || user.prefs?.notifications?.[kind] === false) return false;
    if (this.presence.isOnline(to.toString())) return false;
    const devices = await this.tokens.find({ user_id: to });
    if (!devices.length) return false;
    const contact = await this.contacts.findOne(
      { owner_id: to, contact_user_id: from, status: 'accepted' },
      { name: 1 },
    );
    if (!contact) return false;
    try {
      await this.log.create({ user_id: to, kind, payload, dedupe_key: dedupeKey });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return false; // ya avisado
      throw error;
    }
    const text = PUSH_TEXTS[kind](contact.name);
    const { invalidTokens } = await this.transport.send(
      devices.map((d) => ({
        to: d.expo_push_token,
        ...text,
        data: { ...payload, url: PUSH_ROUTES[kind] },
      })),
    );
    if (invalidTokens.length)
      await this.tokens.deleteMany({ expo_push_token: { $in: invalidTokens } });
    return true;
  }
}
