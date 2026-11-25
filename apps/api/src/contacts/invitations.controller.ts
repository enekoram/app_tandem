import { Controller, Get, Header, HttpCode, Param, Post, Query } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AllowAnonymous, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { DomainError } from '../common/errors.js';
import { invalidInvitationPage, invitationLandingPage } from '../links/landing-page.js';
import { UsersService } from '../users/users.service.js';
import { ContactDto, InvitationPreviewDto, toContactDto } from './contacts.dto.js';
import { ContactsService } from './contacts.service.js';
import { INVITE_LANDING_PATH, InviteLinks } from './invite-links.js';
import { INVITATION_TOKEN_RE } from './tokens.js';

function checkToken(token: string): void {
  if (!INVITATION_TOKEN_RE.test(token)) {
    throw new DomainError(404, 'INVITATION_NOT_FOUND', 'Invitación no encontrada');
  }
}

@ApiTags('invitations')
@Controller()
export class InvitationsController {
  constructor(
    private readonly contacts: ContactsService,
    private readonly users: UsersService,
    private readonly links: InviteLinks,
  ) {}

  /** Vista previa para InvitacionApp («Marta te invita a su red de apoyo»). Sin sesión. */
  @Get('invitations/:token')
  @AllowAnonymous()
  @ApiOkResponse({ type: InvitationPreviewDto })
  @ApiNotFoundResponse({ description: 'INVITATION_NOT_FOUND' })
  @ApiGoneResponse({ description: 'INVITATION_EXPIRED · INVITATION_USED' })
  async preview(@Param('token') token: string): Promise<InvitationPreviewDto> {
    checkToken(token);
    const { invitation, inviter } = await this.contacts.findInvitation(token);
    await this.contacts.markOpened(invitation);
    const invitedName = await this.contacts.invitedName(invitation);
    // Quien tiene el enlace ya conoce el email (le llegó ahí): no se revela nada nuevo
    return { inviterName: inviter.display_name, invitedName, email: invitation.email };
  }

  @Post('invitations/:token/accept')
  @HttpCode(200)
  @ApiCookieAuth()
  @ApiOkResponse({ type: ContactDto, description: 'El contacto de quien te invitó, ya aceptado' })
  async accept(
    @Session() session: UserSession,
    @Param('token') token: string,
  ): Promise<ContactDto> {
    checkToken(token);
    const me = await this.users.ensureProfile(session.user);
    return toContactDto(await this.contacts.accept(me, token));
  }

  /** Página intermedia del enlace de invitación (email y hoja de compartir). */
  @Get(INVITE_LANDING_PATH)
  @AllowAnonymous()
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async landing(@Query('token') token: unknown, @Query('app') app: unknown): Promise<string> {
    if (typeof token !== 'string' || !INVITATION_TOKEN_RE.test(token))
      return invalidInvitationPage();
    try {
      const { invitation, inviter } = await this.contacts.findInvitation(token);
      await this.contacts.markOpened(invitation);
      return invitationLandingPage(inviter.display_name, this.links.openInApp(token, app));
    } catch {
      return invalidInvitationPage();
    }
  }
}
