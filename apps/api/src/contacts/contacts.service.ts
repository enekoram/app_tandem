import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  assignInitials,
  pickColorIndex,
  type ContactStatus,
  type CreateContactInput,
} from '@tandems/shared';
import type { ClientSession, Connection, Model } from 'mongoose';
import { Types } from 'mongoose';
import { DomainError, notFound } from '../common/errors.js';
import { Mailer } from '../mail/mailer.js';
import { invitationEmail } from '../mail/templates.js';
import type { UserDocument } from '../users/user.schema.js';
import { UsersService } from '../users/users.service.js';
import { Contact, type ContactDocument } from './contact.schema.js';
import {
  Invitation,
  INVITATION_TTL_DAYS,
  MAX_RESENDS,
  RESEND_INTERVAL_MS,
  type InvitationDocument,
} from './invitation.schema.js';
import { hashToken, newInvitationToken } from './tokens.js';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Contactos vivos (no cancelados). */
const LIVE: { $in: ContactStatus[] } = { $in: ['pending', 'accepted'] };

/** Construye el enlace público de una invitación a partir de su token. */
export type InviteLinkBuilder = (token: string) => string;

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    @InjectModel(Contact.name) private readonly contacts: Model<Contact>,
    @InjectModel(Invitation.name) private readonly invitations: Model<Invitation>,
    @InjectConnection() private readonly connection: Connection,
    private readonly users: UsersService,
    private readonly mailer: Mailer,
  ) {}

  list(me: UserDocument): Promise<ContactDocument[]> {
    return this.contacts.find({ owner_id: me._id, status: LIVE }).sort({ created_at: 1 });
  }

  /** Contacto de `me` (404 si no existe o es de otra persona). */
  async get(me: UserDocument, id: string): Promise<ContactDocument> {
    if (!Types.ObjectId.isValid(id)) throw notFound('Contacto');
    const contact = await this.contacts.findOne({ _id: id, owner_id: me._id, status: LIVE });
    if (!contact) throw notFound('Contacto');
    return contact;
  }

  /** Invita a alguien: contacto «pendiente de unirse» + invitación por email. */
  async invite(
    me: UserDocument,
    input: Required<CreateContactInput>,
    link: InviteLinkBuilder,
  ): Promise<{ contact: ContactDocument; inviteUrl: string }> {
    const email = input.email;
    if (email === me.email) {
      throw new DomainError(HttpStatus.BAD_REQUEST, 'SELF_INVITE', 'No puedes invitarte a ti');
    }
    const existing = await this.contacts.findOne({
      owner_id: me._id,
      invited_email: email,
      status: LIVE,
    });
    if (existing) throw this.contactExists(existing);

    const { token, hash } = newInvitationToken();
    let contact!: ContactDocument;
    try {
      await this.connection.transaction(async (session) => {
        const used = await this.usedColors(me._id, session);
        const created = await this.contacts.create(
          [
            {
              owner_id: me._id,
              name: input.name,
              invited_email: email,
              status: 'pending',
              color_index: pickColorIndex(used),
              initials: '?',
            },
          ],
          { session },
        );
        contact = created[0]!;
        await this.invitations.create(
          [
            {
              inviter_id: me._id,
              contact_id: contact._id,
              email,
              token_hash: hash,
              expires_at: new Date(Date.now() + INVITATION_TTL_DAYS * DAY_MS),
              last_sent_at: new Date(),
            },
          ],
          { session },
        );
        await this.refreshInitials(me._id, session);
      });
    } catch (error) {
      // Dos invitaciones simultáneas al mismo email: gana una, la otra choca con el índice
      if ((error as { code?: number }).code === 11000) {
        const winner = await this.contacts.findOne({
          owner_id: me._id,
          invited_email: email,
          status: LIVE,
        });
        if (winner) throw this.contactExists(winner);
      }
      throw error;
    }

    const inviteUrl = link(token);
    this.sendInvitation(email, me.display_name, inviteUrl);
    const fresh = await this.contacts.findById(contact._id).orFail();
    return { contact: fresh, inviteUrl };
  }

  /** Reenvía una invitación pendiente con un enlace nuevo (el anterior deja de valer). */
  async resend(me: UserDocument, id: string, link: InviteLinkBuilder): Promise<string> {
    const contact = await this.get(me, id);
    if (contact.status !== 'pending') {
      throw new DomainError(HttpStatus.CONFLICT, 'NOT_PENDING', 'El contacto ya ha aceptado');
    }
    const invitation = await this.invitations.findOne({
      contact_id: contact._id,
      status: { $in: ['sent', 'opened'] },
    });
    if (!invitation) throw notFound('Invitación');
    if (
      invitation.resend_count >= MAX_RESENDS ||
      Date.now() - invitation.last_sent_at.getTime() < RESEND_INTERVAL_MS
    ) {
      throw new DomainError(
        HttpStatus.TOO_MANY_REQUESTS,
        'RESEND_LIMIT',
        'Has reenviado esta invitación hace poco o demasiadas veces',
      );
    }
    const { token, hash } = newInvitationToken();
    invitation.token_hash = hash;
    invitation.resend_count += 1;
    invitation.last_sent_at = new Date();
    invitation.expires_at = new Date(Date.now() + INVITATION_TTL_DAYS * DAY_MS);
    await invitation.save();
    const inviteUrl = link(token);
    this.sendInvitation(invitation.email, me.display_name, inviteUrl);
    return inviteUrl;
  }

  /**
   * Quita un contacto. Pendiente → se cancela la invitación (CancelarInvitacion).
   * Aceptado → se quita en los dos sentidos (EliminarContacto).
   */
  async remove(me: UserDocument, id: string): Promise<void> {
    const contact = await this.get(me, id);
    await this.connection.transaction(async (session) => {
      contact.status = 'cancelled';
      await contact.save({ session });
      await this.invitations.updateMany(
        { contact_id: contact._id, status: { $in: ['sent', 'opened'] } },
        { status: 'cancelled' },
        { session },
      );
      // Mis tareas con esta persona: el acompañamiento termina («se fue»)
      await this.endCompanionship(contact._id, session);
      if (contact.contact_user_id) {
        const other = await this.contacts.findOneAndUpdate(
          { owner_id: contact.contact_user_id, contact_user_id: me._id, status: LIVE },
          { status: 'cancelled' },
          { session },
        );
        if (other) {
          await this.endCompanionship(other._id, session);
          await this.refreshInitials(other.owner_id, session);
        }
      }
      await this.refreshInitials(me._id, session);
    });
  }

  // ── Invitaciones (lado de la persona invitada) ──────────────────────────────

  /** Invitación vigente por token (404/410 si no). No requiere sesión. */
  async findInvitation(
    token: string,
  ): Promise<{ invitation: InvitationDocument; inviter: UserDocument }> {
    const invitation = await this.invitations.findOne({ token_hash: hashToken(token) });
    if (!invitation || invitation.status === 'cancelled') {
      throw new DomainError(
        HttpStatus.NOT_FOUND,
        'INVITATION_NOT_FOUND',
        'Invitación no encontrada',
      );
    }
    if (invitation.status === 'accepted') {
      throw new DomainError(
        HttpStatus.GONE,
        'INVITATION_USED',
        'Esta invitación ya se ha aceptado',
      );
    }
    if (invitation.expires_at.getTime() < Date.now()) {
      throw new DomainError(HttpStatus.GONE, 'INVITATION_EXPIRED', 'Esta invitación ha caducado');
    }
    const inviter = await this.users.findById(invitation.inviter_id);
    if (!inviter) {
      throw new DomainError(
        HttpStatus.NOT_FOUND,
        'INVITATION_NOT_FOUND',
        'Invitación no encontrada',
      );
    }
    return { invitation, inviter };
  }

  async markOpened(invitation: InvitationDocument): Promise<void> {
    if (invitation.status === 'sent') {
      invitation.status = 'opened';
      await invitation.save();
    }
  }

  /**
   * Acepta una invitación: el contacto de quien invita pasa a aceptado y se crea (o acepta)
   * el contacto recíproco. Todo en una transacción. Devuelve el contacto de `me`.
   */
  async accept(me: UserDocument, token: string): Promise<ContactDocument> {
    const { invitation, inviter } = await this.findInvitation(token);
    if (inviter._id.equals(me._id)) {
      throw new DomainError(HttpStatus.BAD_REQUEST, 'SELF_INVITE', 'Es tu propia invitación');
    }
    let mine!: ContactDocument;
    await this.connection.transaction(async (session) => {
      const theirs = await this.contacts.findOneAndUpdate(
        { _id: invitation.contact_id, status: 'pending' },
        { contact_user_id: me._id, status: 'accepted', accepted_at: new Date() },
        { session, returnDocument: 'after' },
      );
      if (!theirs) {
        throw new DomainError(
          HttpStatus.GONE,
          'INVITATION_USED',
          'Esta invitación ya no está disponible',
        );
      }
      await this.invitations.updateOne(
        { _id: invitation._id },
        { status: 'accepted' },
        { session },
      );
      // Las tareas que ya esperaban a esta persona pasan a ser suyas para aceptarlas
      await this.tasksCollection.updateMany(
        { 'companion.contact_id': theirs._id },
        { $set: { 'companion.user_id': me._id } },
        { session },
      );

      // Mi lado: si yo también la había invitado, se acepta ese contacto; si no, se crea
      const existing = await this.contacts.findOne(
        { owner_id: me._id, invited_email: inviter.email, status: LIVE },
        null,
        { session },
      );
      if (existing) {
        existing.contact_user_id = inviter._id;
        existing.status = 'accepted';
        existing.accepted_at = new Date();
        mine = await existing.save({ session });
        await this.invitations.updateMany(
          { contact_id: existing._id, status: { $in: ['sent', 'opened'] } },
          { status: 'accepted' },
          { session },
        );
      } else {
        const used = await this.usedColors(me._id, session);
        const created = await this.contacts.create(
          [
            {
              owner_id: me._id,
              contact_user_id: inviter._id,
              name: inviter.display_name,
              invited_email: inviter.email,
              status: 'accepted',
              color_index: pickColorIndex(used),
              initials: '?',
              accepted_at: new Date(),
            },
          ],
          { session },
        );
        mine = created[0]!;
      }
      await this.refreshInitials(inviter._id, session);
      await this.refreshInitials(me._id, session);
    });
    return this.contacts.findById(mine._id).orFail();
  }

  // ── Auxiliares ──────────────────────────────────────────────────────────────

  private get tasksCollection() {
    return this.connection.collection('tasks');
  }

  /** Tareas abiertas acompañadas por este contacto → acompañante «se fue» (TareaAbandonada). */
  private async endCompanionship(contactId: Types.ObjectId, session: ClientSession): Promise<void> {
    await this.tasksCollection.updateMany(
      {
        'companion.contact_id': contactId,
        'companion.status': { $in: ['pending', 'accepted'] },
        status: 'open',
      },
      { $set: { 'companion.status': 'left', 'companion.changed_at': new Date() } },
      { session },
    );
  }

  private contactExists(existing: ContactDocument): DomainError {
    return new DomainError(
      HttpStatus.CONFLICT,
      'CONTACT_EXISTS',
      `${existing.name} ya está en tus contactos`,
      { contactId: existing.id as string, name: existing.name },
    );
  }

  private async usedColors(ownerId: Types.ObjectId, session: ClientSession): Promise<number[]> {
    const live = await this.contacts.find(
      { owner_id: ownerId, status: LIVE },
      { color_index: 1 },
      { session },
    );
    return live.map((c) => c.color_index);
  }

  /** Recalcula las iniciales de todos los contactos vivos de una persona (choques → 2 letras). */
  private async refreshInitials(ownerId: Types.ObjectId, session: ClientSession): Promise<void> {
    const live = await this.contacts
      .find({ owner_id: ownerId, status: LIVE }, { name: 1, initials: 1 }, { session })
      .sort({ created_at: 1 });
    const initials = assignInitials(live.map((c) => c.name));
    const ops = live
      .map((c, i) => ({ c, next: initials[i]! }))
      .filter(({ c, next }) => c.initials !== next)
      .map(({ c, next }) => ({
        updateOne: { filter: { _id: c._id }, update: { $set: { initials: next } } },
      }));
    if (ops.length) await this.contacts.bulkWrite(ops, { session });
  }

  /** Envío sin esperar: un fallo del proveedor no debe romper la invitación (se puede reenviar). */
  private sendInvitation(email: string, inviterName: string, url: string): void {
    this.mailer.send(invitationEmail(email, inviterName, url)).catch(() => {
      this.logger.warn('No se ha podido enviar una invitación');
    });
  }
}
