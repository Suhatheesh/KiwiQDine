import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerRatingsController } from './customer-ratings.controller';
import { CustomerRatingsService } from './customer-ratings.service';
import { CustomerRating, Customer, Restaurant, Order } from '../infrastructure/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerRating, Customer, Restaurant, Order])],
  controllers: [CustomerRatingsController],
  providers: [CustomerRatingsService],
  exports: [CustomerRatingsService],
})
export class CustomerRatingsModule {}

