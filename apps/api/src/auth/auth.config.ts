import { APIError, betterAuth } from 'better-auth';
import { haveIBeenPwned } from 'better-auth/plugins';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { expo } from '@better-auth/expo';
import type { Db, MongoClient } from 'mongodb';
import type { Env } from '../config/env.js';
import type { Mailer } from '../mail/mailer.js';
import { landingUrlFrom, publicOrigin } from '../links/reset-link.js';
import { resetPasswordEmail } from '../mail/templates.js';
import { DISPLAY_NAME_MAX } from '../users/user.schema.js';

/** Esquema de la app (app.json → expo.scheme). */
export const APP_SCHEME = 'tandems';
const DAY = 60 * 60 * 24;

export interface AuthDeps {
  env: Pick<Env, 'NODE_ENV' | 'BETTER_AUTH_SECRET' | 'BETTER_AUTH_URL'>;
  db: Db;
  client: MongoClient;
  mailer: Mailer;
}

/** Instancia de Better Auth (doc 01 §5 y doc 04 §A.1). */
export function createAuth({ env, db, client, mailer }: AuthDeps) {
  const isDev = env.NODE_ENV !== 'production';

  return betterAuth({
    appName: 'Tandems',
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    // Con `client` usa transacciones (Atlas y los tests corren en réplica)
    database: mongodbAdapter(db, { client }),
    telemetry: { enabled: false },
    // Better Auth desactiva la comprobación de origen en tests: la forzamos siempre para que
    // los tests cubran lo mismo que producción (redirecciones y CSRF).
    advanced: { disableOriginCheck: false },
    // Colecciones con prefijo para no confundirlas con `users` (perfil del dominio)
    user: { modelName: 'auth_users' },
    session: { modelName: 'auth_sessions', expiresIn: 60 * DAY, updateAge: DAY },
    account: { modelName: 'auth_accounts' },
    verification: { modelName: 'auth_verifications' },
    trustedOrigins: [
      `${APP_SCHEME}://`,
      // Expo Go en desarrollo abre la app con exp://<ip>:8081
      ...(isDev ? ['exp://', 'exp://**'] : []),
    ],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        const origin = publicOrigin(env.BETTER_AUTH_URL, isDev, request?.headers.get('host'));
        const link = landingUrlFrom(url, origin);
        // Sin await: el tiempo de respuesta no revela si el email existe
        void mailer.send(resetPasswordEmail(user.email, user.name, link));
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const name = user.name.trim();
            if (name.length < 1 || name.length > DISPLAY_NAME_MAX) {
              throw new APIError('BAD_REQUEST', {
                code: 'INVALID_DISPLAY_NAME',
                message: `El nombre debe tener entre 1 y ${DISPLAY_NAME_MAX} caracteres.`,
              });
            }
            return { data: { ...user, name } };
          },
          // Sin hook `after`: el registro corre en una transacción que puede reintentarse y
          // un perfil creado en un intento descartado quedaría huérfano. El perfil se crea en
          // GET /me, cuando la cuenta ya está confirmada.
        },
      },
    },
    plugins: [
      expo(),
      haveIBeenPwned({
        // En los tests no se llama a servicios externos
        enabled: env.NODE_ENV !== 'test',
        customPasswordCompromisedMessage:
          'Esta contraseña ha aparecido en filtraciones de datos. Elige otra.',
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
