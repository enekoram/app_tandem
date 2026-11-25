import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { createContactSchema, type CreateContactInput } from '@tandems/shared';
import { openApiSchema, ZodPipe } from '../common/zod.js';
import { UsersService } from '../users/users.service.js';
import { ContactsService } from './contacts.service.js';
import { ContactDto, InviteResultDto, ResendResultDto, toContactDto } from './contacts.dto.js';
import { InviteLinks } from './invite-links.js';

/** Cabecera opcional con el enlace de la app (en desarrollo, la URL de Expo Go). */
const APP_LINK_HEADER = 'x-app-link';

@ApiTags('contacts')
@ApiCookieAuth()
@Controller('contacts')
export class ContactsController {
  constructor(
    private readonly contacts: ContactsService,
    private readonly users: UsersService,
    private readonly links: InviteLinks,
  ) {}

  @Get()
  @ApiOkResponse({ type: [ContactDto] })
  async list(@Session() session: UserSession): Promise<ContactDto[]> {
    const me = await this.users.ensureProfile(session.user);
    return (await this.contacts.list(me)).map(toContactDto);
  }

  @Get(':id')
  @ApiOkResponse({ type: ContactDto })
  @ApiNotFoundResponse()
  async get(@Session() session: UserSession, @Param('id') id: string): Promise<ContactDto> {
    const me = await this.users.ensureProfile(session.user);
    return toContactDto(await this.contacts.get(me, id));
  }

  /** Añadir contacto: crea la invitación y la envía por email. */
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiBody({ schema: openApiSchema(createContactSchema) })
  @ApiCreatedResponse({ type: InviteResultDto })
  @ApiConflictResponse({ description: 'CONTACT_EXISTS: ya está en tus contactos' })
  async invite(
    @Session() session: UserSession,
    @Body(new ZodPipe(createContactSchema)) body: Required<CreateContactInput>,
    @Headers('host') host?: string,
    @Headers(APP_LINK_HEADER) appLink?: string,
  ): Promise<InviteResultDto> {
    const me = await this.users.ensureProfile(session.user);
    const { contact, inviteUrl } = await this.contacts.invite(me, body, (token) =>
      this.links.landing(token, host, appLink),
    );
    return { contact: toContactDto(contact), inviteUrl };
  }

  @Post(':id/resend')
  @HttpCode(200)
  @ApiOkResponse({ type: ResendResultDto })
  async resend(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Headers('host') host?: string,
    @Headers(APP_LINK_HEADER) appLink?: string,
  ): Promise<ResendResultDto> {
    const me = await this.users.ensureProfile(session.user);
    const inviteUrl = await this.contacts.resend(me, id, (token) =>
      this.links.landing(token, host, appLink),
    );
    return { inviteUrl };
  }

  /** Cancelar invitación (pendiente) o eliminar contacto (aceptado, en los dos sentidos). */
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  async remove(@Session() session: UserSession, @Param('id') id: string): Promise<void> {
    const me = await this.users.ensureProfile(session.user);
    await this.contacts.remove(me, id);
  }
}
