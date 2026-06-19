import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerManagementController } from './customer-management.controller';
import { CustomerManagementService } from './customer-management.service';
import { Customer, Order, Restaurant } from '../infrastructure/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Order, Restaurant])],
  controllers: [CustomerManagementController],
  providers: [CustomerManagementService],
  exports: [CustomerManagementService],
})
export class CustomerManagementModule {}

