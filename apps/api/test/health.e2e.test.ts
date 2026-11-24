import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureApp } from '../src/bootstrap.js';

describe('GET /health (e2e)', () => {
  let mongo: MongoMemoryReplSet;
  let app: INestApplication;

  beforeAll(async () => {
    // Réplica de un nodo: las transacciones (límite de 5 tareas) la necesitan.
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGODB_URI = mongo.getUri('tandems_test');
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'silent';

    // Se importa después de fijar las variables: ConfigModule las valida al cargar el módulo.
    const { AppModule } = await import('../src/app.module.js');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    configureApp(app, { swagger: true });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it('responde 200 con MongoDB arriba', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', info: { mongodb: { status: 'up' } } });
  });

  it('añade cabeceras de seguridad (helmet)', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('publica el documento OpenAPI con la ruta /health', async () => {
    const res = await request(app.getHttpServer()).get('/docs/openapi.json').expect(200);
    expect(res.body.paths).toHaveProperty('/health');
  });

  it('responde 503 si MongoDB se cae', async () => {
    const connection = app.get<Connection>(getConnectionToken());
    await connection.close();
    await request(app.getHttpServer()).get('/health').expect(503);
  });
});
