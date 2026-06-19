import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
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
    OrderActivityLog,
    Badge
} from './entities';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: [
        Tenant, User, Restaurant, BankDetails, Menu, Table, Order, OrderItem, Payment, QRCode, Subscription, Customer, CustomerRating,
        Addon, Category, SingleClient, Item, Location, OrderStatus, OrderProcessingQueue,
        OrderNote, OrderManager, CartItem, SelectedCartItem, OrderItemAddon,
        SubscriptionPlanEntity, RestaurantSubscription, OrderUsage, Invoice, Transaction,
        MenuAddon, FoodCourtCart, SubscriptionChangeLog, OrderActivityLog, Badge
    ],
   migrations: [__dirname + '/migrations/*{.ts,.js}'],
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
