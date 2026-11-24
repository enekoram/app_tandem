import { Controller, Get, Header, Headers, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Env } from '../config/env.js';
import { invalidLinkPage, resetLandingPage } from './landing-page.js';
import { appLinkFor, isValidToken, publicOrigin, RESET_LANDING_PATH } from './reset-link.js';

/** Páginas públicas a las que llevan los enlaces de los emails (no forman parte de la API). */
@ApiExcludeController()
@AllowAnonymous()
@Controller()
export class LinksController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  @Get(RESET_LANDING_PATH)
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  resetPassword(
    @Query('token') token: unknown,
    @Query('callbackURL') callbackURL: unknown,
    @Headers('host') host?: string,
  ): string {
    if (!isValidToken(token)) return invalidLinkPage();
    const origin = publicOrigin(
      this.config.get('BETTER_AUTH_URL', { infer: true }),
      this.config.get('NODE_ENV', { infer: true }) !== 'production',
      host,
    );
    // callbackURL lo valida Better Auth (solo orígenes de confianza) al pulsar el botón
    const callback =
      typeof callbackURL === 'string' && callbackURL.length < 500 ? callbackURL : undefined;
    return resetLandingPage(appLinkFor(origin, token, callback));
  }
}
