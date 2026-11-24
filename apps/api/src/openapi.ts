/**
 * Exporta el documento OpenAPI a `apps/api/openapi.json` sin conectarse a ninguna base de datos.
 * Uso: `pnpm --filter @tandems/api openapi` (lo llama `pnpm generate:api`).
 * El archivo se versiona: el cliente de la app se genera a partir de él y la CI comprueba que está al día.
 */
import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { buildOpenApiConfig } from './bootstrap.js';

// `preview`: Nest registra módulos y controladores pero no crea proveedores (no conecta a Mongo).
process.env.MONGODB_URI ??= 'mongodb://localhost:27017/openapi';
const { AppModule } = await import('./app.module.js');
const app = await NestFactory.create(AppModule, { preview: true, logger: false });
const document = SwaggerModule.createDocument(app, buildOpenApiConfig());

const out = fileURLToPath(new URL('../openapi.json', import.meta.url));
writeFileSync(out, JSON.stringify(document, null, 2) + '\n');
await app.close();
console.warn(`OpenAPI escrito en ${out}`);
