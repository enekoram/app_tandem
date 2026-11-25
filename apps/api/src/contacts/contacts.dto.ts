import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  colorIdFor,
  CONTACT_STATUSES,
  PERSON_COLOR_IDS,
  type PersonColorId,
} from '@tandems/shared';
import type { ContactDocument } from './contact.schema.js';

export class ContactDto {
  @ApiProperty({ example: '665f1c2e8b3a4d0012345678' })
  id!: string;

  @ApiProperty({ example: 'Lucía' })
  name!: string;

  @ApiProperty({ example: 'lucia@email.com' })
  email!: string;

  @ApiProperty({ enum: CONTACT_STATUSES.filter((s) => s !== 'cancelled') })
  status!: 'pending' | 'accepted';

  @ApiProperty({ enum: PERSON_COLOR_IDS, description: 'Color de persona (usePersonStyle)' })
  color!: PersonColorId;

  @ApiProperty({ example: 'L', description: '1–2 letras o un emoji' })
  initials!: string;

  @ApiPropertyOptional({ nullable: true, type: String, description: 'Solo si ya tiene cuenta' })
  userId!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export function toContactDto(c: ContactDocument): ContactDto {
  return {
    id: c.id as string,
    name: c.name,
    email: c.invited_email,
    status: c.status === 'accepted' ? 'accepted' : 'pending',
    color: colorIdFor(c.color_index),
    initials: c.initials,
    userId: c.contact_user_id ? c.contact_user_id.toString() : null,
    createdAt: c.created_at.toISOString(),
  };
}

export class InviteResultDto {
  @ApiProperty({ type: ContactDto })
  contact!: ContactDto;

  @ApiProperty({ description: 'Enlace para la hoja de compartir (WhatsApp, Telegram…)' })
  inviteUrl!: string;
}

export class ResendResultDto {
  @ApiProperty()
  inviteUrl!: string;
}

export class InvitationPreviewDto {
  @ApiProperty({ example: 'Marta' })
  inviterName!: string;

  /** Cómo llamó a la persona invitada (para rellenar «¿Cómo quieres que te llamemos?»). */
  @ApiProperty({ example: 'Lucía' })
  invitedName!: string;

  /** Email al que llegó la invitación (RegistroInvitado lo muestra de solo lectura). */
  @ApiProperty({ example: 'lucia@example.com' })
  email!: string;
}
