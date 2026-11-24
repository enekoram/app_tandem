import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap.js';
import type { Env } from './config/env.js';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // Better Auth lee el cuerpo crudo; la librería vuelve a añadir los parsers para el resto
    bodyParser: false,
  });
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  const production = config.get('NODE_ENV', { infer: true }) === 'production';
  // Detrás del proxy de Render: la IP real llega en X-Forwarded-For (límites por IP)
  if (production) app.getHttpAdapter().getInstance().set('trust proxy', 1);

  configureApp(app, { swagger: !production });

  // 0.0.0.0: Render exige escuchar en todas las interfaces.
  await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');
}

void main();
