import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import type { Env } from '../config/env.js';
import { publicOrigin } from '../links/reset-link.js';

export const INVITE_LANDING_PATH = '/enlace/invitacion';
const APP_INVITE = 'tandems://invitacion';

/** Enlaces de invitación: página intermedia y enlace profundo a la app. */
@Injectable()
export class InviteLinks {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private get isDev(): boolean {
    return this.config.get('NODE_ENV', { infer: true }) !== 'production';
  }

  /**
   * Enlace a la app permitido: `tandems://…` siempre; `exp://…` (Expo Go) solo en desarrollo.
   * Cualquier otra cosa se descarta (nunca se redirige a webs ajenas).
   */
  appLink(candidate: unknown): string {
    if (typeof candidate === 'string' && candidate.length < 300) {
      if (candidate.startsWith('tandems://')) return candidate;
      if (this.isDev && candidate.startsWith('exp://')) return candidate;
    }
    return APP_INVITE;
  }

  /** URL pública de la página de invitación (la que va en el email y en la hoja de compartir). */
  landing(token: string, host: string | undefined, appLink: unknown): string {
    const origin = publicOrigin(
      this.config.get('BETTER_AUTH_URL', { infer: true }),
      this.isDev,
      host,
    );
    const url = new URL(INVITE_LANDING_PATH, origin);
    url.searchParams.set('token', token);
    const app = this.appLink(appLink);
    if (app !== APP_INVITE) url.searchParams.set('app', app);
    return url.toString();
  }

  /** Botón «Abrir en Tandems»: enlace a la app con el token. */
  openInApp(token: string, appLink: unknown): string {
    const base = this.appLink(appLink);
    return `${base}${base.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
  }
}
