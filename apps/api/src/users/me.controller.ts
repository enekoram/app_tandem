import { Controller, Get } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { STIMULUS_LEVELS } from './user.schema.js';
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
  constructor(private readonly users: UsersService) {}

  /** Perfil de la persona autenticada. Solo devuelve datos de quien hace la petición. */
  @Get()
  @ApiOkResponse({ type: MeDto })
  @ApiUnauthorizedResponse({ description: 'Sin sesión' })
  async me(@Session() session: UserSession): Promise<MeDto> {
    const profile = await this.users.ensureProfile(session.user);
    return {
      id: profile.id as string,
      displayName: profile.display_name,
      email: profile.email,
      timezone: profile.timezone,
      stimulus: profile.prefs.stimulus,
    };
  }
}
