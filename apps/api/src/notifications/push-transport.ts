import { Injectable, Logger } from '@nestjs/common';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  /** Solo ids y la ruta de la app que se abre al tocarlo. */
  data: Record<string, string>;
}

export interface PushResult {
  /** Tokens que Expo dice que ya no existen (se borran). */
  invalidTokens: string[];
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Envío por la API de Expo Push (sin SDK: un POST). En los tests se sustituye. */
@Injectable()
export class PushTransport {
  private readonly logger = new Logger(PushTransport.name);

  async send(messages: PushMessage[]): Promise<PushResult> {
    if (!messages.length) return { invalidTokens: [] };
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages.map((m) => ({ ...m, sound: 'default' }))),
      });
      const json = (await res.json()) as {
        data?: { status: string; details?: { error?: string } }[];
      };
      const invalidTokens = (json.data ?? []).flatMap((ticket, i) =>
        ticket.details?.error === 'DeviceNotRegistered' ? [messages[i]!.to] : [],
      );
      return { invalidTokens };
    } catch (error) {
      // Privacidad: nunca se registra el contenido del aviso
      this.logger.warn(`No se han podido enviar avisos push: ${(error as Error).message}`);
      return { invalidTokens: [] };
    }
  }
}
