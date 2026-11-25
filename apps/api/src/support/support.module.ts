import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsModule } from '../contacts/contacts.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { Task, TaskSchema } from '../tasks/task.schema.js';
import { UsersModule } from '../users/users.module.js';
import { SupportEvent, SupportEventSchema } from './support-event.schema.js';
import { SupportViews } from './support-views.js';
import { SupportController } from './support.controller.js';
import { SupportService } from './support.service.js';

@Module({
  imports: [
    UsersModule,
    ContactsModule,
    RealtimeModule,
    MongooseModule.forFeature([
      { name: SupportEvent.name, schema: SupportEventSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [SupportController],
  providers: [SupportService, SupportViews],
  exports: [SupportService, SupportViews],
})
export class SupportModule {}
