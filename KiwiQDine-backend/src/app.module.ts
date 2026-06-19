import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationExceptionsFilter, ApplicationLogger } from './infrastructure';
import { AuthModule } from './infrastructure/auth';
import { TYPES } from './application/constants';
import { TenantModule } from './tenant/tenant.module';
import { OutletModule } from './outlet/outlet.module';
import { UserManagementModule } from './user-management/user-management.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { MenuModule } from './menu/menu.module';
import { QRCodeModule } from './qr-code/qr-code.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';
import { CustomerManagementModule } from './customer-management/customer-management.module';
import { FoodCourtCartModule } from './cart/food-court-cart.module';
import { CustomerRatingsModule } from './customer-ratings/customer-ratings.module';
import { OrderManagementModule } from './order-management/order-management.module';
import { OrderStatusModule } from './order-status/order-status.module';
import { KitchenDisplayModule } from './kitchen-display/kitchen-display.module';
import { CategoryModule } from './category/category.module';
import { AddonModule } from './addon/addon.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { TableModule } from './table/table.module';
import { TransactionModule } from './transaction/transaction.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { OrderAlertsModule } from './order-alerts/order-alerts.module';
import { TenantMiddleware } from './infrastructure/middlewares/tenant.middleware';
import {
  Tenant,
  Restaurant,
  User,
  Customer,
  CustomerRating,
  Menu,
  Order,
  OrderItem,
  Payment,
  QRCode,
  Subscription,
  Addon,
  Category,
  SingleClient,
  Item,
  Location,
  OrderStatus,
  OrderProcessingQueue,
  OrderNote,
  OrderManager,
  CartItem,
  SelectedCartItem,
  OrderItemAddon,
  MenuAddon,
  SubscriptionPlanEntity,
  RestaurantSubscription,
  OrderUsage,
  SubscriptionChangeLog,
  Table,
  FoodCourtCart,
  BankDetails,
  Transaction,
  Invoice,
  OrderActivityLog,
  Badge
} from './infrastructure/database/entities';
import { AlertConfiguration } from './order-alerts/entities/alert-config.entity';
import { InvoiceModule } from './invoice/invoice.module';
import { BadgeModule } from './badge/badge.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.production'],
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().required(),
        DATABASE_USERNAME: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(4000),
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        // Use direct entity imports for better production compatibility
        entities: [
          Tenant,
          Restaurant,
          User,
          Customer,
          CustomerRating,
          Menu,
          Order,
          OrderItem,
          Payment,
          QRCode,
          Subscription,
          Addon,
          Category,
          SingleClient,
          Item,
          Location,
          OrderStatus,
          OrderProcessingQueue,
          OrderNote,
          OrderManager,
          CartItem,
          SelectedCartItem,
          OrderItemAddon,
          MenuAddon,
          SubscriptionPlanEntity,
          RestaurantSubscription,
          OrderUsage,
          SubscriptionChangeLog,
          Table,
          FoodCourtCart,
          BankDetails,
          Transaction,
          Invoice,
          OrderActivityLog,
          AlertConfiguration,
          Badge
        ],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        //logging: configService.get<string>('NODE_ENV') === 'development',
        logging: false,
        ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Tenant,
      Restaurant,
      User,
      Customer,
      CustomerRating,
      Menu,
      Order,
      OrderItem,
      Payment,
      QRCode,
      Subscription,
      SubscriptionPlanEntity,
      RestaurantSubscription,
      OrderUsage,
      SubscriptionChangeLog,
      BankDetails,
      Transaction,
      Invoice,
      OrderActivityLog
    ]),
    AuthModule,
    TenantModule,
    OutletModule,
    UserManagementModule,
    RestaurantModule,
    MenuModule,
    QRCodeModule,
    CustomerPortalModule,
    CustomerManagementModule,
    CustomerRatingsModule,
    FoodCourtCartModule,
    OrderManagementModule,
    OrderStatusModule,
    KitchenDisplayModule,
    CategoryModule,
    AddonModule,
    SubscriptionModule,
    TableModule,
    DashboardModule,
    TransactionModule,
    InvoiceModule,
    UploadModule,
    OrderAlertsModule,
    BadgeModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenantMiddleware,
    {
      provide: APP_FILTER,
      useClass: ApplicationExceptionsFilter,
    },
    {
      provide: TYPES.IApplicationLogger,
      useClass: ApplicationLogger,
    },
    ApplicationLogger,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
