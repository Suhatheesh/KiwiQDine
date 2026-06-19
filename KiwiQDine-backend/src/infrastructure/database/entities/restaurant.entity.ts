import { Entity, Column, Index, ManyToOne, OneToMany, OneToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Menu } from './menu.entity';
import { BankDetails } from './bank-details.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { Order } from './order.entity';
import { QRCode } from './qr-code.entity';
import { RestaurantSubscription } from './restaurant-subscription.entity';
import { OrderUsage } from './order-usage.entity';
import { Category } from './category.entity';

@Entity('restaurants')
@Index(['tenantId'])
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.restaurants)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ nullable: true })
  logo: string; // S3 public URL or signed URL

  @Column({ nullable: true })
  logoKey: string; // S3 key for logo

  @Column({ nullable: true })
  banner: string; // S3 public URL for banner image

  @Column({ nullable: true })
  bannerKey: string; // S3 key for banner

  @Column({ type: 'jsonb', nullable: true })
  address: {
    lane?: string;
    city?: string;
    district?: string;
    country?: string;
  };

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhoneNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  openTime: string; // e.g., "09:00"

  @Column({ nullable: true })
  closeTime: string; // e.g., "22:00"

  @Column({ type: 'jsonb', nullable: true })
  openHours: Record<string, string>; // e.g., { "mon-fri": "10:00-22:00", "sat-sun": "09:00-23:00" }

  @Column({ type: 'enum', enum: ['active', 'inactive', 'grace_period'], default: 'active' })
  status: 'active' | 'inactive' | 'grace_period';

  @Column({ type: 'enum', enum: ['pay_at_first', 'pay_at_last'], default: 'pay_at_last', nullable: true })
  paymentTiming: 'pay_at_first' | 'pay_at_last';

  // Waiter Confirmation for Pay-Last Restaurants
  // When enabled, orders in pay_at_last restaurants require manual waiter confirmation before going to kitchen
  // When disabled, orders auto-confirm and go directly to kitchen (default behavior)
  // This setting only applies to pay_at_last restaurants (pay_at_first always requires payment first)
  @Column({ type: 'boolean', default: false })
  requireWaiterConfirmation: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletTotalEarned: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletTotalWithdrawn: number;

  @OneToMany(() => Menu, (menu) => menu.restaurant)
  menus: Menu[];

  @OneToMany(() => User, (user) => user.restaurant)
  users: User[];

  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];

  @OneToMany(() => QRCode, (qrCode) => qrCode.restaurant)
  qrCodes: QRCode[];

  @OneToMany(() => RestaurantSubscription, (subscription) => subscription.restaurant)
  subscriptions: RestaurantSubscription[];

  @OneToMany(() => OrderUsage, (usage) => usage.restaurant)
  orderUsages: OrderUsage[];

  @OneToMany(() => Category, (category) => category.restaurant)
  categories: Category[];

  @Column({ nullable: true })
  primaryColor: string;

  @Column({ nullable: true })
  secondaryColor: string;

  @Column({ nullable: true })
  tertiaryColor: string;

  // Service Charge Configuration
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  serviceChargePercentage: number; // e.g., 10.00 for 10% (default: 0 = disabled)

  @Column({ type: 'boolean', default: false })
  applyServiceCharge: boolean; // Toggle to enable/disable service charge (default: disabled)

  @Column({ type: 'enum', enum: ['percentage', 'fixed'], default: 'percentage' })
  serviceChargeType: 'percentage' | 'fixed';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fixedServiceCharge: number; // For fixed amount instead of percentage

  // Grace Period Configuration
  @Column({ type: 'date', nullable: true })
  gracePeriodStartDate: string | null; // When grace period started (subscription expired with unpaid invoice)

  @Column({ type: 'date', nullable: true })
  gracePeriodEndDate: string | null; // When grace period ends (will be archived if still unpaid)

  @OneToOne(() => BankDetails, (bankDetails) => bankDetails.restaurant)
  bankDetails: BankDetails;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}