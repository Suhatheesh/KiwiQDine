import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, OrderItem, Restaurant, Menu } from '../infrastructure/database/entities';
import { OrderStatusModule } from '../order-status/order-status.module';
import { KitchenDisplayController } from './kitchen-display.controller';
import { KitchenDisplayService } from './kitchen-display.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Restaurant, Menu]),
    OrderStatusModule,
  ],
  controllers: [KitchenDisplayController],
  providers: [KitchenDisplayService],
  exports: [KitchenDisplayService],
})
export class KitchenDisplayModule {}
