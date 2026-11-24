import { ApiProperty } from '@nestjs/swagger';
import {
  colorIdFor,
  COMPANION_STATUSES,
  PERSON_COLOR_IDS,
  TASK_STATUSES,
  type CompanionStatus,
  type PersonColorId,
  type TaskStatus,
} from '@tandems/shared';
import type { ContactDocument } from '../contacts/contact.schema.js';
import type { TaskDocument } from './task.schema.js';
import type { TaskRole } from './tasks.service.js';

/** La otra persona de la tarea, vista desde quien pregunta (con su color en SU paleta). */
export class TaskPersonDto {
  @ApiProperty({ nullable: true, type: String, description: 'Contacto de quien pregunta' })
  contactId!: string | null;

  @ApiProperty({ example: 'Marta' })
  name!: string;

  @ApiProperty({ enum: PERSON_COLOR_IDS })
  color!: PersonColorId;

  @ApiProperty({ example: 'M' })
  initials!: string;

  @ApiProperty({ description: 'Aún no se ha unido a Tandems' })
  pendingContact!: boolean;
}

export class TaskDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'Hacer la renta' })
  title!: string;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  dueAt!: string | null;

  @ApiProperty({ enum: TASK_STATUSES })
  status!: TaskStatus;

  @ApiProperty({
    enum: ['owner', 'companion'],
    description: 'owner = mi tarea; companion = la acompaño',
  })
  role!: TaskRole;

  @ApiProperty({ enum: COMPANION_STATUSES })
  companionStatus!: CompanionStatus;

  @ApiProperty({
    type: TaskPersonDto,
    nullable: true,
    description: 'owner → quien me acompaña; companion → la dueña',
  })
  person!: TaskPersonDto | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  doneAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

function personFrom(contact: ContactDocument | undefined): TaskPersonDto | null {
  if (!contact) return null;
  return {
    contactId: contact.id as string,
    name: contact.name,
    color: colorIdFor(contact.color_index),
    initials: contact.initials,
    pendingContact: contact.status !== 'accepted',
  };
}

export function toTaskDto(task: TaskDocument, role: TaskRole, person?: ContactDocument): TaskDto {
  return {
    id: task.id as string,
    title: task.title,
    description: task.description ?? null,
    dueAt: task.due_at?.toISOString() ?? null,
    status: task.status,
    role,
    companionStatus: task.companion.status,
    person: personFrom(person),
    doneAt: task.done_at?.toISOString() ?? null,
    createdAt: task.created_at.toISOString(),
  };
}
