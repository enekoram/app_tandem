import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { DisabledMailer, Mailer, ResendMailer } from './mailer.js';

@Global()
@Module({
  providers: [
    {
      provide: Mailer,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Mailer => {
        const key = config.get('RESEND_API_KEY', { infer: true });
        return key
          ? new ResendMailer(key, config.get('EMAIL_FROM', { infer: true }))
          : new DisabledMailer();
      },
    },
  ],
  exports: [Mailer],
})
export class MailModule {}
