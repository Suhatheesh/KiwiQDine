import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SubscriptionPlanEntity,
  RestaurantSubscription,
  OrderUsage,
  Restaurant,
  Order,
  SubscriptionChangeLog,
  Table,
  User,
  QRCode,
  Invoice,
} from '../infrastructure/database/entities';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { TYPES } from '../application/constants';
import { SubscriptionRenewalCronService } from './subscription-renewal-cron.service';
import { GracePeriodService } from './grace-period.service';
import { GracePeriodCronService } from './grace-period-cron.service';
import { S3Service } from '../shared/services/s3.service';
import { MasterCronService } from '../shared/services/master-cron.service';
import { InvoiceSchedulerService } from '@/invoice/invoice-scheduler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlanEntity,
      RestaurantSubscription,
      OrderUsage,
      Restaurant,
      Order,
      SubscriptionChangeLog,
      Table,
      User,
      QRCode,
      Invoice,
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    SubscriptionRenewalCronService,
    GracePeriodService,
    GracePeriodCronService,
    S3Service,
    MasterCronService,
    InvoiceSchedulerService,
    { provide: TYPES.ISubscriptionService, useExisting: SubscriptionService },
  ],
  exports: [SubscriptionService, SubscriptionRenewalCronService, GracePeriodService, GracePeriodCronService, TYPES.ISubscriptionService],
})
export class SubscriptionModule { }

