import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QRCode, Restaurant } from '../infrastructure/database/entities';
import { QRCodeController } from './qr-code.controller';
import { QRCodeService } from './qr-code.service';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [TypeOrmModule.forFeature([QRCode, Restaurant]), SubscriptionModule],
  controllers: [QRCodeController],
  providers: [QRCodeService],
  exports: [QRCodeService],
})
export class QRCodeModule { }
