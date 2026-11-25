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
import { updateProfileSchema, type UpdateProfileInput } from '@tandems/shared';
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
}

function toMeDto(profile: UserDocument): MeDto {
  return {
    id: profile.id as string,
    displayName: profile.display_name,
    email: profile.email,
    timezone: profile.timezone,
    stimulus: profile.prefs.stimulus,
  };
}
