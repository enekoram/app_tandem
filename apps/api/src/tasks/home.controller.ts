import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ContactDto, toContactDto } from '../contacts/contacts.dto.js';
import { ContactsService } from '../contacts/contacts.service.js';
import { Presence } from '../realtime/presence.js';
import { SessionViews } from '../sessions/session-views.js';
import { SessionDto } from '../sessions/sessions.dto.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { SupportStateDto } from '../support/support.dto.js';
import { SupportViews } from '../support/support-views.js';
import { SupportService } from '../support/support.service.js';
import { UsersService } from '../users/users.service.js';
import { TaskViews } from './task-views.js';
import { TaskDto } from './tasks.dto.js';
import { TasksService } from './tasks.service.js';

/** Instantánea de la Home (doc 03): lo necesario para derivar la escena de una vez. */
export class HomeDto {
  @ApiProperty({ type: [TaskDto], description: 'Mis tareas abiertas, en orden' })
  tasks!: TaskDto[];

  @ApiProperty({ type: [ContactDto], description: 'Contactos aceptados' })
  contacts!: ContactDto[];

  @ApiProperty({
    type: [TaskDto],
    description: 'Tareas que me comparten y esperan respuesta («Te piden»)',
  })
  shared!: TaskDto[];

  @ApiProperty({
    type: [String],
    description: 'Contactos aceptados con la app abierta ahora («está contigo»)',
  })
  presentContactIds!: string[];

  @ApiProperty({
    type: [SessionDto],
    description: 'Sesiones por confirmar, aceptadas y en curso (por hora)',
  })
  sessions!: SessionDto[];

  @ApiProperty({ type: SupportStateDto })
  support!: SupportStateDto;
}

@ApiTags('me')
@ApiCookieAuth()
@Controller('me')
export class HomeController {
  constructor(
    private readonly users: UsersService,
    private readonly tasks: TasksService,
    private readonly contacts: ContactsService,
    private readonly views: TaskViews,
    private readonly presence: Presence,
    private readonly sessions: SessionsService,
    private readonly sessionViews: SessionViews,
    private readonly supportService: SupportService,
    private readonly supportViews: SupportViews,
  ) {}

  /** Arranque, reconexión y vuelta a primer plano: una sola petición. */
  @Get('home')
  @ApiOkResponse({ type: HomeDto })
  async home(@Session() session: UserSession): Promise<HomeDto> {
    const me = await this.users.ensureProfile(session.user);
    const [open, accompanying, contacts, sessions] = await Promise.all([
      this.tasks.listMine(me, 'open'),
      this.tasks.listAccompanying(me, 'open'),
      this.contacts.list(me),
      this.sessions.listActive(me),
    ]);
    const support = await this.supportViews.state(me, await this.supportService.state(me));
    const pending = accompanying.filter((t) => t.companion.status === 'pending');
    const [tasks, shared, sessionDtos] = await Promise.all([
      this.views.toDtos(me, open, 'owner'),
      this.views.toDtos(me, pending, 'companion'),
      this.sessionViews.toDtos(me, sessions),
    ]);
    const accepted = contacts.filter((c) => c.status === 'accepted');
    return {
      tasks,
      contacts: accepted.map(toContactDto),
      shared,
      presentContactIds: accepted
        .filter((c) => c.contact_user_id && this.presence.isOnline(c.contact_user_id.toString()))
        .map((c) => c.id as string),
      sessions: sessionDtos,
      support,
    };
  }
}
