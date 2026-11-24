import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import type { Connection } from 'mongoose';
import type { Env } from '../config/env.js';
import { Mailer } from '../mail/mailer.js';
import { createAuth } from './auth.config.js';

/**
 * Better Auth montado en /api/auth/* con un guard global: toda ruta exige sesión
 * salvo las marcadas con @AllowAnonymous().
 */
export const AuthModule = BetterAuthModule.forRootAsync({
  inject: [ConfigService, getConnectionToken(), Mailer],
  useFactory: (config: ConfigService<Env, true>, connection: Connection, mailer: Mailer) => {
    const client = connection.getClient();
    const db = connection.db;
    if (!db) throw new Error('MongoDB no está conectada');
    return {
      auth: createAuth({
        env: {
          NODE_ENV: config.get('NODE_ENV', { infer: true }),
          BETTER_AUTH_SECRET: config.get('BETTER_AUTH_SECRET', { infer: true }),
          BETTER_AUTH_URL: config.get('BETTER_AUTH_URL', { infer: true }),
        },
        db,
        client,
        mailer,
      }),
      bodyParser: { json: { limit: '1mb' }, urlencoded: { limit: '1mb', extended: true } },
    };
  },
});
