import { getConnectionToken } from '@nestjs/mongoose';
import { Types, type Connection } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test-app.js';

const PASSWORD = 'una-frase-larga-y-segura';

describe('Perfil y cuenta (e2e)', () => {
  let t: TestApp;
  let http: ReturnType<typeof request>;
  let db: Connection;
  const cookies: Record<string, string> = {};

  const emailOf = (name: string) => `${name.toLowerCase()}@example.com`;

  async function signUp(name: string) {
    const res = await http
      .post('/api/auth/sign-up/email')
      .send({ name, email: emailOf(name), password: PASSWORD })
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
    patch: (url: string, body: object) => http.patch(url).set('Cookie', cookies[name]!).send(body),
    del: (url: string) => http.delete(url).set('Cookie', cookies[name]!),
  });

  /** `owner` invita a `guest` y `guest` acepta. Devuelve el id del contacto de `owner`. */
  async function connect(owner: string, guest: string): Promise<string> {
    const res = await as(owner)
      .post('/contacts', { name: guest, email: emailOf(guest) })
      .expect(201);
    const token = new URL(res.body.inviteUrl).searchParams.get('token');
    await as(guest).post(`/invitations/${token}/accept`).expect(200);
    return res.body.contact.id as string;
  }

  beforeAll(async () => {
    t = await createTestApp();
    http = request(t.app.getHttpServer());
    db = t.app.get<Connection>(getConnectionToken());
    for (const name of ['Marta', 'Juan', 'Rosa']) await signUp(name);
  });

  afterAll(async () => {
    await t?.close();
  });

  describe('editar perfil', () => {
    it('cambia el nombre (recortado) en el perfil y en la cuenta', async () => {
      const res = await as('Rosa').patch('/me', { displayName: '  Rosi  ' }).expect(200);
      expect(res.body).toMatchObject({ displayName: 'Rosi', email: emailOf('Rosa') });
      await as('Rosa')
        .get('/me')
        .expect(200)
        .expect((r) => expect(r.body.displayName).toBe('Rosi'));
      const account = await db.collection('auth_users').findOne({ email: emailOf('Rosa') });
      expect(account?.name).toBe('Rosi');
    });

    it('nombre vacío o de más de 40 caracteres → 400', async () => {
      await as('Rosa').patch('/me', { displayName: '   ' }).expect(400);
      await as('Rosa')
        .patch('/me', { displayName: 'a'.repeat(41) })
        .expect(400);
    });

    it('el email no se cambia por aquí', async () => {
      const res = await as('Rosa')
        .patch('/me', { displayName: 'Rosa', email: 'otra@example.com' })
        .expect(200);
      expect(res.body.email).toBe(emailOf('Rosa'));
    });

    it('sin sesión → 401', async () => {
      await http.patch('/me').send({ displayName: 'Nadie' }).expect(401);
      await http.delete('/me').expect(401);
    });
  });

  describe('eliminar cuenta', () => {
    let juanForMarta: string; // contacto de Marta
    let martaTask: string; // tarea de Marta que acompaña Juan
    let juanTask: string; // tarea de Juan que acompaña Marta
    let martaId: string;

    beforeAll(async () => {
      juanForMarta = await connect('Marta', 'Juan');
      const juanContacts = await as('Juan').get('/contacts').expect(200);
      const martaForJuan = juanContacts.body[0].id as string;

      martaTask = (
        await as('Marta')
          .post('/tasks', { title: 'Hacer la renta', companionContactId: juanForMarta })
          .expect(201)
      ).body.id;
      await as('Juan').post(`/tasks/${martaTask}/accept`).expect(200);

      juanTask = (
        await as('Juan')
          .post('/tasks', { title: 'Ir al gimnasio', companionContactId: martaForJuan })
          .expect(201)
      ).body.id;
      await as('Marta').post(`/tasks/${juanTask}/accept`).expect(200);

      // Una invitación de Marta aún sin aceptar
      await as('Marta')
        .post('/contacts', { name: 'Lucía', email: 'lucia@example.com' })
        .expect(201);

      martaId = (await as('Marta').get('/me').expect(200)).body.id;
      await as('Marta').del('/me').expect(204);
    });

    it('la sesión deja de valer y no se puede volver a entrar', async () => {
      await as('Marta').get('/me').expect(401);
      await http
        .post('/api/auth/sign-in/email')
        .send({ email: emailOf('Marta'), password: PASSWORD })
        .expect(401);
    });

    it('se borran el perfil, sus tareas, sus contactos y sus invitaciones', async () => {
      const users = db.collection('users');
      expect(await users.countDocuments({ email: emailOf('Marta') })).toBe(0);
      const owner = { owner_id: new Types.ObjectId(martaId) };
      expect(await db.collection('tasks').countDocuments(owner)).toBe(0);
      expect(await db.collection('contacts').countDocuments(owner)).toBe(0);
      expect(
        await db.collection('invitations').countDocuments({ inviter_id: owner.owner_id }),
      ).toBe(0);
      expect(await db.collection('auth_users').countDocuments({ email: emailOf('Marta') })).toBe(0);
    });

    it('Juan ya no la ve: ni en sus contactos ni en lo que acompaña', async () => {
      expect((await as('Juan').get('/contacts').expect(200)).body).toEqual([]);
      const accompanying = (await as('Juan').get('/tasks/accompanying').expect(200)).body;
      expect(JSON.stringify(accompanying)).not.toContain(martaTask);
      await as('Juan').get(`/tasks/${martaTask}`).expect(404);
    });

    it('la tarea de Juan que acompañaba Marta queda «se fue»', async () => {
      const res = await as('Juan').get(`/tasks/${juanTask}`).expect(200);
      expect(res.body.companionStatus).toBe('left');
    });

    it('el email queda libre para crear una cuenta nueva, vacía', async () => {
      await signUp('Marta');
      const me = (await as('Marta').get('/me').expect(200)).body;
      expect(me.id).not.toBe(martaId);
      expect((await as('Marta').get('/contacts').expect(200)).body).toEqual([]);
      expect((await as('Marta').get('/tasks').expect(200)).body).toMatchObject([]);
    });
  });
});
