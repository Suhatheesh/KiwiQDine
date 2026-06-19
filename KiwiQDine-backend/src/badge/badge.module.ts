import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge, Restaurant } from '../infrastructure/database/entities';
import { BadgeService } from './badge.service';
import { BadgeController } from './badge.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, Restaurant])],
  controllers: [BadgeController],
  providers: [BadgeService],
  exports: [BadgeService],
})
export class BadgeModule {}
