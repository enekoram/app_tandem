import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './test-app.js';

describe('GET /health (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t?.close();
  });

  it('responde 200 sin sesión con MongoDB arriba', async () => {
    const res = await request(t.app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', info: { mongodb: { status: 'up' } } });
  });

  it('sin caché ni ETag (nunca 304)', async () => {
    const res = await request(t.app.getHttpServer()).get('/health');
    expect(res.headers.etag).toBeUndefined();
    expect(res.headers['cache-control']).toMatch(/no-store/);
  });

  it('añade cabeceras de seguridad (helmet)', async () => {
    const res = await request(t.app.getHttpServer()).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('publica el documento OpenAPI con /health y /me', async () => {
    const res = await request(t.app.getHttpServer()).get('/docs/openapi.json').expect(200);
    expect(res.body.paths).toHaveProperty('/health');
    expect(res.body.paths).toHaveProperty('/me');
  });

  it('responde 503 si MongoDB se cae', async () => {
    const connection = t.app.get<Connection>(getConnectionToken());
    await connection.close();
    await request(t.app.getHttpServer()).get('/health').expect(503);
  });
});
