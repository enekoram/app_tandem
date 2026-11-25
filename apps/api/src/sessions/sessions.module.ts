import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsModule } from '../contacts/contacts.module.js';
import { Task, TaskSchema } from '../tasks/task.schema.js';
import { UsersModule } from '../users/users.module.js';
import { Session, SessionSchema } from './session.schema.js';
import { SessionViews } from './session-views.js';
import { SessionsController } from './sessions.controller.js';
import { SessionsService } from './sessions.service.js';

@Module({
  imports: [
    UsersModule,
    ContactsModule,
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionViews],
  exports: [SessionsService, SessionViews],
})
export class SessionsModule {}
