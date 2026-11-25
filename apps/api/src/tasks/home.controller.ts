import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { ContactDto, toContactDto } from '../contacts/contacts.dto.js';
import { ContactsService } from '../contacts/contacts.service.js';
import { Presence } from '../realtime/presence.js';
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
  ) {}

  /** Arranque, reconexión y vuelta a primer plano: una sola petición. */
  @Get('home')
  @ApiOkResponse({ type: HomeDto })
  async home(@Session() session: UserSession): Promise<HomeDto> {
    const me = await this.users.ensureProfile(session.user);
    const [open, accompanying, contacts] = await Promise.all([
      this.tasks.listMine(me, 'open'),
      this.tasks.listAccompanying(me, 'open'),
      this.contacts.list(me),
    ]);
    const pending = accompanying.filter((t) => t.companion.status === 'pending');
    const [tasks, shared] = await Promise.all([
      this.views.toDtos(me, open, 'owner'),
      this.views.toDtos(me, pending, 'companion'),
    ]);
    const accepted = contacts.filter((c) => c.status === 'accepted');
    return {
      tasks,
      contacts: accepted.map(toContactDto),
      shared,
      presentContactIds: accepted
        .filter((c) => c.contact_user_id && this.presence.isOnline(c.contact_user_id.toString()))
        .map((c) => c.id as string),
    };
  }
}
