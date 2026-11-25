import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test-app.js';

const PASSWORD = 'una-frase-larga-y-segura';

describe('Tiempo real (e2e)', () => {
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
  });

  /** Conecta como `name` (o sin sesión) y espera a «ready» o a la desconexión. */
  function connect(name?: string): Promise<Socket> {
    const socket = io(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      extraHeaders: name ? { cookie: cookies[name]! } : {},
    });
    sockets.push(socket);
    return new Promise((resolve, reject) => {
      socket.once('ready', () => resolve(socket));
      socket.once('disconnect', () => resolve(socket));
      socket.once('connect_error', reject);
    });
  }

  /** Espera un evento; falla si no llega en `ms`. */
  function next<T = unknown>(socket: Socket, event: string, ms = 3_000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Sin «${event}» en ${ms} ms`)), ms);
      socket.once(event, (payload: T) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });
  }

  /** Comprueba que NO llega un evento en `ms`. */
  function silent(socket: Socket, event: string, ms = 600): Promise<void> {
    return new Promise((resolve, reject) => {
      const onEvent = () => reject(new Error(`Llegó «${event}» y no debía`));
      socket.once(event, onEvent);
      setTimeout(() => {
        socket.off(event, onEvent);
        resolve();
      }, ms);
    });
  }

  /** Desconecta y espera a que el servidor lo procese (la presencia es asíncrona). */
  async function close(...list: Socket[]): Promise<void> {
    for (const s of list) s.disconnect();
    await new Promise((r) => setTimeout(r, 300));
  }

  let juanForMarta: string;

  beforeAll(async () => {
    t = await createTestApp();
    await t.app.listen(0, '127.0.0.1');
    const { port } = t.app.getHttpServer().address() as AddressInfo;
    url = `http://127.0.0.1:${port}`;
    http = request(t.app.getHttpServer());
    for (const name of ['Marta', 'Juan', 'Pepe']) await person(name);
    const res = await as('Marta')
      .post('/contacts', { name: 'Juan', email: 'juan@example.com' })
      .expect(201);
    juanForMarta = res.body.contact.id;
    const token = new URL(res.body.inviteUrl).searchParams.get('token');
    await as('Juan').post(`/invitations/${token}/accept`).expect(200);
  });

  afterAll(async () => {
    for (const s of sockets) s.disconnect();
    await t?.close();
  });

  it('sin sesión → se desconecta', async () => {
    const socket = await connect();
    expect(socket.connected).toBe(false);
  });

  it('cambio en una tarea: avisa a la dueña y a quien acompaña, sin contenido; a nadie más', async () => {
    const marta = await connect('Marta');
    const juan = await connect('Juan');
    const pepe = await connect('Pepe');

    const toMarta = next<unknown>(marta, 'home:changed');
    const toJuan = next<unknown>(juan, 'home:changed');
    const toPepe = silent(pepe, 'home:changed', 1_000);
    await as('Marta')
      .post('/tasks', { title: 'Hacer la renta', companionContactId: juanForMarta })
      .expect(201);

    expect(await toMarta).toBeUndefined(); // sin datos: la app pide /me/home
    await toJuan;
    await toPepe;
    await close(marta, juan, pepe);
  });

  it('presencia: Marta ve cuándo Juan abre y cierra la app; /me/home lo refleja', async () => {
    const marta = await connect('Marta');
    const online = next<{ contactId: string; present: boolean }>(marta, 'presence');
    const juan = await connect('Juan');
    expect(await online).toEqual({ contactId: juanForMarta, present: true });

    const home = await as('Marta').get('/me/home').expect(200);
    expect(home.body.presentContactIds).toEqual([juanForMarta]);

    // Dos dispositivos: solo «se va» al cerrar el último
    const juan2 = await connect('Juan');
    const noChange = silent(marta, 'presence');
    juan.disconnect();
    await noChange;
    const offline = next<{ contactId: string; present: boolean }>(marta, 'presence');
    juan2.disconnect();
    expect(await offline).toEqual({ contactId: juanForMarta, present: false });
    const after = await as('Marta').get('/me/home').expect(200);
    expect(after.body.presentContactIds).toEqual([]);
    await close(marta);
  });

  it('la presencia no se anuncia a quien no es contacto', async () => {
    const pepe = await connect('Pepe');
    const nothing = silent(pepe, 'presence');
    const marta = await connect('Marta');
    await nothing;
    await close(pepe, marta);
  });
});
