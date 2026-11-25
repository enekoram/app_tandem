import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { ChangeStream, ChangeStreamDocument, Document } from 'mongodb';
import type { Connection, Types } from 'mongoose';
import { RealtimeGateway } from './realtime.gateway.js';

type Id = Types.ObjectId | null | undefined;

/** A quién afecta un cambio en cada colección (dueña y la otra persona). */
const AFFECTED: Record<string, (doc: Document) => Id[]> = {
  tasks: (d) => [d.owner_id as Id, (d.companion as { user_id?: Id } | undefined)?.user_id],
  contacts: (d) => [d.owner_id as Id, d.contact_user_id as Id],
  sessions: (d) => [d.owner_id as Id, d.companion_user_id as Id],
  support_events: (d) => [d.from_user as Id, d.to_user as Id],
};

const RETRY_MS = 5_000;

/**
 * Change streams de Mongo → avisos a las salas de las personas afectadas (doc 01).
 * Con una sola instancia no hace falta resume token: al reconectar, la app pide /me/home.
 */
@Injectable()
export class ChangeFeed implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChangeFeed.name);
  private readonly streams: ChangeStream[] = [];
  private closing = false;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly gateway: RealtimeGateway,
  ) {}

  onModuleInit(): void {
    for (const name of Object.keys(AFFECTED)) this.watch(name);
  }

  async onModuleDestroy(): Promise<void> {
    this.closing = true;
    await Promise.all(this.streams.map((s) => s.close()));
  }

  private watch(name: string): void {
    const affected = AFFECTED[name]!;
    const stream = this.connection.collection(name).watch([], { fullDocument: 'updateLookup' });
    this.streams.push(stream);
    stream.on('change', (change: ChangeStreamDocument) => {
      const doc = 'fullDocument' in change ? change.fullDocument : undefined;
      if (doc) this.gateway.homeChanged(affected(doc));
    });
    stream.on('error', (error) => {
      if (this.closing) return;
      this.logger.warn(`Change stream de ${name} cortado: ${error.message}`);
      this.streams.splice(this.streams.indexOf(stream), 1);
      setTimeout(() => !this.closing && this.watch(name), RETRY_MS);
    });
  }
}
