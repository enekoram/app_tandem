import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test-app.js';

const PASSWORD = 'una-frase-larga-y-segura';

describe('Apoyo (e2e)', () => {
  let t: TestApp;
  let http: ReturnType<typeof request>;
  let url: string;
  const cookies: Record<string, string> = {};
  const sockets: Socket[] = [];

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

  function connect(name: string): Promise<Socket> {
    const socket = io(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      extraHeaders: { cookie: cookies[name]! },
    });
    sockets.push(socket);
    return new Promise((resolve, reject) => {
      socket.once('ready', () => resolve(socket));
      socket.once('connect_error', reject);
    });
  }

  function next<T>(socket: Socket, event: string, ms = 3_000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Sin «${event}» en ${ms} ms`)), ms);
      socket.once(event, (payload: T) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });
  }

  let juanForMarta: string;
  let martaForJuan: string;
  let renta: string;

  beforeAll(async () => {
    t = await createTestApp();
    await t.app.listen(0, '127.0.0.1');
    url = `http://127.0.0.1:${(t.app.getHttpServer().address() as AddressInfo).port}`;
    http = request(t.app.getHttpServer());
    for (const name of ['Marta', 'Juan', 'Pepe']) await person(name);
    const res = await as('Marta')
      .post('/contacts', { name: 'Juan', email: 'juan@example.com' })
      .expect(201);
    juanForMarta = res.body.contact.id;
    const token = new URL(res.body.inviteUrl).searchParams.get('token');
    await as('Juan').post(`/invitations/${token}/accept`).expect(200);
    martaForJuan = (await as('Juan').get('/contacts').expect(200)).body[0].id;
    renta = (
      await as('Marta')
        .post('/tasks', { title: 'Hacer la renta', companionContactId: juanForMarta })
        .expect(201)
    ).body.id;
    await as('Juan').post(`/tasks/${renta}/accept`).expect(200);
  });

  afterAll(async () => {
    for (const s of sockets) s.disconnect();
    await t?.close();
  });

  it('pedir apoyo: le llega a Juan en «Te piden»; repetir no duplica', async () => {
    const res = await as('Marta')
      .post('/support/requests', { taskId: renta, message: 'Me cuesta empezar' })
      .expect(201);
    expect(res.body).toMatchObject({
      taskTitle: 'Hacer la renta',
      message: 'Me cuesta empezar',
      person: { name: 'Juan' },
    });
    const again = await as('Marta').post('/support/requests', { taskId: renta }).expect(201);
    expect(again.body.id).toBe(res.body.id);

    const juanHome = (await as('Juan').get('/me/home').expect(200)).body;
    expect(juanHome.support.incoming).toMatchObject([
      { id: res.body.id, person: { name: 'Marta' }, taskTitle: 'Hacer la renta' },
    ]);
    const martaHome = (await as('Marta').get('/me/home').expect(200)).body;
    expect(martaHome.support.outgoing).toHaveLength(1);
  });

  it('enviar apoyo: corazón en vivo para Marta (empieza, late, termina) y la petición queda atendida', async () => {
    const marta = await connect('Marta');
    const started = next<{ contactId: string; state: string }>(marta, 'support');
    const sending = await as('Juan').post('/support/sending', { taskId: renta }).expect(201);
    expect(await started).toEqual({ contactId: juanForMarta, state: 'started' });

    const home = (await as('Marta').get('/me/home').expect(200)).body;
    expect(home.support.sendingContactIds).toEqual([juanForMarta]);
    expect(home.support.outgoing).toEqual([]);

    const beat = next(marta, 'support');
    await as('Juan').post(`/support/sending/${sending.body.id}/beat`).expect(204);
    expect(await beat).toEqual({ contactId: juanForMarta, state: 'beat' });

    const ended = next(marta, 'support');
    await as('Juan').post(`/support/sending/${sending.body.id}/end`).expect(204);
    expect(await ended).toEqual({ contactId: juanForMarta, state: 'ended' });
    // Soltar dos veces no es un error; latir después, sí (ya terminó)
    await as('Juan').post(`/support/sending/${sending.body.id}/end`).expect(204);
    expect(
      (await as('Juan').post(`/support/sending/${sending.body.id}/beat`).expect(409)).body.code,
    ).toBe('SUPPORT_OVER');
    marta.disconnect();
  });

  it('«Ahora no»: solo quien la recibe', async () => {
    const req = (await as('Marta').post('/support/requests', { taskId: renta }).expect(201)).body;
    await as('Marta').post(`/support/requests/${req.id}/decline`).expect(404);
    await as('Juan').post(`/support/requests/${req.id}/decline`).expect(204);
    expect((await as('Juan').get('/me/home').expect(200)).body.support.incoming).toEqual([]);
  });

  it('«Pensé en ti»: le llega a Marta con su contacto; dos seguidos → 429', async () => {
    const marta = await connect('Marta');
    const thought = next<{ contactId: string }>(marta, 'thinking');
    await as('Juan').post('/support/thinking', { contactId: martaForJuan }).expect(204);
    expect(await thought).toEqual({ contactId: juanForMarta });
    const res = await as('Juan').post('/support/thinking', { contactId: martaForJuan }).expect(429);
    expect(res.body.code).toBe('THINKING_LIMIT');
    marta.disconnect();
  });

  it('persona ajena → 404 en todo', async () => {
    const req = (await as('Marta').post('/support/requests', { taskId: renta }).expect(201)).body;
    await as('Pepe').post('/support/requests', { taskId: renta }).expect(404);
    await as('Pepe').post(`/support/requests/${req.id}/decline`).expect(404);
    await as('Pepe').post('/support/sending', { taskId: renta }).expect(404);
    await as('Pepe').post('/support/thinking', { contactId: juanForMarta }).expect(404);
    const sending = (await as('Juan').post('/support/sending', { taskId: renta }).expect(201)).body;
    await as('Pepe').post(`/support/sending/${sending.id}/beat`).expect(404);
    // La dueña no puede enviarse apoyo a sí misma
    await as('Marta').post('/support/sending', { taskId: renta }).expect(404);
    await http.post('/support/thinking').send({ contactId: juanForMarta }).expect(401);
  });

  it('preferencias de avisos: todas activadas por defecto; se cambian una a una', async () => {
    const me = (await as('Marta').get('/me').expect(200)).body;
    expect(me.notifications).toMatchObject({ supportRequests: true, hurras: true });
    const res = await as('Marta').patch('/me/notifications', { hurras: false }).expect(200);
    expect(res.body.notifications).toMatchObject({ hurras: false, supportRequests: true });
    await as('Marta').patch('/me/notifications', { inventado: true }).expect(400);
  });
});
