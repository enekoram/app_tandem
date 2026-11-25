import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import { Contact, type ContactDocument } from '../contacts/contact.schema.js';
import type { TaskDocument } from '../tasks/task.schema.js';
import { personFrom } from '../tasks/tasks.dto.js';
import type { UserDocument } from '../users/user.schema.js';
import type { SupportEventDocument } from './support-event.schema.js';
import type { SupportRequestDto, SupportStateDto } from './support.dto.js';
import type { SupportState } from './support.service.js';

/** Apoyo tal como lo ve `me`: la otra persona con su color en mi paleta (una consulta). */
@Injectable()
export class SupportViews {
  constructor(@InjectModel(Contact.name) private readonly contacts: Model<Contact>) {}

  async state(me: UserDocument, s: SupportState): Promise<SupportStateDto> {
    const others = [
      ...s.incoming.map((x) => x.event.from_user),
      ...s.outgoing.map((x) => x.event.to_user),
      ...s.sendingToMe,
    ];
    const found = await this.mine(me, others);
    const contactOf = (id: Types.ObjectId) => found.find((c) => c.contact_user_id?.equals(id));
    return {
      incoming: s.incoming.map((x) => this.request(x, contactOf(x.event.from_user))),
      outgoing: s.outgoing.map((x) => this.request(x, contactOf(x.event.to_user))),
      sendingContactIds: s.sendingToMe.flatMap((id) => {
        const c = contactOf(id);
        return c ? [c.id as string] : [];
      }),
    };
  }

  async one(
    me: UserDocument,
    x: { event: SupportEventDocument; task: TaskDocument },
    other: Types.ObjectId,
  ): Promise<SupportRequestDto> {
    const [contact] = await this.mine(me, [other]);
    return this.request(x, contact);
  }

  private mine(me: UserDocument, users: Types.ObjectId[]): Promise<ContactDocument[]> {
    if (!users.length) return Promise.resolve([]);
    return this.contacts.find({
      owner_id: me._id,
      contact_user_id: { $in: users },
      status: { $in: ['pending', 'accepted'] },
    });
  }

  private request(
    { event, task }: { event: SupportEventDocument; task: TaskDocument },
    contact: ContactDocument | undefined,
  ): SupportRequestDto {
    return {
      id: event.id as string,
      taskId: task.id as string,
      taskTitle: task.title,
      message: event.message ?? null,
      createdAt: event.started_at.toISOString(),
      person: personFrom(contact),
    };
  }
}
