import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController, TenantUsersController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
import { User } from '../infrastructure/database/entities';
import { EmailService } from '../shared/services/email.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SubscriptionModule],
  controllers: [UsersController, TenantUsersController],
  providers: [UserManagementService, EmailService],
  exports: [UserManagementService],
})
export class UserManagementModule { }
