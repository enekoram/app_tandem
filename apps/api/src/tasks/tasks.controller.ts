import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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
import type { Model } from 'mongoose';
import { openApiSchema, ZodPipe } from '../common/zod.js';
import { Contact, type ContactDocument } from '../contacts/contact.schema.js';
import type { UserDocument } from '../users/user.schema.js';
import { UsersService } from '../users/users.service.js';
import type { TaskDocument } from './task.schema.js';
import { TaskDto, toTaskDto } from './tasks.dto.js';
import { TasksService, type TaskRole } from './tasks.service.js';

type ListStatus = 'open' | 'done';
const listStatus = (s: unknown): ListStatus => (s === 'done' ? 'done' : 'open');

@ApiTags('tasks')
@ApiCookieAuth()
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly users: UsersService,
    @InjectModel(Contact.name) private readonly contacts: Model<Contact>,
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
    return this.toDtos(me, await this.tasks.listMine(me, listStatus(status)), 'owner');
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
    return this.toDtos(me, await this.tasks.listAccompanying(me, listStatus(status)), 'companion');
  }

  @Get(':id')
  @ApiOkResponse({ type: TaskDto })
  async get(@Session() session: UserSession, @Param('id') id: string): Promise<TaskDto> {
    const me = await this.me(session);
    const { task, role } = await this.tasks.getVisible(me, id);
    return (await this.toDtos(me, [task], role))[0]!;
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
    return this.one(me, await this.tasks.create(me, body), 'owner');
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
    return this.one(me, await this.tasks.update(me, id, body), 'owner');
  }

  @Post(':id/complete')
  @HttpCode(200)
  @ApiOkResponse({ type: TaskDto })
  async complete(@Session() session: UserSession, @Param('id') id: string): Promise<TaskDto> {
    const me = await this.me(session);
    return this.one(me, await this.tasks.complete(me, id), 'owner');
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
    return this.one(me, await this.tasks.restore(me, id), 'owner');
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
    return this.one(me, await this.tasks.hurra(me, id), 'companion');
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
    return this.one(me, await this.tasks.respond(me, id, action), 'companion');
  }

  private async one(me: UserDocument, task: TaskDocument, role: TaskRole): Promise<TaskDto> {
    return (await this.toDtos(me, [task], role))[0]!;
  }

  /**
   * Añade «la otra persona» con UNA consulta de contactos de `me`:
   * dueña → el contacto que acompaña; acompañante → mi contacto de la dueña.
   */
  private async toDtos(
    me: UserDocument,
    tasks: TaskDocument[],
    role: TaskRole,
  ): Promise<TaskDto[]> {
    if (!tasks.length) return [];
    const filter =
      role === 'owner'
        ? { owner_id: me._id, _id: { $in: tasks.map((t) => t.companion.contact_id) } }
        : {
            owner_id: me._id,
            contact_user_id: { $in: tasks.map((t) => t.owner_id) },
            status: { $in: ['pending' as const, 'accepted' as const] },
          };
    const found: ContactDocument[] = await this.contacts.find(filter);
    return tasks.map((t) => {
      const person =
        role === 'owner'
          ? found.find((c) => c._id.equals(t.companion.contact_id))
          : found.find((c) => c.contact_user_id?.equals(t.owner_id));
      return toTaskDto(t, role, person);
    });
  }
}
