import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SuperAdminSeeder } from './seeders/super-admin.seeder';
import {
  Tenant, User, Restaurant, BankDetails, Menu, Table, Order, OrderItem, Payment, QRCode, Subscription, Customer, CustomerRating,
  Addon, Category, SingleClient, Item, Location, OrderStatus, OrderProcessingQueue,
  OrderNote, OrderManager, CartItem, SelectedCartItem, OrderItemAddon,
  SubscriptionPlanEntity, RestaurantSubscription, OrderUsage,
  Invoice,
  Transaction,
  MenuAddon,
  FoodCourtCart,
  SubscriptionChangeLog,
  OrderActivityLog
} from './entities';
import { SubscriptionPlanSeeder } from './seeders/subscription-plan.seeder';
import { InvoiceSeeder } from './seeders/invoice.seeder';
import { TransactionSeeder } from './seeders/transaction.seeder';

export const createDataSource = (configService: ConfigService): DataSource => {
  return new DataSource({
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST'),
    port: configService.get<number>('DATABASE_PORT'),
    username: configService.get<string>('DATABASE_USERNAME'),
    password: configService.get<string>('DATABASE_PASSWORD'),
    database: configService.get<string>('DATABASE_NAME'),
    entities: [
      Tenant, User, Restaurant, BankDetails, Menu, Table, Order, OrderItem, Payment, QRCode, Subscription, Customer, CustomerRating,
      Addon, Category, SingleClient, Item, Location, OrderStatus, OrderProcessingQueue,
      OrderNote, OrderManager, CartItem, SelectedCartItem, OrderItemAddon,
      SubscriptionPlanEntity, RestaurantSubscription, OrderUsage, Invoice, Transaction,
      MenuAddon, FoodCourtCart, SubscriptionChangeLog, OrderActivityLog
    ],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: configService.get<string>('NODE_ENV') === 'development',
    logging: configService.get<string>('NODE_ENV') === 'development',
    ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
  });
};

export const runSeeders = async (dataSource: DataSource): Promise<void> => {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const superAdminSeeder = new SuperAdminSeeder(dataSource);
  await superAdminSeeder.run();

  const subscriptionPlanSeeder = new SubscriptionPlanSeeder(dataSource);
  await subscriptionPlanSeeder.run();

  const invoiceSeeder = new InvoiceSeeder(dataSource);
  await invoiceSeeder.run();

  const transactionSeeder = new TransactionSeeder(dataSource);
  await transactionSeeder.run();
};
