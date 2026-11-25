import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsModule } from '../contacts/contacts.module.js';
import { User, UserSchema } from '../users/user.schema.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { UsersModule } from '../users/users.module.js';
import { HomeController } from './home.controller.js';
import { TaskViews } from './task-views.js';
import { Task, TaskSchema } from './task.schema.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [
    UsersModule,
    ContactsModule,
    RealtimeModule,
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TasksController, HomeController],
  providers: [TasksService, TaskViews],
})
export class TasksModule {}
