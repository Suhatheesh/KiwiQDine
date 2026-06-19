import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { SubscriptionPlanEntity } from './subscription-plan.entity';
import { OrderUsage } from './order-usage.entity';

export enum RestaurantSubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('restaurant_subscriptions')
@Index(['restaurantId', 'status'])
export class RestaurantSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column({ type: 'uuid' })
  planId: string;

  @ManyToOne(() => SubscriptionPlanEntity, (plan) => plan.restaurantSubscriptions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlanEntity;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'enum', enum: BillingCycle, default: BillingCycle.MONTHLY })
  billingCycle: BillingCycle;

  @Column({ type: 'boolean', default: true })
  isAutoRenew: boolean;

  @Column({ type: 'enum', enum: RestaurantSubscriptionStatus, default: RestaurantSubscriptionStatus.ACTIVE })
  status: RestaurantSubscriptionStatus;

  @Column({ type: 'boolean', default: false })
  isAutoAssigned: boolean;

  @Column({ type: 'uuid', nullable: true })
  usageId: string | null;

  @ManyToOne(() => OrderUsage, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usageId' })
  usage: OrderUsage;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



