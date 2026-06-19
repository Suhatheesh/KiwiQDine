import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../infrastructure/database/entities/invoice.entity';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { RestaurantSubscription, SubscriptionPlanEntity, OrderUsage, Restaurant } from '@/infrastructure/database/entities';
import { InvoiceSchedulerService } from './invoice-scheduler.service';
import { S3Service } from '@/shared/services/s3.service';
import { SubscriptionModule } from '@/subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, RestaurantSubscription, SubscriptionPlanEntity, OrderUsage, Restaurant]),
    SubscriptionModule,
  ],
  providers: [InvoiceService, InvoiceSchedulerService, S3Service],
  exports: [S3Service, InvoiceSchedulerService],
  controllers: [InvoiceController],
})
export class InvoiceModule { }
