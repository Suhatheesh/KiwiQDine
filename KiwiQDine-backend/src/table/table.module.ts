import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table, Restaurant, Order } from '../infrastructure/database/entities';
import { TableService } from './table.service';
import { TableController } from './table.controller';
import { TableResetScheduler } from './table-reset.scheduler';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Restaurant, Order]), SubscriptionModule],
  controllers: [TableController],
  providers: [TableService, TableResetScheduler],
  exports: [TableService, TableResetScheduler],
})
export class TableModule { }

