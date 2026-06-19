import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RestaurantSubscription } from './restaurant-subscription.entity';
import { OrderUsage } from './order-usage.entity';
import { Tenant } from './tenant.entity';

export enum SubscriptionPlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum PlanBillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('subscription_plans')
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  priceMonthly: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  priceYearly: string | null;

  @Column({ type: 'enum', enum: SubscriptionPlanStatus, default: SubscriptionPlanStatus.ACTIVE })
  status: SubscriptionPlanStatus;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  features: string[];

  @Column({ type: 'enum', enum: PlanBillingCycle, default: PlanBillingCycle.MONTHLY })
  billingCycle: PlanBillingCycle;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  yearlySavingsPercent: number | null;

  @Column({ type: 'integer', nullable: true, comment: 'Maximum number of orders/invoices allowed per month (null = unlimited)' })
  orderLimit: number | null;

  @Column({ type: 'integer', nullable: true, comment: 'Maximum number of QR codes allowed (null = unlimited)' })
  qrLimit: number | null;

  @Column({ type: 'integer', nullable: true, comment: 'Maximum number of users allowed (null = unlimited)' })
  userLimit: number | null;

  @Column({ type: 'integer', nullable: true, comment: 'Maximum number of tables allowed (null = unlimited)' })
  tableLimit: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, comment: 'Overage charge per additional invoice/order (in USD)' })
  overageChargePerInvoice: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, comment: 'Overage charge per additional user per month (in USD)' })
  overageChargePerUser: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, comment: 'Overage charge per additional QR code per month (in USD)' })
  overageChargePerQR: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, comment: 'Overage charge per additional table per month (in USD)' })
  overageChargePerTable: string | null;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'boolean', default: false })
  isSpecializedPlan: boolean;

  @Column({ type: 'uuid', nullable: true })
  specializedPlanId: string | null;

  @Column({ type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RestaurantSubscription, (subscription) => subscription.plan)
  restaurantSubscriptions: RestaurantSubscription[];

  @OneToMany(() => OrderUsage, (usage) => usage.plan)
  orderUsages: OrderUsage[];
}



