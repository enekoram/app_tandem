import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Contact } from '../contacts/contact.schema.js';
import { personFrom } from '../tasks/tasks.dto.js';
import type { UserDocument } from '../users/user.schema.js';
import { toSessionDto, type SessionDto } from './sessions.dto.js';
import type { VisibleSession } from './sessions.service.js';

/** Sesiones tal como las ve `me`: la otra persona con su color en mi paleta (una consulta). */
@Injectable()
export class SessionViews {
  constructor(@InjectModel(Contact.name) private readonly contacts: Model<Contact>) {}

  async toDtos(me: UserDocument, views: VisibleSession[]): Promise<SessionDto[]> {
    if (!views.length) return [];
    const others = views.map(({ session }) =>
      session.owner_id.equals(me._id) ? session.companion_user_id : session.owner_id,
    );
    const found = await this.contacts.find({
      owner_id: me._id,
      contact_user_id: { $in: others },
      status: { $in: ['pending', 'accepted'] },
    });
    return views.map((view, i) => {
      const contact = found.find((c) => c.contact_user_id?.equals(others[i]!));
      return toSessionDto(me, view, personFrom(contact));
    });
  }

  async one(me: UserDocument, view: VisibleSession): Promise<SessionDto> {
    return (await this.toDtos(me, [view]))[0]!;
  }
}
