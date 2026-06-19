import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { SubscriptionPlanEntity } from './subscription-plan.entity';

export enum OrderUsageStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}


@Entity('order_usage')
@Index(['restaurantId', 'month'])
export class OrderUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.orderUsages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column({ type: 'varchar', length: 7 })
  month: string; // Format: YYYY-MM

  @Column({ type: 'enum', enum: OrderUsageStatus, default: OrderUsageStatus.ACTIVE })
  status: OrderUsageStatus;

  @Column({ type: 'integer', default: 0 })
  totalOrders: number;

  @Column({ type: 'integer', default: 0 })
  totalUserCount: number;

  @Column({ type: 'integer', default: 0 })
  totalTableCount: number;

  @Column({ type: 'integer', default: 0 })
  totalQRCount: number;

  @Column({ type: 'uuid', nullable: true })
  planId: string | null;

  @ManyToOne(() => SubscriptionPlanEntity, (plan) => plan.orderUsages, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlanEntity | null;

  @Column({ type: 'integer', default: 0 })
  overageCount: number;

  @Column({ type: 'integer', default: 0 })
  overageUserCount: number;

  @Column({ type: 'integer', default: 0 })
  overageTableCount: number;

  @Column({ type: 'integer', default: 0 })
  overageQRCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



