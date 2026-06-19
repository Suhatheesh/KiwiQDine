import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Order, OrderItem, User, Payment, OrderActivityLog } from '../infrastructure/database/entities';
import { OrderStatusController } from './order-status.controller';
import { OrderStatusService } from './order-status.service';
import { OrderStatusGateway } from './order-status.gateway';
import { OrderAutoCompleteService } from './order-auto-complete.service';
import { OrderAutoCompleteController } from './order-auto-complete.controller';
import { SmsNotificationService } from '../shared/services/sms-notification.service';
import { SmsService } from '../shared/services/sms.service';
import { OrderActivityLogService } from './order-activity-log.service';
import { OrderTimerService } from './order-timer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, User, Payment, OrderActivityLog]),
    JwtModule.register({}),
  ],
  controllers: [OrderStatusController, OrderAutoCompleteController],
  providers: [
    OrderStatusService,
    OrderStatusGateway,
    OrderAutoCompleteService,
    SmsNotificationService,
    SmsService,
    OrderActivityLogService,
    OrderTimerService,
  ],
  exports: [OrderStatusService, OrderStatusGateway, OrderAutoCompleteService, OrderActivityLogService],
})
export class OrderStatusModule { }
