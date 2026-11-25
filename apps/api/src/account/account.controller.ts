import { Controller, Delete, HttpCode } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { UsersService } from '../users/users.service.js';
import { AccountService } from './account.service.js';

@ApiTags('me')
@ApiCookieAuth()
@Controller('me')
export class AccountController {
  constructor(
    private readonly users: UsersService,
    private readonly account: AccountService,
  ) {}

  /** Eliminar cuenta: borra tareas, contactos e invitaciones, y cierra todas las sesiones. */
  @Delete()
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Cuenta eliminada' })
  @ApiUnauthorizedResponse({ description: 'Sin sesión' })
  async delete(@Session() session: UserSession): Promise<void> {
    const me = await this.users.ensureProfile(session.user);
    await this.account.delete(me, session.user.id);
  }
}
