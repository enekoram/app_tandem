import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test-app.js';

const PASSWORD = 'una-frase-larga-y-segura';

/** Cookie de sesión de una respuesta de Better Auth (la que guardaría el cliente). */
function sessionCookie(res: request.Response): string {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  // La última: si Better Auth reintenta la transacción, manda una cookie por intento
  const session = cookies.filter((c) => c.includes('session_token')).at(-1);
  if (!session) throw new Error('La respuesta no trae cookie de sesión');
  return session.split(';')[0]!;
}

describe('Autenticación (e2e)', () => {
  let t: TestApp;
  let http: ReturnType<typeof request>;
  let db: Connection;

  beforeAll(async () => {
    t = await createTestApp();
    http = request(t.app.getHttpServer());
    db = t.app.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await t?.close();
  });

  function signUp(email: string, name = 'Marta', password = PASSWORD) {
    return http.post('/api/auth/sign-up/email').send({ email, name, password });
  }

  it('GET /me sin sesión → 401', async () => {
    await http.get('/me').expect(401);
  });

  it('registro: crea sesión y el perfil con «¿Cómo quieres que te llamemos?»', async () => {
    const res = await signUp('Marta@Example.com', '  Marta  ').expect(200);
    const cookie = sessionCookie(res);
    const me = await http.get('/me').set('Cookie', cookie).expect(200);
    expect(me.body).toMatchObject({
      displayName: 'Marta',
      email: 'marta@example.com',
      timezone: 'Europe/Madrid',
      stimulus: 'full',
    });

    const profile = await db.collection('users').findOne({ email: 'marta@example.com' });
    expect(profile).toMatchObject({ display_name: 'Marta', open_task_count: 0 });
  });

  it('rechaza contraseñas de menos de 8 caracteres', async () => {
    const res = await signUp('corta@example.com', 'Juan', '1234567').expect(400);
    expect(res.body.code).toBe('PASSWORD_TOO_SHORT');
  });

  it('rechaza nombres vacíos o de más de 40 caracteres', async () => {
    await signUp('vacio@example.com', '   ').expect(400);
    await signUp('largo@example.com', 'x'.repeat(41)).expect(400);
    expect(await db.collection('auth_users').countDocuments({ email: 'largo@example.com' })).toBe(
      0,
    );
  });

  it('no permite registrar dos veces el mismo email', async () => {
    await signUp('lucia@example.com', 'Lucía').expect(200);
    const res = await signUp('LUCIA@example.com', 'Otra');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await db.collection('auth_users').countDocuments({ email: 'lucia@example.com' })).toBe(
      1,
    );
  });

  it('inicio de sesión: contraseña incorrecta → 401; correcta → sesión', async () => {
    await http
      .post('/api/auth/sign-in/email')
      .send({ email: 'lucia@example.com', password: 'otra-cosa-distinta' })
      .expect(401);
    const ok = await http
      .post('/api/auth/sign-in/email')
      .send({ email: 'lucia@example.com', password: PASSWORD })
      .expect(200);
    await http.get('/me').set('Cookie', sessionCookie(ok)).expect(200);
  });

  it('recuperar contraseña: email con enlace, nueva contraseña y sesiones anteriores cerradas', async () => {
    const email = 'juan@example.com';
    const signup = await signUp(email, 'Juan').expect(200);
    const oldCookie = sessionCookie(signup);

    await http
      .post('/api/auth/request-password-reset')
      .send({ email, redirectTo: 'tandems://reset-password' })
      .expect(200);
    // El envío no se espera (para no revelar si el email existe): damos un respiro
    await new Promise((r) => setTimeout(r, 50));
    const mail = t.mailer.lastTo(email);
    expect(mail?.subject).toMatch(/contraseña nueva/);
    const link = mail!.text.match(/https?:\/\/\S+/)![0];
    const token = new URL(link).pathname.split('/').at(-1)!;

    await http
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'otra-frase-larga-y-nueva' })
      .expect(200);

    await http.get('/me').set('Cookie', oldCookie).expect(401);
    await http
      .post('/api/auth/sign-in/email')
      .send({ email, password: 'otra-frase-larga-y-nueva' })
      .expect(200);
  });

  it('pedir recuperación de un email que no existe responde igual y no envía nada', async () => {
    const before = t.mailer.sent.length;
    await http
      .post('/api/auth/request-password-reset')
      .send({ email: 'nadie@example.com', redirectTo: 'tandems://reset-password' })
      .expect(200);
    expect(t.mailer.sent.length).toBe(before);
  });

  it('no acepta redirecciones a sitios ajenos (el token no puede salir de la app)', async () => {
    const before = t.mailer.sent.length;
    await http
      .post('/api/auth/request-password-reset')
      .send({ email: 'lucia@example.com', redirectTo: 'https://malicioso.example.com/robar' })
      .expect(403);
    expect(t.mailer.sent.length).toBe(before);
  });
});
