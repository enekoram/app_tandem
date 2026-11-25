import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test-app.js';

const PASSWORD = 'una-frase-larga-y-segura';
const inMin = (min: number) => new Date(Date.now() + min * 60_000).toISOString();

describe('Sesiones (e2e)', () => {
  let t: TestApp;
  let http: ReturnType<typeof request>;
  const cookies: Record<string, string> = {};

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
    get: (url: string) => http.get(url).set('Cookie', cookies[name]!),
    post: (url: string, body?: object) =>
      http
        .post(url)
        .set('Cookie', cookies[name]!)
        .send(body ?? {}),
  });

  async function connect(owner: string, guest: string): Promise<string> {
    const res = await as(owner)
      .post('/contacts', { name: guest, email: `${guest.toLowerCase()}@example.com` })
      .expect(201);
    const token = new URL(res.body.inviteUrl).searchParams.get('token');
    await as(guest).post(`/invitations/${token}/accept`).expect(200);
    return res.body.contact.id as string;
  }

  /** Tarea de Marta acompañada (y aceptada) por Juan. */
  async function acceptedTask(title: string): Promise<string> {
    const id = (await as('Marta').post('/tasks', { title, companionContactId: juan }).expect(201))
      .body.id as string;
    await as('Juan').post(`/tasks/${id}/accept`).expect(200);
    return id;
  }

  let juan: string;
  let renta: string;
  let sessionId: string;

  beforeAll(async () => {
    t = await createTestApp();
    http = request(t.app.getHttpServer());
    for (const name of ['Marta', 'Juan', 'Pepe']) await person(name);
    juan = await connect('Marta', 'Juan');
    renta = await acceptedTask('Hacer la renta');
  });

  afterAll(async () => {
    await t?.close();
  });

  it('ErrProgramarSesion: una hora pasada → 400 SESSION_IN_PAST', async () => {
    const res = await as('Marta')
      .post('/sessions', { taskId: renta, scheduledAt: inMin(-30) })
      .expect(400);
    expect(res.body.code).toBe('SESSION_IN_PAST');
  });

  it('sin acompañante que haya aceptado → 409 NO_COMPANION', async () => {
    const pending = (
      await as('Marta')
        .post('/tasks', { title: 'Sin aceptar', companionContactId: juan })
        .expect(201)
    ).body.id;
    const res = await as('Marta')
      .post('/sessions', { taskId: pending, scheduledAt: inMin(60) })
      .expect(409);
    expect(res.body.code).toBe('NO_COMPANION');
  });

  it('programar: Marta invita; cada una ve a la otra persona en su paleta', async () => {
    const res = await as('Marta')
      .post('/sessions', { taskId: renta, scheduledAt: inMin(120) })
      .expect(201);
    sessionId = res.body.id;
    expect(res.body).toMatchObject({
      taskTitle: 'Hacer la renta',
      status: 'proposed',
      role: 'owner',
      proposedByMe: true,
      durationMin: 45,
      person: { name: 'Juan' },
    });
    const forJuan = await as('Juan').get(`/sessions/${sessionId}`).expect(200);
    expect(forJuan.body).toMatchObject({
      role: 'companion',
      proposedByMe: false,
      person: { name: 'Marta' },
    });
    expect((await as('Juan').get('/sessions').expect(200)).body).toHaveLength(1);
  });

  it('una sola sesión viva por tarea → 409 SESSION_EXISTS', async () => {
    const res = await as('Juan')
      .post('/sessions', { taskId: renta, scheduledAt: inMin(200) })
      .expect(409);
    expect(res.body).toMatchObject({ code: 'SESSION_EXISTS', sessionId });
  });

  it('solo quien NO propuso acepta; reprogramar la vuelve a dejar por confirmar', async () => {
    expect((await as('Marta').post(`/sessions/${sessionId}/accept`).expect(409)).body.code).toBe(
      'INVALID_STATE',
    );
    await as('Juan').post(`/sessions/${sessionId}/accept`).expect(200);

    const at = inMin(180);
    const moved = await as('Juan')
      .post(`/sessions/${sessionId}/propose`, { scheduledAt: at, message: 'Mejor más tarde' })
      .expect(200);
    expect(moved.body).toMatchObject({
      status: 'proposed',
      proposedByMe: true,
      message: 'Mejor más tarde',
      scheduledAt: new Date(at).toISOString(),
    });
    expect(moved.body.previousScheduledAt).not.toBeNull();
    const accepted = await as('Marta').post(`/sessions/${sessionId}/accept`).expect(200);
    expect(accepted.body).toMatchObject({ status: 'accepted', proposedByMe: false });
  });

  it('/me/home: la sesión aceptada para las dos; una propuesta ajena, en «Te piden»', async () => {
    const home = (await as('Marta').get('/me/home').expect(200)).body;
    expect(home.sessions).toMatchObject([{ id: sessionId, status: 'accepted' }]);
  });

  it('aún no se puede entrar a 3 h vista', async () => {
    const res = await as('Marta').post(`/sessions/${sessionId}/join`).expect(409);
    expect(res.body.code).toBe('NOT_STARTED');
  });

  it('cancelar una aceptada (cualquiera); la tarea vuelve a admitir sesión', async () => {
    const res = await as('Juan').post(`/sessions/${sessionId}/cancel`).expect(200);
    expect(res.body.status).toBe('cancelled');
    expect((await as('Marta').get('/sessions').expect(200)).body).toEqual([]);
  });

  it('una propuesta ajena se rechaza, no se cancela; la mía sí se retira', async () => {
    const s = (
      await as('Marta')
        .post('/sessions', { taskId: renta, scheduledAt: inMin(90) })
        .expect(201)
    ).body.id;
    await as('Juan').post(`/sessions/${s}/cancel`).expect(409);
    await as('Marta').post(`/sessions/${s}/cancel`).expect(200);

    const r = (
      await as('Marta')
        .post('/sessions', { taskId: renta, scheduledAt: inMin(90) })
        .expect(201)
    ).body.id;
    const rejected = await as('Juan').post(`/sessions/${r}/reject`).expect(200);
    expect(rejected.body.status).toBe('rejected');
  });

  it('unirse dentro de los 10 min previos: en vivo para las dos', async () => {
    const s = (
      await as('Marta')
        .post('/sessions', { taskId: renta, scheduledAt: inMin(5) })
        .expect(201)
    ).body.id;
    await as('Juan').post(`/sessions/${s}/accept`).expect(200);
    const joined = await as('Juan').post(`/sessions/${s}/join`).expect(200);
    expect(joined.body).toMatchObject({ status: 'live', joinedByMe: true, otherJoined: false });
    const forMarta = await as('Marta').get(`/sessions/${s}`).expect(200);
    expect(forMarta.body).toMatchObject({ status: 'live', joinedByMe: false, otherJoined: true });
  });

  it('si la tarea se termina, su sesión deja de verse', async () => {
    const [live] = (await as('Marta').get('/sessions').expect(200)).body as { id: string }[];
    await as('Marta').post(`/tasks/${renta}/complete`).expect(200);
    await as('Marta').get(`/sessions/${live!.id}`).expect(404);
    expect((await as('Juan').get('/sessions').expect(200)).body).toEqual([]);
  });

  it('persona ajena → 404 en todo', async () => {
    const task = await acceptedTask('Ir al gym');
    const s = (
      await as('Marta')
        .post('/sessions', { taskId: task, scheduledAt: inMin(60) })
        .expect(201)
    ).body.id;
    await as('Pepe').get(`/sessions/${s}`).expect(404);
    for (const action of ['accept', 'reject', 'cancel', 'join']) {
      await as('Pepe').post(`/sessions/${s}/${action}`).expect(404);
    }
    await as('Pepe')
      .post(`/sessions/${s}/propose`, { scheduledAt: inMin(70) })
      .expect(404);
    await as('Pepe')
      .post('/sessions', { taskId: task, scheduledAt: inMin(80) })
      .expect(404);
    expect((await as('Pepe').get('/sessions').expect(200)).body).toEqual([]);
    await http.get('/sessions').expect(401);
  });
});
