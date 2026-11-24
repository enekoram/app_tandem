import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test-app.js';

const PASSWORD = 'una-frase-larga-y-segura';

describe('Contactos e invitaciones (e2e)', () => {
  let t: TestApp;
  let http: ReturnType<typeof request>;
  const cookies: Record<string, string> = {};

  async function person(name: string): Promise<string> {
    const email = `${name.toLowerCase()}@example.com`;
    const res = await http
      .post('/api/auth/sign-up/email')
      .send({ name, email, password: PASSWORD })
      .expect(200);
    const all = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    const cookie = all
      .filter((c) => c.includes('session_token'))
      .at(-1)!
      .split(';')[0]!;
    cookies[name] = cookie;
    return cookie;
  }

  const as = (name: string) => ({
    get: (url: string) => http.get(url).set('Cookie', cookies[name]!),
    post: (url: string, body?: object) =>
      http
        .post(url)
        .set('Cookie', cookies[name]!)
        .send(body ?? {}),
    del: (url: string) => http.delete(url).set('Cookie', cookies[name]!),
  });

  const tokenOf = (url: string) => new URL(url).searchParams.get('token')!;

  beforeAll(async () => {
    t = await createTestApp();
    http = request(t.app.getHttpServer());
    await person('Marta');
    await person('Lucia');
    await person('Juan');
  });

  afterAll(async () => {
    await t?.close();
  });

  let luciaContactId: string;
  let luciaToken: string;

  it('añadir contacto: pendiente, con color, iniciales, email y enlace para compartir', async () => {
    const res = await as('Marta')
      .post('/contacts', { name: ' Lucía ', email: 'Lucia@Example.com' })
      .expect(201);
    expect(res.body.contact).toMatchObject({
      name: 'Lucía',
      email: 'lucia@example.com',
      status: 'pending',
      color: 'lilac',
      initials: 'L',
      userId: null,
    });
    expect(res.body.inviteUrl).toMatch(/\/enlace\/invitacion\?token=/);
    luciaContactId = res.body.contact.id;
    luciaToken = tokenOf(res.body.inviteUrl);

    await new Promise((r) => setTimeout(r, 30));
    const mail = t.mailer.lastTo('lucia@example.com');
    expect(mail?.subject).toBe('Marta te invita a su red de apoyo en Tandems');
    expect(mail?.text).toContain(res.body.inviteUrl);
  });

  it('ErrContactoExiste: el mismo email (sin importar mayúsculas) → 409 con el nombre', async () => {
    const res = await as('Marta')
      .post('/contacts', { name: 'Otra', email: 'LUCIA@example.com' })
      .expect(409);
    expect(res.body).toMatchObject({ code: 'CONTACT_EXISTS', name: 'Lucía' });
  });

  it('no puedes invitarte a ti ni mandar un email no válido', async () => {
    expect(
      (await as('Marta').post('/contacts', { name: 'Yo', email: 'marta@example.com' })).body.code,
    ).toBe('SELF_INVITE');
    const bad = await as('Marta')
      .post('/contacts', { name: 'X', email: 'no-es-email' })
      .expect(400);
    expect(bad.body.code).toBe('VALIDATION');
  });

  it('invitaciones simultáneas al mismo email: solo una se crea', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        as('Juan').post('/contacts', { name: 'Ana', email: 'ana@example.com' }),
      ),
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(4);
  });

  it('iniciales: al chocar la primera letra pasan a dos', async () => {
    await as('Marta').post('/contacts', { name: 'Mario', email: 'mario@example.com' }).expect(201);
    await as('Marta')
      .post('/contacts', { name: 'Miguel', email: 'miguel@example.com' })
      .expect(201);
    const list = await as('Marta').get('/contacts').expect(200);
    expect(
      list.body.map((c: { name: string; initials: string; color: string }) => [
        c.name,
        c.initials,
        c.color,
      ]),
    ).toEqual([
      ['Lucía', 'L', 'lilac'],
      ['Mario', 'MA', 'slate'],
      ['Miguel', 'MI', 'rose'],
    ]);
  });

  it('reenviar enseguida → 429 RESEND_LIMIT', async () => {
    const res = await as('Marta').post(`/contacts/${luciaContactId}/resend`).expect(429);
    expect(res.body.code).toBe('RESEND_LIMIT');
  });

  it('vista previa pública de la invitación y página intermedia', async () => {
    const preview = await http.get(`/invitations/${luciaToken}`).expect(200);
    expect(preview.body).toEqual({ inviterName: 'Marta' });
    await http.get('/invitations/no-es-un-token').expect(404);

    const page = await http.get(`/enlace/invitacion?token=${luciaToken}`).expect(200);
    expect(page.text).toContain('Marta te invita a su <i>red de apoyo</i>');
    expect(page.text).toContain(`tandems://invitacion?token=${luciaToken}`);
  });

  it('la página intermedia nunca enlaza a webs ajenas', async () => {
    const page = await http
      .get(`/enlace/invitacion?token=${luciaToken}&app=https%3A%2F%2Fmalicioso.example.com`)
      .expect(200);
    expect(page.text).not.toContain('malicioso');
  });

  it('aceptar: los dos lados quedan como contactos aceptados', async () => {
    const res = await as('Lucia').post(`/invitations/${luciaToken}/accept`).expect(200);
    expect(res.body).toMatchObject({
      name: 'Marta',
      status: 'accepted',
      email: 'marta@example.com',
    });

    const marta = await as('Marta').get(`/contacts/${luciaContactId}`).expect(200);
    expect(marta.body.status).toBe('accepted');
    expect(marta.body.userId).toEqual(expect.any(String));

    await as('Lucia').post(`/invitations/${luciaToken}/accept`).expect(410);
  });

  it('persona ajena → 404 al ver, reenviar o borrar un contacto que no es suyo', async () => {
    await as('Juan').get(`/contacts/${luciaContactId}`).expect(404);
    await as('Juan').post(`/contacts/${luciaContactId}/resend`).expect(404);
    await as('Juan').del(`/contacts/${luciaContactId}`).expect(404);
    await as('Juan').get('/contacts/no-es-un-id').expect(404);
  });

  it('cancelar una invitación pendiente invalida el enlace y deja volver a invitar', async () => {
    const created = await as('Juan')
      .post('/contacts', { name: 'Pepa', email: 'pepa@example.com' })
      .expect(201);
    const token = tokenOf(created.body.inviteUrl);
    await as('Juan').del(`/contacts/${created.body.contact.id}`).expect(204);
    await http.get(`/invitations/${token}`).expect(404);
    await as('Juan').post('/contacts', { name: 'Pepa', email: 'pepa@example.com' }).expect(201);
  });

  it('eliminar un contacto aceptado lo quita en los dos sentidos', async () => {
    await as('Marta').del(`/contacts/${luciaContactId}`).expect(204);
    const lucia = await as('Lucia').get('/contacts').expect(200);
    expect(lucia.body).toEqual([]);
  });

  it('sin sesión → 401', async () => {
    await http.get('/contacts').expect(401);
    await http.post(`/invitations/${luciaToken}/accept`).expect(401);
  });
});
