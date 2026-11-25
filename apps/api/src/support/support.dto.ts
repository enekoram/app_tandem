import { ApiProperty } from '@nestjs/swagger';
import { TaskPersonDto } from '../tasks/tasks.dto.js';

/** Petición de apoyo vista por quien pregunta (la otra persona, en su paleta). */
export class SupportRequestDto {
  @ApiProperty() id!: string;
  @ApiProperty() taskId!: string;
  @ApiProperty({ example: 'Estudiar inglés' }) taskTitle!: string;
  @ApiProperty({ type: String, nullable: true }) message!: string | null;
  @ApiProperty({ description: 'Cuándo se pidió (no caduca: espera respuesta)' }) createdAt!: string;

  @ApiProperty({ type: TaskPersonDto, nullable: true })
  person!: TaskPersonDto | null;
}

export class SendingDto {
  @ApiProperty() id!: string;
  @ApiProperty({ description: 'Como mucho 5 min por envío' }) expiresAt!: string;
}

export class SupportStateDto {
  @ApiProperty({ type: [SupportRequestDto], description: 'Me piden apoyo (sin responder)' })
  incoming!: SupportRequestDto[];

  @ApiProperty({ type: [SupportRequestDto], description: 'He pedido apoyo (sin respuesta)' })
  outgoing!: SupportRequestDto[];

  @ApiProperty({ type: [String], description: 'Contactos que me están enviando apoyo ahora' })
  sendingContactIds!: string[];
}
