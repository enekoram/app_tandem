import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { Types, type Model } from 'mongoose';
import type { Server, Socket } from 'socket.io';
import { Contact } from '../contacts/contact.schema.js';
import { UsersService } from '../users/users.service.js';
import { Presence } from './presence.js';

/** Eventos que recibe la app. Nunca llevan contenido de tareas (privacidad): solo avisan. */
export const HOME_CHANGED = 'home:changed';
export const PRESENCE = 'presence';

export const SUPPORT = 'support';
export const THINKING = 'thinking';

/** Apoyo en vivo: quién (contacto en la lista de quien lo recibe) y en qué punto va. */
export interface SupportPayload {
  contactId: string;
  state: 'started' | 'beat' | 'ended';
}

export interface ThinkingPayload {
  contactId: string;
}

export interface PresencePayload {
  /** Id del contacto en la lista de quien recibe el evento. */
  contactId: string;
  present: boolean;
}

export const roomOf = (userId: Types.ObjectId | string) => `user:${userId.toString()}`;

/**
 * Gateway de tiempo real (doc 01). La sesión se valida en el handshake con la misma cookie
 * que usa la API; sin sesión, se desconecta. Cada persona entra en su sala `user:<id>`.
 * Solo transporte websocket (sin long polling: evita sesiones pegajosas en Render).
 */
@WebSocketGateway({ transports: ['websocket'] })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer() server!: Server;

  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly presence: Presence,
    @InjectModel(Contact.name) private readonly contacts: Model<Contact>,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const headers = new Headers();
      const cookie = socket.handshake.headers.cookie;
      if (cookie) headers.set('cookie', cookie);
      const session = await this.auth.instance.api.getSession({ headers });
      if (!session) {
        socket.disconnect(true);
        return;
      }
      const me = await this.users.ensureProfile(session.user);
      const userId = me.id as string;
      socket.data.userId = userId;
      await socket.join(roomOf(userId));
      if (this.presence.add(userId, socket.id)) await this.announce(userId, true);
      socket.emit('ready');
    } catch (error) {
      this.logger.warn(`Conexión rechazada: ${(error as Error).message}`);
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const userId = socket.data.userId as string | undefined;
    if (userId && this.presence.remove(userId, socket.id)) await this.announce(userId, false);
  }

  /** Avisa a una persona de que algo de su Home ha cambiado (la app vuelve a pedir /me/home). */
  homeChanged(userIds: Iterable<Types.ObjectId | string | null | undefined>): void {
    const rooms = [...new Set([...userIds].filter((id) => id).map((id) => roomOf(id!)))];
    if (rooms.length) this.server.to(rooms).emit(HOME_CHANGED);
  }

  /** Evento efímero a una persona (apoyo en vivo, «Pensé en ti»): nunca con contenido. */
  toUser(userId: Types.ObjectId | string, event: string, payload: object): void {
    this.server.to(roomOf(userId)).emit(event, payload);
  }

  /** A quien me tiene como contacto aceptado: «está contigo» / «hoy no está». */
  private async announce(userId: string, present: boolean): Promise<void> {
    const theirs = await this.contacts.find(
      // ObjectId explícito: el esquema no convierte cadenas en este campo
      { contact_user_id: new Types.ObjectId(userId), status: 'accepted' },
      { _id: 1, owner_id: 1 },
    );
    for (const c of theirs) {
      const payload: PresencePayload = { contactId: c.id as string, present };
      this.server.to(roomOf(c.owner_id)).emit(PRESENCE, payload);
    }
  }
}
