import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem, Restaurant, Customer, Menu, Table, Payment, Addon, OrderItemAddon } from '../infrastructure/database/entities';
import { OrderManagementController } from './order-management.controller';
import { OrderManagementService } from './order-management.service';
import { OrderCleanupScheduler } from './order-cleanup.scheduler';
import { OrderStatusModule } from '../order-status/order-status.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { OrderAlertsModule } from '../order-alerts/order-alerts.module';

import { OrderAliasController } from './order-alias.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Restaurant,
      Customer,
      Menu,
      Table,
      Payment,
      Addon,
      OrderItemAddon,
    ]),
    OrderStatusModule,
    SubscriptionModule,
    OrderAlertsModule,
  ],
  controllers: [OrderManagementController, OrderAliasController],
  providers: [OrderManagementService, OrderCleanupScheduler],
  exports: [OrderManagementService, OrderCleanupScheduler],
})
export class OrderManagementModule { }
