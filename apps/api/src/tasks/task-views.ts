import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Contact, type ContactDocument } from '../contacts/contact.schema.js';
import type { UserDocument } from '../users/user.schema.js';
import type { TaskDocument } from './task.schema.js';
import { toTaskDto, type TaskDto } from './tasks.dto.js';
import type { TaskRole } from './tasks.service.js';

/** Tareas tal como las ve `me`: con «la otra persona» en su paleta. */
@Injectable()
export class TaskViews {
  constructor(@InjectModel(Contact.name) private readonly contacts: Model<Contact>) {}

  /**
   * Añade «la otra persona» con UNA consulta de contactos de `me`:
   * dueña → el contacto que acompaña; acompañante → mi contacto de la dueña.
   */
  async toDtos(me: UserDocument, tasks: TaskDocument[], role: TaskRole): Promise<TaskDto[]> {
    if (!tasks.length) return [];
    const filter =
      role === 'owner'
        ? { owner_id: me._id, _id: { $in: tasks.map((t) => t.companion.contact_id) } }
        : {
            owner_id: me._id,
            contact_user_id: { $in: tasks.map((t) => t.owner_id) },
            status: { $in: ['pending' as const, 'accepted' as const] },
          };
    const found: ContactDocument[] = await this.contacts.find(filter);
    return tasks.map((t) => {
      const person =
        role === 'owner'
          ? found.find((c) => c._id.equals(t.companion.contact_id))
          : found.find((c) => c.contact_user_id?.equals(t.owner_id));
      return toTaskDto(t, role, person);
    });
  }

  async one(me: UserDocument, task: TaskDocument, role: TaskRole): Promise<TaskDto> {
    return (await this.toDtos(me, [task], role))[0]!;
  }
}
