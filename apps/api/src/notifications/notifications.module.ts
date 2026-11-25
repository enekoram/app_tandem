import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsModule } from '../contacts/contacts.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { Session, SessionSchema } from '../sessions/session.schema.js';
import { User, UserSchema } from '../users/user.schema.js';
import { UsersModule } from '../users/users.module.js';
import { DeviceToken, DeviceTokenSchema } from './device-token.schema.js';
import { DevicesController } from './devices.controller.js';
import { NotificationRules } from './notification-rules.js';
import { Notification, NotificationSchema } from './notification.schema.js';
import { Notifier } from './notifier.js';
import { PushTransport } from './push-transport.js';

@Module({
  imports: [
    UsersModule,
    ContactsModule,
    RealtimeModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [DevicesController],
  providers: [PushTransport, Notifier, NotificationRules],
  exports: [PushTransport, NotificationRules],
})
export class NotificationsModule {}
