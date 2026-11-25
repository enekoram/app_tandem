import { ApiProperty } from '@nestjs/swagger';
import {
  SESSION_DURATIONS,
  SESSION_STATUSES,
  sessionEndsAt,
  type SessionStatus,
} from '@tandems/shared';
import { TaskPersonDto } from '../tasks/tasks.dto.js';
import type { UserDocument } from '../users/user.schema.js';
import type { VisibleSession } from './sessions.service.js';

export class SessionDto {
  @ApiProperty() id!: string;
  @ApiProperty() taskId!: string;
  @ApiProperty({ example: 'Hacer la renta' }) taskTitle!: string;
  @ApiProperty({ description: 'ISO 8601 (UTC)' }) scheduledAt!: string;
  @ApiProperty({ enum: SESSION_DURATIONS }) durationMin!: number;
  @ApiProperty({ description: 'ISO 8601 (UTC)' }) endsAt!: string;

  @ApiProperty({ enum: SESSION_STATUSES, description: 'Estado efectivo (terminada si ya pasó)' })
  status!: SessionStatus;

  @ApiProperty({ enum: ['owner', 'companion'], description: 'Mi papel en la tarea' })
  role!: 'owner' | 'companion';

  @ApiProperty({ description: 'La propuesta actual es mía (la otra persona tiene que responder)' })
  proposedByMe!: boolean;

  @ApiProperty({ type: String, nullable: true, description: 'Hora anterior si se reprogramó' })
  previousScheduledAt!: string | null;

  @ApiProperty({ type: String, nullable: true }) message!: string | null;
  @ApiProperty({ type: String, nullable: true }) meetUrl!: string | null;

  @ApiProperty({
    type: TaskPersonDto,
    nullable: true,
    description: 'La otra persona, en mi paleta',
  })
  person!: TaskPersonDto | null;

  @ApiProperty() joinedByMe!: boolean;
  @ApiProperty() otherJoined!: boolean;
}

export function toSessionDto(
  me: UserDocument,
  { session, task, status }: VisibleSession,
  person: TaskPersonDto | null,
): SessionDto {
  const joinedByMe = session.joined.some((j) => j.user_id.equals(me._id));
  return {
    id: session.id as string,
    taskId: task.id as string,
    taskTitle: task.title,
    scheduledAt: session.scheduled_at.toISOString(),
    durationMin: session.duration_min,
    endsAt: new Date(sessionEndsAt(session.scheduled_at, session.duration_min)).toISOString(),
    status,
    role: session.owner_id.equals(me._id) ? 'owner' : 'companion',
    proposedByMe: session.proposed_by.equals(me._id),
    previousScheduledAt: session.previous_scheduled_at?.toISOString() ?? null,
    message: session.message ?? null,
    meetUrl: session.meet_url ?? null,
    person,
    joinedByMe,
    otherJoined: session.joined.some((j) => !j.user_id.equals(me._id)),
  };
}
