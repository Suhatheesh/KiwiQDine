import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { OrderAlertsService } from './order-alerts.service';
import { OrderAlertsController } from './order-alerts.controller';
import { OrderAlertsGateway } from './order-alerts.gateway';
import { AlertConfiguration } from './entities/alert-config.entity';
import { Order, OrderItem } from '../infrastructure/database/entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, AlertConfiguration]),
        ScheduleModule.forRoot(),
    ],
    controllers: [OrderAlertsController],
    providers: [
        OrderAlertsService,
        OrderAlertsGateway,
        {
            provide: 'OrderAlertsService',
            useExisting: OrderAlertsService,
        },
    ],
    exports: [OrderAlertsService, OrderAlertsGateway, 'OrderAlertsService'],
})
export class OrderAlertsModule { }
