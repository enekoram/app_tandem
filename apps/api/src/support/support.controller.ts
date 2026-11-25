import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import {
  sendSupportSchema,
  supportRequestSchema,
  thinkingSchema,
  type SendSupportInput,
  type SupportRequestInput,
  type ThinkingInput,
} from '@tandems/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { openApiSchema, ZodPipe } from '../common/zod.js';
import { UsersService } from '../users/users.service.js';
import { SendingDto, SupportRequestDto } from './support.dto.js';
import { SupportViews } from './support-views.js';
import { SupportService } from './support.service.js';

@ApiTags('support')
@ApiCookieAuth()
@Controller('support')
export class SupportController {
  constructor(
    private readonly support: SupportService,
    private readonly users: UsersService,
    private readonly views: SupportViews,
  ) {}

  /** PedirApoyo: avisa a quien acompaña la tarea (queda abierta hasta que responda). */
  @Post('requests')
  @ApiBody({ schema: openApiSchema(supportRequestSchema) })
  @ApiCreatedResponse({ type: SupportRequestDto })
  @ApiConflictResponse({ description: 'NO_COMPANION' })
  async request(
    @Session() auth: UserSession,
    @Body(new ZodPipe(supportRequestSchema)) body: SupportRequestInput,
  ): Promise<SupportRequestDto> {
    const me = await this.users.ensureProfile(auth.user);
    const result = await this.support.request(me, body);
    return this.views.one(me, result, result.event.to_user);
  }

  /** «Ahora no». */
  @Post('requests/:id/decline')
  @HttpCode(204)
  @ApiNoContentResponse()
  async decline(@Session() auth: UserSession, @Param('id') id: string): Promise<void> {
    const me = await this.users.ensureProfile(auth.user);
    await this.support.decline(me, id);
  }

  /** Empezar a enviar apoyo (mantener pulsado). */
  @Post('sending')
  @ApiBody({ schema: openApiSchema(sendSupportSchema) })
  @ApiCreatedResponse({ type: SendingDto })
  async start(
    @Session() auth: UserSession,
    @Body(new ZodPipe(sendSupportSchema)) body: SendSupportInput,
  ): Promise<SendingDto> {
    const me = await this.users.ensureProfile(auth.user);
    const event = await this.support.startSending(me, body);
    return { id: event.id as string, expiresAt: event.expires_at!.toISOString() };
  }

  /** Latido mientras se mantiene pulsado (cada 3 s). */
  @Post('sending/:id/beat')
  @HttpCode(204)
  @ApiNoContentResponse()
  @ApiConflictResponse({ description: 'SUPPORT_OVER: ya ha terminado (5 min como máximo)' })
  async beat(@Session() auth: UserSession, @Param('id') id: string): Promise<void> {
    const me = await this.users.ensureProfile(auth.user);
    await this.support.beat(me, id);
  }

  /** Soltar. */
  @Post('sending/:id/end')
  @HttpCode(204)
  @ApiNoContentResponse()
  async end(@Session() auth: UserSession, @Param('id') id: string): Promise<void> {
    const me = await this.users.ensureProfile(auth.user);
    await this.support.end(me, id);
  }

  /** «Pensé en ti» (uno cada 10 min a la misma persona). */
  @Post('thinking')
  @HttpCode(204)
  @ApiBody({ schema: openApiSchema(thinkingSchema) })
  @ApiNoContentResponse()
  @ApiTooManyRequestsResponse({ description: 'THINKING_LIMIT' })
  async thinking(
    @Session() auth: UserSession,
    @Body(new ZodPipe(thinkingSchema)) body: ThinkingInput,
  ): Promise<void> {
    const me = await this.users.ensureProfile(auth.user);
    await this.support.thinking(me, body);
  }
}
