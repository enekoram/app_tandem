import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Notifier } from '../src/notifications/notifier.js';
import { PushTransport, type PushMessage } from '../src/notifications/push-transport.js';
import { createTestApp, type TestApp } from './test-app.js';

const PASSWORD = 'una-frase-larga-y-segura';
const TOKEN = (name: string) => `ExponentPushToken[${name}-xxxxxxxx]`;

describe('Avisos push (e2e)', () => {
  let t: TestApp;
  let http: ReturnType<typeof request>;
  const cookies: Record<string, string> = {};
  const sent: PushMessage[] = [];

  async function person(name: string) {
    const res = await http
      .post('/api/auth/sign-up/email')
      .send({ name, email: `${name.toLowerCase()}@example.com`, password: PASSWORD })
      .expect(200);
    cookies[name] = ([] as string[])
      .concat(res.headers['set-cookie'] ?? [])
      .filter((c) => c.includes('session_token'))
      .at(-1)!
      .split(';')[0]!;
    await as(name).get('/me').expect(200);
  }

  const as = (name: string) => ({
    get: (path: string) => http.get(path).set('Cookie', cookies[name]!),
    post: (path: string, body?: object) =>
      http
        .post(path)
        .set('Cookie', cookies[name]!)
        .send(body ?? {}),
    patch: (path: string, body: object) =>
      http.patch(path).set('Cookie', cookies[name]!).send(body),
  });

  /** Espera a que llegue un aviso a `token` (los change streams son asíncronos). */
  async function pushTo(token: string, ms = 4_000): Promise<PushMessage> {
    const start = Date.now();
    while (Date.now() - start < ms) {
      const found = sent.find((m) => m.to === token);
      if (found) {
        sent.splice(sent.indexOf(found), 1);
        return found;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`No ha llegado ningún aviso a ${token}`);
  }

  async function nothingTo(token: string, ms = 1_000): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
    expect(sent.filter((m) => m.to === token)).toEqual([]);
  }

  let juan: string;
  let renta: string;

  beforeAll(async () => {
    t = await createTestApp();
    http = request(t.app.getHttpServer());
    // Envío falso: se guardan los mensajes en lugar de llamar a Expo
    const transport = t.app.get(PushTransport);
    transport.send = async (messages) => {
      sent.push(...messages);
      return { invalidTokens: [] };
    };
    for (const name of ['Marta', 'Juan']) await person(name);
    const res = await as('Marta')
      .post('/contacts', { name: 'Juan', email: 'juan@example.com' })
      .expect(201);
    juan = res.body.contact.id;
    const token = new URL(res.body.inviteUrl).searchParams.get('token');
    await as('Juan').post(`/invitations/${token}/accept`).expect(200);
    await as('Marta')
      .post('/me/devices', { token: TOKEN('marta'), platform: 'ios' })
      .expect(204);
    await as('Juan')
      .post('/me/devices', { token: TOKEN('juan'), platform: 'android' })
      .expect(204);
  });

  afterAll(async () => {
    await t?.close();
  });

  it('token no válido → 400', async () => {
    await as('Marta').post('/me/devices', { token: 'hola', platform: 'ios' }).expect(400);
  });

  it('tarea compartida: aviso a Juan, sin el título de la tarea', async () => {
    renta = (
      await as('Marta')
        .post('/tasks', { title: 'Hacer la renta (secreto)', companionContactId: juan })
        .expect(201)
    ).body.id;
    const push = await pushTo(TOKEN('juan'));
    expect(push.body).toBe('Marta quiere que le acompañes en una tarea');
    expect(JSON.stringify(push)).not.toContain('secreto');
    expect(push.data.url).toBe('/acompano');
    await as('Juan').post(`/tasks/${renta}/accept`).expect(200);
  });

  it('petición de apoyo: «Marta te pide apoyo»', async () => {
    await as('Marta').post('/support/requests', { taskId: renta }).expect(201);
    expect((await pushTo(TOKEN('juan'))).body).toBe('Marta te pide apoyo');
  });

  it('con el aviso desactivado, no llega', async () => {
    await as('Juan').patch('/me/notifications', { sessionInvites: false }).expect(200);
    await as('Marta')
      .post('/sessions', {
        taskId: renta,
        scheduledAt: new Date(Date.now() + 3_600_000).toISOString(),
      })
      .expect(201);
    await nothingTo(TOKEN('juan'));
  });

  it('¡hurra!: aviso a Marta', async () => {
    await as('Marta').post(`/tasks/${renta}/complete`).expect(200);
    expect((await pushTo(TOKEN('juan'))).body).toBe('Marta ha terminado una tarea');
    await as('Juan').post(`/tasks/${renta}/hurra`).expect(200);
    expect((await pushTo(TOKEN('marta'))).body).toBe('Juan te ha enviado un ¡hurra!');
  });

  it('«Gracias» por el ¡hurra!: solo la dueña, una vez; aviso a Juan', async () => {
    await as('Juan').post(`/tasks/${renta}/thanks`).expect(404);
    const res = await as('Marta').post(`/tasks/${renta}/thanks`).expect(200);
    expect(res.body.thanksAt).not.toBeNull();
    expect((await pushTo(TOKEN('juan'))).body).toBe('Marta te da las gracias por tu ¡hurra!');
    expect((await as('Marta').post(`/tasks/${renta}/thanks`).expect(409)).body.code).toBe(
      'THANKS_ALREADY_SENT',
    );
  });

  it('horario de silencio: dentro, no llega (salvo recordatorios); fuera, sí', async () => {
    const notifier = t.app.get(Notifier);
    const { Types } = await import('mongoose');
    const marta = new Types.ObjectId((await as('Marta').get('/me').expect(200)).body.id as string);
    const juanId = new Types.ObjectId((await as('Juan').get('/me').expect(200)).body.id as string);
    // Todo el día en silencio (00:00–23:59)
    const res = await as('Marta')
      .patch('/me/quiet', { enabled: true, start: '00:00', end: '23:59' })
      .expect(200);
    expect(res.body.quiet).toEqual({ enabled: true, start: '00:00', end: '23:59' });
    const base = { to: marta, from: juanId };
    expect(await notifier.notify({ ...base, kind: 'supportReceived', dedupeKey: 'quiet:1' })).toBe(
      false,
    );
    expect(await notifier.notify({ ...base, kind: 'sessionReminders', dedupeKey: 'quiet:2' })).toBe(
      true,
    );
    await pushTo(TOKEN('marta'));
    await as('Marta')
      .patch('/me/quiet', { enabled: false, start: '22:00', end: '08:00' })
      .expect(200);
    expect(await notifier.notify({ ...base, kind: 'supportReceived', dedupeKey: 'quiet:3' })).toBe(
      true,
    );
    await pushTo(TOKEN('marta'));
    await as('Marta')
      .patch('/me/quiet', { enabled: true, start: '25:00', end: '08:00' })
      .expect(400);
  });

  it('el mismo hecho nunca avisa dos veces (clave de idempotencia)', async () => {
    const notifier = t.app.get(Notifier);
    const marta = (await as('Marta').get('/me').expect(200)).body.id;
    const juanId = (await as('Juan').get('/me').expect(200)).body.id;
    const { Types } = await import('mongoose');
    const input = {
      to: new Types.ObjectId(marta as string),
      from: new Types.ObjectId(juanId as string),
      kind: 'supportReceived' as const,
      dedupeKey: 'prueba:1',
    };
    expect(await notifier.notify(input)).toBe(true);
    expect(await notifier.notify(input)).toBe(false);
    await pushTo(TOKEN('marta'));
  });
});
