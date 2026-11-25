import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

export function buildOpenApiConfig() {
  return new DocumentBuilder()
    .setTitle('Tandems API')
    .setDescription('API de Tandems')
    .setVersion('0.1.0')
    .build();
}

/** Configuración común de la app: la usan `main.ts` y los tests e2e. */
export function configureApp(app: INestApplication, { swagger }: { swagger: boolean }): void {
  app.useLogger(app.get(Logger));
  app.use(helmet());
  // Datos personales y siempre frescos: sin ETag ni caché (un 304 dejaba listas sin actualizar)
  const express = app.getHttpAdapter().getInstance() as { set: (k: string, v: unknown) => void };
  express.set('etag', false);
  app.use((_req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.enableShutdownHooks();

  if (swagger) {
    const document = SwaggerModule.createDocument(app, buildOpenApiConfig());
    SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs/openapi.json' });
  }
}
