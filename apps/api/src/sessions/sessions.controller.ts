import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  createSessionSchema,
  proposeTimeSchema,
  type CreateSessionInput,
  type ProposeTimeInput,
} from '@tandems/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { openApiSchema, ZodPipe } from '../common/zod.js';
import { UsersService } from '../users/users.service.js';
import { SessionViews } from './session-views.js';
import { SessionDto } from './sessions.dto.js';
import { SessionsService } from './sessions.service.js';

@ApiTags('sessions')
@ApiCookieAuth()
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly users: UsersService,
    private readonly views: SessionViews,
  ) {}

  /** Mis sesiones: por confirmar, esperando respuesta, próximas y en curso (por hora). */
  @Get()
  @ApiOkResponse({ type: [SessionDto] })
  async list(@Session() auth: UserSession): Promise<SessionDto[]> {
    const me = await this.users.ensureProfile(auth.user);
    return this.views.toDtos(me, await this.sessions.listActive(me));
  }

  @Get(':id')
  @ApiOkResponse({ type: SessionDto })
  @ApiNotFoundResponse()
  async get(@Session() auth: UserSession, @Param('id') id: string): Promise<SessionDto> {
    const me = await this.users.ensureProfile(auth.user);
    return this.views.one(me, await this.sessions.get(me, id));
  }

  /** Programar sesión (ProgramarSesion). */
  @Post()
  @ApiBody({ schema: openApiSchema(createSessionSchema) })
  @ApiCreatedResponse({ type: SessionDto })
  @ApiBadRequestResponse({ description: 'SESSION_IN_PAST: esa hora ya ha pasado' })
  @ApiConflictResponse({ description: 'NO_COMPANION · SESSION_EXISTS' })
  async create(
    @Session() auth: UserSession,
    @Body(new ZodPipe(createSessionSchema)) body: CreateSessionInput,
  ): Promise<SessionDto> {
    const me = await this.users.ensureProfile(auth.user);
    return this.views.one(me, await this.sessions.create(me, body));
  }

  @Post(':id/accept')
  @HttpCode(200)
  @ApiOkResponse({ type: SessionDto })
  async accept(@Session() auth: UserSession, @Param('id') id: string): Promise<SessionDto> {
    const me = await this.users.ensureProfile(auth.user);
    return this.views.one(me, await this.sessions.respond(me, id, 'accept'));
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOkResponse({ type: SessionDto })
  async reject(@Session() auth: UserSession, @Param('id') id: string): Promise<SessionDto> {
    const me = await this.users.ensureProfile(auth.user);
    return this.views.one(me, await this.sessions.respond(me, id, 'reject'));
  }

  /** Proponer otra hora / reprogramar. */
  @Post(':id/propose')
  @HttpCode(200)
  @ApiBody({ schema: openApiSchema(proposeTimeSchema) })
  @ApiOkResponse({ type: SessionDto })
  async propose(
    @Session() auth: UserSession,
    @Param('id') id: string,
    @Body(new ZodPipe(proposeTimeSchema)) body: ProposeTimeInput,
  ): Promise<SessionDto> {
    const me = await this.users.ensureProfile(auth.user);
    return this.views.one(me, await this.sessions.propose(me, id, body));
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOkResponse({ type: SessionDto })
  async cancel(@Session() auth: UserSession, @Param('id') id: string): Promise<SessionDto> {
    const me = await this.users.ensureProfile(auth.user);
    return this.views.one(me, await this.sessions.cancel(me, id));
  }

  /** Unirse (SesionActiva): la primera entrada la pone «en vivo». */
  @Post(':id/join')
  @HttpCode(200)
  @ApiOkResponse({ type: SessionDto })
  @ApiConflictResponse({ description: 'NOT_STARTED: aún no se puede entrar' })
  async join(@Session() auth: UserSession, @Param('id') id: string): Promise<SessionDto> {
    const me = await this.users.ensureProfile(auth.user);
    return this.views.one(me, await this.sessions.join(me, id));
  }
}
