import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SuperAdminDashboardController } from './super-admin-dashboard.controller';
import { SuperAdminDashboardService } from './super-admin-dashboard.service';
import {
  Order,
  OrderItem,
  Table,
  Payment,
  Menu,
  Restaurant,
  Customer,
  User,
  Tenant,
} from '../infrastructure/database/entities';
import { RestaurantSubscription } from '../infrastructure/database/entities/restaurant-subscription.entity';
import { SubscriptionPlanEntity } from '../infrastructure/database/entities/subscription-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Table,
      Payment,
      Menu,
      Restaurant,
      Customer,
      User,
      RestaurantSubscription,
      SubscriptionPlanEntity,
      Tenant,
    ]),
  ],
  controllers: [DashboardController, SuperAdminDashboardController],
  providers: [DashboardService, SuperAdminDashboardService],
  exports: [DashboardService, SuperAdminDashboardService],
})
export class DashboardModule { }
