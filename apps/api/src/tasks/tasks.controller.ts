import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@tandems/shared';
import { openApiSchema, ZodPipe } from '../common/zod.js';
import type { UserDocument } from '../users/user.schema.js';
import { UsersService } from '../users/users.service.js';
import { TaskViews } from './task-views.js';
import { TaskDto } from './tasks.dto.js';
import { TasksService } from './tasks.service.js';

type ListStatus = 'open' | 'done';
const listStatus = (s: unknown): ListStatus => (s === 'done' ? 'done' : 'open');

@ApiTags('tasks')
@ApiCookieAuth()
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly users: UsersService,
    private readonly views: TaskViews,
  ) {}

  /** Mis tareas (abiertas o terminadas). */
  @Get()
  @ApiQuery({ name: 'status', enum: ['open', 'done'], required: false })
  @ApiOkResponse({ type: [TaskDto] })
  async list(
    @Session() session: UserSession,
    @Query('status') status?: string,
  ): Promise<TaskDto[]> {
    const me = await this.me(session);
    return this.views.toDtos(me, await this.tasks.listMine(me, listStatus(status)), 'owner');
  }

  /** Tareas que acompaño (pantalla Acompaño). */
  @Get('accompanying')
  @ApiQuery({ name: 'status', enum: ['open', 'done'], required: false })
  @ApiOkResponse({ type: [TaskDto] })
  async accompanying(
    @Session() session: UserSession,
    @Query('status') status?: string,
  ): Promise<TaskDto[]> {
    const me = await this.me(session);
    return this.views.toDtos(
      me,
      await this.tasks.listAccompanying(me, listStatus(status)),
      'companion',
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: TaskDto })
  async get(@Session() session: UserSession, @Param('id') id: string): Promise<TaskDto> {
    const me = await this.me(session);
    const { task, role } = await this.tasks.getVisible(me, id);
    return (await this.views.toDtos(me, [task], role))[0]!;
  }

  @Post()
  @ApiBody({ schema: openApiSchema(createTaskSchema) })
  @ApiCreatedResponse({ type: TaskDto })
  @ApiConflictResponse({ description: 'TASK_LIMIT: ya hay 5 tareas abiertas' })
  async create(
    @Session() session: UserSession,
    @Body(new ZodPipe(createTaskSchema)) body: CreateTaskInput,
  ): Promise<TaskDto> {
    const me = await this.me(session);
    return this.views.one(me, await this.tasks.create(me, body), 'owner');
  }

  @Patch(':id')
  @ApiBody({ schema: openApiSchema(updateTaskSchema) })
  @ApiOkResponse({ type: TaskDto })
  async update(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body(new ZodPipe(updateTaskSchema)) body: UpdateTaskInput,
  ): Promise<TaskDto> {
    const me = await this.me(session);
    return this.views.one(me, await this.tasks.update(me, id, body), 'owner');
  }

  @Post(':id/complete')
  @HttpCode(200)
  @ApiOkResponse({ type: TaskDto })
  async complete(@Session() session: UserSession, @Param('id') id: string): Promise<TaskDto> {
    const me = await this.me(session);
    return this.views.one(me, await this.tasks.complete(me, id), 'owner');
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  async remove(@Session() session: UserSession, @Param('id') id: string): Promise<void> {
    await this.tasks.remove(await this.me(session), id);
  }

  /** «Deshacer» tras terminar o borrar (ventana de 8 s). */
  @Post(':id/restore')
  @HttpCode(200)
  @ApiOkResponse({ type: TaskDto })
  @ApiConflictResponse({ description: 'UNDO_EXPIRED · TASK_LIMIT' })
  async restore(@Session() session: UserSession, @Param('id') id: string): Promise<TaskDto> {
    const me = await this.me(session);
    return this.views.one(me, await this.tasks.restore(me, id), 'owner');
  }

  @Post(':id/accept')
  @HttpCode(200)
  @ApiOkResponse({ type: TaskDto })
  async accept(@Session() session: UserSession, @Param('id') id: string): Promise<TaskDto> {
    return this.respond(session, id, 'accept');
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOkResponse({ type: TaskDto })
  async reject(@Session() session: UserSession, @Param('id') id: string): Promise<TaskDto> {
    return this.respond(session, id, 'reject');
  }

  /** Enviar un «¡hurra!» a la dueña de una tarea terminada que acompañé. */
  @Post(':id/hurra')
  @HttpCode(200)
  @ApiOkResponse({ type: TaskDto })
  @ApiConflictResponse({ description: 'HURRA_ALREADY_SENT' })
  async hurra(@Session() session: UserSession, @Param('id') id: string): Promise<TaskDto> {
    const me = await this.me(session);
    return this.views.one(me, await this.tasks.hurra(me, id), 'companion');
  }

  /** «Gracias» por el ¡hurra! (la dueña, una vez). */
  @Post(':id/thanks')
  @HttpCode(200)
  @ApiOkResponse({ type: TaskDto })
  @ApiConflictResponse({ description: 'THANKS_ALREADY_SENT · NO_HURRA' })
  async thanks(@Session() session: UserSession, @Param('id') id: string): Promise<TaskDto> {
    const me = await this.me(session);
    return this.views.one(me, await this.tasks.thanks(me, id), 'owner');
  }

  /** Dejar de acompañar. */
  @Post(':id/leave')
  @HttpCode(200)
  @ApiOkResponse({ type: TaskDto })
  async leave(@Session() session: UserSession, @Param('id') id: string): Promise<TaskDto> {
    return this.respond(session, id, 'leave');
  }

  // ── Auxiliares ──────────────────────────────────────────────────────────────

  private me(session: UserSession): Promise<UserDocument> {
    return this.users.ensureProfile(session.user);
  }

  private async respond(
    session: UserSession,
    id: string,
    action: 'accept' | 'reject' | 'leave',
  ): Promise<TaskDto> {
    const me = await this.me(session);
    return this.views.one(me, await this.tasks.respond(me, id, action), 'companion');
  }
}
