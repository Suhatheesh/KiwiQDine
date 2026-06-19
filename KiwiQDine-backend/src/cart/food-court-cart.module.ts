import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodCourtCart } from '../infrastructure/database/entities/food-court-cart.entity';
import { Menu, Restaurant, Tenant, Order, Payment, Customer, Addon } from '../infrastructure/database/entities';
import { FoodCourtCartController } from './food-court-cart.controller';
import { FoodCourtCartService } from './food-court-cart.service';
import { CustomerPortalModule } from '../customer-portal/customer-portal.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FoodCourtCart,
      Menu,
      Restaurant,
      Tenant,
      Order,
      Payment,
      Customer,
      Addon,
    ]),
    forwardRef(() => CustomerPortalModule),
  ],
  controllers: [FoodCourtCartController],
  providers: [FoodCourtCartService],
  exports: [FoodCourtCartService],
})
export class FoodCourtCartModule { }
