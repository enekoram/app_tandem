import { Module } from '@nestjs/common';
import { ContactsModule } from '../contacts/contacts.module.js';
import { UsersModule } from '../users/users.module.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';

@Module({
  imports: [UsersModule, ContactsModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
