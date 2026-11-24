import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { configureApp } from '../src/bootstrap.js';
import { Mailer, type EmailMessage } from '../src/mail/mailer.js';

/** Buzón falso: guarda los emails en memoria para inspeccionarlos. */
export class FakeMailer extends Mailer {
  readonly sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }

  lastTo(to: string): EmailMessage | undefined {
    return this.sent.filter((m) => m.to === to).at(-1);
  }
}

export interface TestApp {
  app: INestApplication;
  mailer: FakeMailer;
  close: () => Promise<void>;
}

/** API completa contra MongoDB en memoria (réplica de un nodo: hay transacciones). */
export async function createTestApp(): Promise<TestApp> {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongo.getUri('tandems_test');
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  process.env.BETTER_AUTH_SECRET = 'secreto-de-tests-con-mas-de-32-caracteres';
  process.env.BETTER_AUTH_URL = 'http://localhost:3000';
  delete process.env.RESEND_API_KEY;

  // Se importa después de fijar las variables: ConfigModule las valida al cargar el módulo.
  const { AppModule } = await import('../src/app.module.js');
  const mailer = new FakeMailer();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Mailer)
    .useValue(mailer)
    .compile();
  const app = moduleRef.createNestApplication({ bufferLogs: true, bodyParser: false });
  configureApp(app, { swagger: true });
  await app.init();

  return {
    app,
    mailer,
    close: async () => {
      await app.close();
      await mongo.stop();
    },
  };
}
