import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { SubscriptionPlanEntity } from './subscription-plan.entity';
import { RestaurantSubscription } from './restaurant-subscription.entity';

export const InvoiceStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export enum InvoiceType {
  SUBSCRIPTION = 'subscription',
  OVERAGE = 'overage',
  ONE_TIME = 'one_time',
}

@Entity('invoice')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  invoiceName: string; // Format: 'INV-YYYYMM'

  @Column({ type: 'uuid' })
  restaurantId: string;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column({ type: 'uuid', nullable: true })
  planId: string;

  @ManyToOne(() => SubscriptionPlanEntity)
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlanEntity;

  @Column({ type: 'uuid', nullable: true })
  restaurantSubscriptionId: string;

  @ManyToOne(() => RestaurantSubscription)
  @JoinColumn({ name: 'restaurantSubscriptionId' })
  restaurantSubscription: RestaurantSubscription;

  @Column({ type: 'enum', enum: InvoiceType, default: InvoiceType.SUBSCRIPTION })
  type: InvoiceType;

  @Column({ type: 'varchar', length: 32 })
  billing_period: string;

  @Column({ type: 'date', nullable: true })
  billing_period_start: string;

  @Column({ type: 'date', nullable: true })
  billing_period_end: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  fees: number;

  @Column({ type: 'varchar', length: 16, default: InvoiceStatus.PENDING })
  status: string;

  @Column({ type: 'date' })
  due_date: string;

  @Column({ type: 'date', nullable: true })
  paid_date: string;

  @Column({ type: 'varchar', nullable: true })
  invoiceAttachmentUrl: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
