import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { Types } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test-app.js';

const PASSWORD = 'una-frase-larga-y-segura';

describe('Tareas (e2e)', () => {
  let t: TestApp;
  let http: ReturnType<typeof request>;
  let db: Connection;
  const cookies: Record<string, string> = {};

  async function person(name: string) {
    const res = await http
      .post('/api/auth/sign-up/email')
      .send({ name, email: `${name.toLowerCase()}@example.com`, password: PASSWORD })
      .expect(200);
    const all = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    cookies[name] = all
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
    patch: (url: string, body: object) => http.patch(url).set('Cookie', cookies[name]!).send(body),
    del: (url: string) => http.delete(url).set('Cookie', cookies[name]!),
  });

  /** `owner` invita a `guest` (que acepta si `accept`). Devuelve el id del contacto de `owner`. */
  async function connect(owner: string, guest: string, accept = true): Promise<string> {
    const res = await as(owner)
      .post('/contacts', { name: guest, email: `${guest.toLowerCase()}@example.com` })
      .expect(201);
    if (accept) {
      const token = new URL(res.body.inviteUrl).searchParams.get('token');
      await as(guest).post(`/invitations/${token}/accept`).expect(200);
    }
    return res.body.contact.id as string;
  }

  const task = (title: string, companionContactId: string) => ({ title, companionContactId });

  let juan: string; // contacto de Marta (aceptado)
  let lucia: string; // contacto de Marta (pendiente de unirse)
  let first: string; // tarea de Marta con Juan

  beforeAll(async () => {
    t = await createTestApp();
    http = request(t.app.getHttpServer());
    db = t.app.get<Connection>(getConnectionToken());
    for (const name of ['Marta', 'Juan', 'Pepe', 'Rosa']) await person(name);
    juan = await connect('Marta', 'Juan');
    lucia = await connect('Marta', 'Lucia', false);
  });

  afterAll(async () => {
    await t?.close();
  });

  it('crear: abierta, con acompañante pendiente y la persona con su color', async () => {
    const res = await as('Marta')
      .post('/tasks', { ...task(' Hacer la renta ', juan), dueAt: '2026-11-25T09:30:00+01:00' })
      .expect(201);
    expect(res.body).toMatchObject({
      title: 'Hacer la renta',
      status: 'open',
      role: 'owner',
      companionStatus: 'pending',
      dueAt: '2026-11-25T08:30:00.000Z',
      person: {
        contactId: juan,
        name: 'Juan',
        color: 'lilac',
        initials: 'J',
        pendingContact: false,
      },
    });
    first = res.body.id;
  });

  it('validación: acompañante obligatorio, título ≤ 80 y contacto propio', async () => {
    await as('Marta').post('/tasks', { title: 'Sin acompañante' }).expect(400);
    await as('Marta')
      .post('/tasks', task('x'.repeat(81), juan))
      .expect(400);
    const ajeno = await as('Pepe').post('/tasks', task('Con contacto ajeno', juan)).expect(404);
    expect(ajeno.body.code).toBe('CONTACT_NOT_FOUND');
  });

  it('el acompañante la ve en «Acompaño» con la dueña en su paleta y puede aceptarla', async () => {
    const list = await as('Juan').get('/tasks/accompanying').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({
      id: first,
      role: 'companion',
      companionStatus: 'pending',
      person: { name: 'Marta', color: 'lilac', initials: 'M' },
    });
    const res = await as('Juan').post(`/tasks/${first}/accept`).expect(200);
    expect(res.body.companionStatus).toBe('accepted');
    await as('Juan').post(`/tasks/${first}/accept`).expect(409);
  });

  it('límite de 5: la sexta → 409 TASK_LIMIT', async () => {
    for (let i = 2; i <= 5; i++)
      await as('Marta')
        .post('/tasks', task(`Tarea ${i}`, juan))
        .expect(201);
    const res = await as('Marta').post('/tasks', task('Sexta', juan)).expect(409);
    expect(res.body.code).toBe('TASK_LIMIT');
    expect((await as('Marta').get('/tasks')).body).toHaveLength(5);
  });

  it('concurrencia: 10 creaciones a la vez con 4 abiertas → exactamente 1 éxito', async () => {
    const rosaJuan = await connect('Rosa', 'Juan');
    for (let i = 1; i <= 4; i++)
      await as('Rosa')
        .post('/tasks', task(`R${i}`, rosaJuan))
        .expect(201);
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        as('Rosa').post('/tasks', task(`Carrera ${i}`, rosaJuan)),
      ),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(9);
    const profile = await db.collection('users').findOne({ email: 'rosa@example.com' });
    expect(profile?.open_task_count).toBe(5);
    expect(
      await db.collection('tasks').countDocuments({ owner_id: profile!._id, status: 'open' }),
    ).toBe(5);
  });

  it('terminar libera un hueco; deshacer la vuelve a abrir si hay sitio', async () => {
    const done = await as('Marta').post(`/tasks/${first}/complete`).expect(200);
    expect(done.body).toMatchObject({ status: 'done', doneAt: expect.any(String) });
    expect(
      (await as('Marta').get('/tasks?status=done')).body.map((x: { id: string }) => x.id),
    ).toEqual([first]);

    await as('Marta').post(`/tasks/${first}/restore`).expect(200);
    expect((await as('Marta').get('/tasks')).body).toHaveLength(5);
  });

  it('deshacer no salta el límite: si mientras tanto llegó a 5 → 409 TASK_LIMIT', async () => {
    await as('Marta').post(`/tasks/${first}/complete`).expect(200);
    await as('Marta').post('/tasks', task('Ocupa el hueco', juan)).expect(201);
    const res = await as('Marta').post(`/tasks/${first}/restore`).expect(409);
    expect(res.body.code).toBe('TASK_LIMIT');
  });

  it('borrar y deshacer dentro de la ventana; fuera de ella → 409 UNDO_EXPIRED', async () => {
    const open = (await as('Marta').get('/tasks')).body as { id: string }[];
    const victim = open.at(-1)!.id;
    await as('Marta').del(`/tasks/${victim}`).expect(204);
    await as('Marta').get(`/tasks/${victim}`).expect(404);
    await as('Marta').post(`/tasks/${victim}/restore`).expect(200);

    await as('Marta').del(`/tasks/${victim}`).expect(204);
    await db
      .collection('tasks')
      .updateOne(
        { _id: new Types.ObjectId(victim) },
        { $set: { deleted_at: new Date(Date.now() - 60_000) } },
      );
    const res = await as('Marta').post(`/tasks/${victim}/restore`).expect(409);
    expect(res.body.code).toBe('UNDO_EXPIRED');
  });

  it('acompañante pendiente de unirse: al aceptar la invitación, la tarea le llega', async () => {
    const created = await as('Marta').post('/tasks', task('Portfolio', lucia)).expect(201);
    expect(created.body.person).toMatchObject({ name: 'Lucia', pendingContact: true });

    await person('Lucia');
    const invitation = await db.collection('invitations').findOne({ email: 'lucia@example.com' });
    // El token solo existe en el email: lo sacamos del buzón falso
    const mail = t.mailer.lastTo('lucia@example.com')!;
    const token = new URL(mail.text.match(/https?:\/\/\S+/)![0]).searchParams.get('token');
    expect(invitation).toBeTruthy();
    await as('Lucia').post(`/invitations/${token}/accept`).expect(200);

    const list = await as('Lucia').get('/tasks/accompanying').expect(200);
    expect(list.body.map((x: { title: string }) => x.title)).toContain('Portfolio');
  });

  it('dejar de acompañar y cambiar de acompañante (vuelve a pendiente)', async () => {
    const open = (await as('Marta').get('/tasks')).body as {
      id: string;
      companionStatus: string;
      person?: { contactId: string };
    }[];
    const withJuan = open.find(
      (x) => x.companionStatus === 'pending' && x.person?.contactId === juan,
    )!.id;
    await as('Juan').post(`/tasks/${withJuan}/accept`).expect(200);
    const left = await as('Juan').post(`/tasks/${withJuan}/leave`).expect(200);
    expect(left.body.companionStatus).toBe('left');

    const changed = await as('Marta')
      .patch(`/tasks/${withJuan}`, { companionContactId: lucia })
      .expect(200);
    expect(changed.body).toMatchObject({ companionStatus: 'pending', person: { name: 'Lucia' } });
  });

  it('rechazar: la tarea deja de verse para quien rechaza', async () => {
    const created = await as('Marta').post('/tasks', task('Para rechazar', juan));
    // Marta puede estar en 5: si es así, se libera un hueco primero
    let id = created.body.id as string | undefined;
    if (created.status === 409) {
      const open = (await as('Marta').get('/tasks')).body as { id: string }[];
      await as('Marta').post(`/tasks/${open[0]!.id}/complete`).expect(200);
      id = (await as('Marta').post('/tasks', task('Para rechazar', juan)).expect(201)).body.id;
    }
    await as('Juan').post(`/tasks/${id}/reject`).expect(200);
    await as('Juan').get(`/tasks/${id}`).expect(404);
    expect((await as('Marta').get(`/tasks/${id}`)).body.companionStatus).toBe('rejected');
  });

  it('eliminar el contacto deja sus tareas con acompañante «se fue»', async () => {
    const before = (await as('Juan').get('/tasks/accompanying')).body as { id: string }[];
    expect(before.length).toBeGreaterThan(0);
    await as('Marta').del(`/contacts/${juan}`).expect(204);
    const tasks = (await as('Marta').get('/tasks')).body as {
      person: { name: string } | null;
      companionStatus: string;
    }[];
    // Ninguna tarea sigue esperando a Juan ni acompañada por él (las rechazadas siguen rechazadas)
    const withJuan = tasks.filter((y) => y.person?.name === 'Juan').map((y) => y.companionStatus);
    expect(withJuan.length).toBeGreaterThan(0);
    expect(withJuan.filter((s) => s === 'pending' || s === 'accepted')).toEqual([]);
    const after = (await as('Juan').get('/tasks/accompanying')).body as {
      person: { name: string };
    }[];
    expect(after.filter((x) => x.person.name === 'Marta')).toHaveLength(0);
  });

  it('¡hurra!: solo quien acompañó una tarea terminada, una vez; la dueña lo ve', async () => {
    const lucia = (
      (await as('Marta').get('/contacts')).body as { id: string; name: string }[]
    ).find((c) => c.name === 'Lucia')!.id;
    let created = await as('Marta').post('/tasks', task('Para el hurra', lucia));
    if (created.status === 409) {
      const open = (await as('Marta').get('/tasks')).body as { id: string }[];
      await as('Marta').post(`/tasks/${open[0]!.id}/complete`).expect(200);
      created = await as('Marta').post('/tasks', task('Para el hurra', lucia)).expect(201);
    }
    const id = created.body.id as string;
    await as('Lucia').post(`/tasks/${id}/hurra`).expect(404); // aún abierta y sin aceptar
    await as('Lucia').post(`/tasks/${id}/accept`).expect(200);
    await as('Marta').post(`/tasks/${id}/complete`).expect(200);

    await as('Pepe').post(`/tasks/${id}/hurra`).expect(404);
    await as('Marta').post(`/tasks/${id}/hurra`).expect(404); // la dueña no se lo envía a sí misma
    const sent = await as('Lucia').post(`/tasks/${id}/hurra`).expect(200);
    expect(sent.body.hurraAt).toEqual(expect.any(String));
    expect((await as('Lucia').post(`/tasks/${id}/hurra`).expect(409)).body.code).toBe(
      'HURRA_ALREADY_SENT',
    );

    const done = (await as('Marta').get('/tasks?status=done')).body as {
      id: string;
      hurraAt: string | null;
    }[];
    expect(done.find((x) => x.id === id)?.hurraAt).toEqual(expect.any(String));
  });

  it('persona ajena → 404 en todo; la acompañante no puede editar ni terminar', async () => {
    const id = ((await as('Marta').get('/tasks')).body as { id: string }[])[0]!.id;
    await as('Pepe').get(`/tasks/${id}`).expect(404);
    await as('Pepe').patch(`/tasks/${id}`, { title: 'hackeada' }).expect(404);
    await as('Pepe').post(`/tasks/${id}/complete`).expect(404);
    await as('Pepe').del(`/tasks/${id}`).expect(404);
    await as('Pepe').post(`/tasks/${id}/restore`).expect(409);
    await as('Pepe').post(`/tasks/${id}/accept`).expect(404);
    await as('Pepe').get('/tasks/no-es-un-id').expect(404);

    const shared = ((await as('Lucia').get('/tasks/accompanying')).body as { id: string }[])[0]!.id;
    await as('Lucia').patch(`/tasks/${shared}`, { title: 'cambiada' }).expect(404);
    await as('Lucia').post(`/tasks/${shared}/complete`).expect(404);
  });

  it('sin sesión → 401', async () => {
    await http.get('/tasks').expect(401);
    await http.post('/tasks').send(task('x', juan)).expect(401);
  });

  it('orden de abiertas: con fecha por cercanía y después sin fecha, la más reciente', async () => {
    await person('Olga');
    const companion = await connect('Olga', 'Rosa');
    const pause = () => new Promise((r) => setTimeout(r, 5));
    for (const [title, dueAt] of [
      ['sin fecha, vieja', undefined],
      ['tarde', '2026-12-10T10:00:00+01:00'],
      ['sin fecha, nueva', undefined],
      ['pronto', '2026-12-01T10:00:00+01:00'],
    ] as const) {
      await as('Olga')
        .post('/tasks', { ...task(title, companion), ...(dueAt ? { dueAt } : {}) })
        .expect(201);
      await pause();
    }
    const res = await as('Olga').get('/tasks?status=open').expect(200);
    expect(res.body.map((x: { title: string }) => x.title)).toEqual([
      'pronto',
      'tarde',
      'sin fecha, nueva',
      'sin fecha, vieja',
    ]);
  });

  it('GET /me/home: mis abiertas en orden, contactos aceptados y lo que me comparten', async () => {
    await person('Nora');
    await person('Iker');
    const iker = await connect('Nora', 'Iker');
    await connect('Nora', 'Sincuenta', false);
    await as('Nora').post('/tasks', task('Ordenar el armario', iker)).expect(201);
    const ikerForNora = (await as('Iker').get('/contacts').expect(200)).body[0].id as string;
    await as('Iker').post('/tasks', task('Ir a correr', ikerForNora)).expect(201);

    const home = (await as('Nora').get('/me/home').expect(200)).body;
    expect(home.tasks.map((x: { title: string }) => x.title)).toEqual(['Ordenar el armario']);
    expect(home.contacts.map((c: { name: string }) => c.name)).toEqual(['Iker']);
    expect(home.shared).toMatchObject([
      { title: 'Ir a correr', role: 'companion', companionStatus: 'pending' },
    ]);

    // Lo de otras personas no aparece en su Home
    const other = (await as('Pepe').get('/me/home').expect(200)).body;
    expect(JSON.stringify(other)).not.toContain('Ordenar el armario');
    await http.get('/me/home').expect(401);
  });
});
