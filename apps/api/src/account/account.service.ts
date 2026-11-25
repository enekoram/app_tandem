import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { AuthService } from '@thallesp/nestjs-better-auth';
import type { Connection } from 'mongoose';
import { ContactsService } from '../contacts/contacts.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { SupportService } from '../support/support.service.js';
import type { UserDocument } from '../users/user.schema.js';
import { UsersService } from '../users/users.service.js';

/**
 * Eliminar cuenta (doc 02, RGPD). Todavía no hay cola `purge` (llega con el worker), así que
 * el borrado es inmediato: primero el dominio en una transacción y después la cuenta de
 * Better Auth (sesiones, credenciales y usuario).
 */
@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly users: UsersService,
    private readonly contacts: ContactsService,
    private readonly sessions: SessionsService,
    private readonly support: SupportService,
    private readonly auth: AuthService,
  ) {}

  async delete(me: UserDocument, authUserId: string): Promise<void> {
    await this.connection.transaction(async (session) => {
      await this.contacts.purgeAccount(me, session);
      await this.sessions.purgeAccount(me._id, session);
      await this.support.purgeAccount(me._id, session);
      // Mis tareas (abiertas, terminadas y borradas): quien me acompañaba deja de verlas
      await this.connection.collection('tasks').deleteMany({ owner_id: me._id }, { session });
      await this.users.purge(me._id, session);
    });
    try {
      const ctx = await this.auth.instance.$context;
      await ctx.internalAdapter.deleteUser(authUserId);
    } catch (error) {
      // Sin datos del dominio la cuenta queda vacía; se registra para borrarla a mano
      this.logger.error('No se ha podido borrar la cuenta de autenticación', error as Error);
      throw error;
    }
  }
}
