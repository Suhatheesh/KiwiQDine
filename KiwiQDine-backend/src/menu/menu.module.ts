import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './../infrastructure/database/entities/menu.entity';
import { Restaurant } from './../infrastructure/database/entities/restaurant.entity';
import { Category } from './../infrastructure/database/entities/category.entity';
import { Tenant } from './../infrastructure/database/entities/tenant.entity';
import { OrderItem } from './../infrastructure/database/entities/order-item.entity';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuExcelService } from './menu-excel.service';

import { OrderStatusModule } from '../order-status/order-status.module';
import { BadgeModule } from '../badge/badge.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Menu, Restaurant, Category, Tenant, OrderItem]),
    OrderStatusModule,
    BadgeModule,
  ],
  controllers: [MenuController],
  providers: [MenuService, MenuExcelService],
  exports: [MenuService, MenuExcelService],
})
export class MenuModule {
  configure(consumer: MiddlewareConsumer) {
    // Middleware configuration if needed
  }
}
