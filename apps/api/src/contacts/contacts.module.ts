import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module.js';
import { Contact, ContactSchema } from './contact.schema.js';
import { ContactsController } from './contacts.controller.js';
import { ContactsService } from './contacts.service.js';
import { Invitation, InvitationSchema } from './invitation.schema.js';
import { InvitationsController } from './invitations.controller.js';
import { InviteLinks } from './invite-links.js';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema },
      { name: Invitation.name, schema: InvitationSchema },
    ]),
  ],
  controllers: [ContactsController, InvitationsController],
  providers: [ContactsService, InviteLinks],
  exports: [ContactsService, MongooseModule],
})
export class ContactsModule {}
