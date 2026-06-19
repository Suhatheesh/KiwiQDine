import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum OrderStatusType {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('order_statuses')
@Index(['code'], { unique: true })
export class OrderStatus extends BaseEntity {
  @Column({ default: true })
  isActive: boolean;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  // Additional fields for order status management
  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ type: 'enum', enum: OrderStatusType, nullable: true })
  status?: OrderStatusType;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  updatedBy?: string;

}