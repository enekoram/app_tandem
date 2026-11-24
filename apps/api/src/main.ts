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

  configureApp(app, { swagger: config.get('NODE_ENV', { infer: true }) !== 'production' });

  // 0.0.0.0: Render exige escuchar en todas las interfaces.
  await app.listen(config.get('PORT', { infer: true }), '0.0.0.0');
}

void main();
