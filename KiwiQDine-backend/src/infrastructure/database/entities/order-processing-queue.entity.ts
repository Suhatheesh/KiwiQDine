import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrderStatus } from './order-status.entity';
import { Order } from './order.entity';

@Entity('order_processing_queues')
export class OrderProcessingQueue extends BaseEntity {
  @Column({ type: 'uuid' })
  orderStatusId: string;

  @ManyToOne(() => OrderStatus)
  @JoinColumn({ name: 'orderStatusId' })
  orderStatus: OrderStatus;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
