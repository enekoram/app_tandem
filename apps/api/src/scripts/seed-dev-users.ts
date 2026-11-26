/**
 * Crea cuentas de prueba en la base de DESARROLLO (nunca en producción).
 * Uso: pnpm --filter @tandems/api seed:users
 * Las contraseñas se generan al azar y se escriben en un archivo ignorado por git
 * (docs/pwd_usuarios_prueba.txt). Las cuentas que ya existen se saltan y el archivo no se
 * sobrescribe (se añaden solo las nuevas).
 */
import 'reflect-metadata';
import { randomInt } from 'node:crypto';
import { appendFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { UsersService } from '../users/users.service.js';

if (process.env.NODE_ENV === 'production') {
  console.error('seed:users no se ejecuta en producción.');
  process.exit(1);
}

const PEOPLE = ['Marta', 'Juan', 'Lucía', 'Javier', 'Ramón'];
const WORDS = ['nube', 'faro', 'mapa', 'tren', 'lima', 'vela', 'roca', 'pino', 'lago', 'sol'];

/** Contraseña fácil de teclear en el móvil: palabra-palabra-número (≥ 8 caracteres). */
function password(): string {
  const w = () => WORDS[randomInt(WORDS.length)]!;
  return `${w()}-${w()}-${randomInt(100, 1000)}`;
}

function emailFor(name: string): string {
  return `${name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()}@example.com`;
}

const { AppModule } = await import('../app.module.js');
const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
const auth = app.get(AuthService);
const users = app.get(UsersService);

const out = fileURLToPath(new URL('../../../../docs/pwd_usuarios_prueba.txt', import.meta.url));
if (!existsSync(out))
  writeFileSync(
    out,
    `Cuentas de prueba de DESARROLLO (base tandems_dev). Creadas el ${new Date().toISOString().slice(0, 16)}.\n` +
      'Archivo ignorado por git: no subir. Los emails son de example.com (no reciben correo).\n\n',
  );

for (const name of PEOPLE) {
  const email = emailFor(name);
  const pass = password();
  try {
    const result = await auth.api.signUpEmail({ body: { name, email, password: pass } });
    await users.ensureProfile({ id: result.user.id, name, email });
    appendFileSync(out, `${name.padEnd(7)} ${email.padEnd(20)} ${pass}\n`);
    console.warn(`· ${name}: creada`);
  } catch (error) {
    const code = (error as { body?: { code?: string } }).body?.code ?? (error as Error).message;
    console.warn(`· ${name}: no creada (${code})`);
  }
}

await app.close();
console.warn(`Contraseñas en ${out}`);
