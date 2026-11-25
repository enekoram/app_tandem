import { Controller, Get, Header } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Connection } from 'mongoose';
import { UsersService } from '../users/users.service.js';

@ApiTags('me')
@ApiCookieAuth()
@Controller('me')
export class ExportController {
  constructor(
    private readonly users: UsersService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /** Exportar mis datos (RGPD): perfil, contactos, tareas, sesiones y apoyo, en JSON. */
  @Get('export')
  @Header('Content-Disposition', 'attachment; filename="tandems-mis-datos.json"')
  @ApiOkResponse({ description: 'JSON con todos mis datos' })
  async export(@Session() auth: UserSession): Promise<Record<string, unknown>> {
    const me = await this.users.ensureProfile(auth.user);
    const db = this.connection;
    const [contacts, tasks, sessions, support] = await Promise.all([
      db.collection('contacts').find({ owner_id: me._id }).toArray(),
      db.collection('tasks').find({ owner_id: me._id }).toArray(),
      db
        .collection('sessions')
        .find({ $or: [{ owner_id: me._id }, { companion_user_id: me._id }] })
        .toArray(),
      db
        .collection('support_events')
        .find({ $or: [{ from_user: me._id }, { to_user: me._id }] })
        .toArray(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      profile: {
        displayName: me.display_name,
        email: me.email,
        timezone: me.timezone,
        prefs: me.prefs,
        createdAt: (me as unknown as { created_at?: Date }).created_at,
      },
      contacts: contacts.map((c) => ({
        name: c.name,
        email: c.invited_email,
        status: c.status,
        createdAt: c.created_at,
      })),
      // Sin identificadores internos ni de otras personas: solo lo mío
      tasks: tasks.map((t) => ({
        title: t.title,
        description: t.description,
        dueAt: t.due_at,
        status: t.status,
        companionStatus: t.companion?.status,
        createdAt: t.created_at,
        doneAt: t.done_at,
      })),
      sessions: sessions.map((s) => ({
        scheduledAt: s.scheduled_at,
        durationMin: s.duration_min,
        status: s.status,
        message: s.message,
      })),
      support: support.map((e) => ({
        type: e.type,
        direction: e.from_user.equals(me._id) ? 'sent' : 'received',
        status: e.status,
        startedAt: e.started_at,
        message: e.message,
      })),
    };
  }
}
