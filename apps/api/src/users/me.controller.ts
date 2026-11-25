import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  DEFAULT_QUIET_HOURS,
  NOTIFICATION_KINDS,
  quietHoursSchema,
  type QuietHoursInput,
  notificationPrefsSchema,
  updateProfileSchema,
  type NotificationKind,
  type NotificationPrefsInput,
  type UpdateProfileInput,
} from '@tandems/shared';
import { AuthService, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { openApiSchema, ZodPipe } from '../common/zod.js';
import { STIMULUS_LEVELS, type UserDocument } from './user.schema.js';
import { UsersService } from './users.service.js';

export class MeDto {
  @ApiProperty({ example: '665f1c2e8b3a4d0012345678' })
  id!: string;

  @ApiProperty({ example: 'Marta', maxLength: 40 })
  displayName!: string;

  @ApiProperty({ example: 'marta@example.com' })
  email!: string;

  @ApiProperty({ example: 'Europe/Madrid' })
  timezone!: string;

  @ApiProperty({ enum: STIMULUS_LEVELS })
  stimulus!: (typeof STIMULUS_LEVELS)[number];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'boolean' },
    description: `Avisos activados (${NOTIFICATION_KINDS.join(', ')}); por defecto, todos`,
  })
  notifications!: Record<NotificationKind, boolean>;

  @ApiProperty({
    type: 'object',
    properties: {
      enabled: { type: 'boolean' },
      start: { type: 'string', example: '22:00' },
      end: { type: 'string', example: '08:00' },
    },
    required: ['enabled', 'start', 'end'],
    description: 'Horario de silencio (sin avisos push salvo recordatorios de sesión)',
  })
  quiet!: { enabled: boolean; start: string; end: string };
}

@ApiTags('me')
@ApiCookieAuth()
@Controller('me')
export class MeController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}

  /** Perfil de la persona autenticada. Solo devuelve datos de quien hace la petición. */
  @Get()
  @ApiOkResponse({ type: MeDto })
  @ApiUnauthorizedResponse({ description: 'Sin sesión' })
  async me(@Session() session: UserSession): Promise<MeDto> {
    return toMeDto(await this.users.ensureProfile(session.user));
  }

  /** Editar perfil: el nombre. El email es de solo lectura hasta que haya verificación. */
  @Patch()
  @ApiBody({ schema: openApiSchema(updateProfileSchema) })
  @ApiOkResponse({ type: MeDto })
  @ApiBadRequestResponse({ description: 'VALIDATION: nombre vacío o de más de 40 caracteres' })
  async update(
    @Session() session: UserSession,
    @Body(new ZodPipe(updateProfileSchema)) body: Required<UpdateProfileInput>,
  ): Promise<MeDto> {
    const me = await this.users.ensureProfile(session.user);
    const updated = await this.users.rename(me, body.displayName);
    // El nombre de la cuenta (Better Auth) va a la par: lo usan los emails de recuperar
    const ctx = await this.auth.instance.$context;
    await ctx.internalAdapter.updateUser(session.user.id, { name: body.displayName });
    return toMeDto(updated);
  }

  /** Horario de silencio. */
  @Patch('quiet')
  @ApiBody({ schema: openApiSchema(quietHoursSchema) })
  @ApiOkResponse({ type: MeDto })
  async quiet(
    @Session() session: UserSession,
    @Body(new ZodPipe(quietHoursSchema)) body: QuietHoursInput,
  ): Promise<MeDto> {
    const me = await this.users.ensureProfile(session.user);
    return toMeDto(await this.users.setQuiet(me, body));
  }

  /** NotificacionesKV: activar o desactivar cada tipo de aviso. */
  @Patch('notifications')
  @ApiBody({ schema: openApiSchema(notificationPrefsSchema) })
  @ApiOkResponse({ type: MeDto })
  async notifications(
    @Session() session: UserSession,
    @Body(new ZodPipe(notificationPrefsSchema)) body: NotificationPrefsInput,
  ): Promise<MeDto> {
    const me = await this.users.ensureProfile(session.user);
    return toMeDto(await this.users.setNotifications(me, body));
  }
}

/** Preferencias de avisos con los valores por defecto (todo activado). */
function notificationsOf(profile: UserDocument): Record<NotificationKind, boolean> {
  const saved = profile.prefs.notifications ?? {};
  return Object.fromEntries(NOTIFICATION_KINDS.map((k) => [k, saved[k] ?? true])) as Record<
    NotificationKind,
    boolean
  >;
}

function toMeDto(profile: UserDocument): MeDto {
  return {
    id: profile.id as string,
    displayName: profile.display_name,
    email: profile.email,
    timezone: profile.timezone,
    stimulus: profile.prefs.stimulus,
    notifications: notificationsOf(profile),
    quiet: profile.prefs.quiet ?? { ...DEFAULT_QUIET_HOURS },
  };
}
