import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module.js';
import { UsersModule } from '../users/users.module.js';
import { ChangeFeed } from './change-feed.js';
import { Presence } from './presence.js';
import { RealtimeGateway } from './realtime.gateway.js';

@Module({
  imports: [UsersModule, ContactsModule],
  providers: [RealtimeGateway, ChangeFeed, Presence],
  exports: [Presence, RealtimeGateway, ChangeFeed],
})
export class RealtimeModule {}
