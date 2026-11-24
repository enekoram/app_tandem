import { Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Envío de emails. Se inyecta como clase abstracta para poder cambiarlo en los tests.
 * Privacidad: nunca se registra el contenido ni el destinatario completo.
 */
export abstract class Mailer {
  abstract send(message: EmailMessage): Promise<void>;
}

/**
 * Dominios reservados para pruebas (RFC 2606): nunca reciben correo. Enviarles provoca rebotes
 * que dañan la reputación del dominio de envío, así que no se envían.
 */
export function isReservedTestAddress(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return /(^|\.)(example\.(com|org|net))$|\.(test|example|invalid|localhost)$/.test(domain);
}

export class ResendMailer extends Mailer {
  private readonly logger = new Logger('Mailer');
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    super();
    this.resend = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    if (isReservedTestAddress(message.to)) {
      this.logger.warn('Email a una dirección de pruebas: no se envía');
      return;
    }
    const { error } = await this.resend.emails.send({ from: this.from, ...message });
    if (error) this.logger.error(`No se ha podido enviar un email (${error.name})`);
  }
}

/** Sin RESEND_API_KEY: no envía nada y lo avisa. */
export class DisabledMailer extends Mailer {
  private readonly logger = new Logger('Mailer');

  async send(): Promise<void> {
    this.logger.warn('RESEND_API_KEY no configurada: el email no se ha enviado');
  }
}
