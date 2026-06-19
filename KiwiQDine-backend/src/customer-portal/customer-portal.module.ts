import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QRCode, Restaurant, Menu, Order, OrderItem, Customer, Table, Payment, Tenant, Addon, OrderItemAddon, Category } from '../infrastructure/database/entities';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerAuthService } from './customer-auth.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { OrderStatusModule } from '../order-status/order-status.module';
import { SmsService } from '../shared/services/sms.service';
import { BadgeModule } from '../badge/badge.module';
import { MenuModule } from '../menu/menu.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QRCode,
      Restaurant,
      Menu,
      Order,
      OrderItem,
      Customer,
      Table,
      Payment,
      Tenant,
      Addon,
      OrderItemAddon,
      Category,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
    SubscriptionModule,
    OrderStatusModule,
    BadgeModule,
    MenuModule,
  ],
  controllers: [CustomerPortalController, CustomerAuthController],
  providers: [CustomerPortalService, CustomerAuthService, SmsService],
  exports: [CustomerPortalService, CustomerAuthService],
})
export class CustomerPortalModule { }
