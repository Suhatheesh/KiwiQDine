import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { Menu } from './menu.entity';

@Entity('order_notes')
export class OrderNote extends BaseEntity {
  @Column()
  note: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid' })
  menuId: string;

  @ManyToOne(() => Menu)
  @JoinColumn({ name: 'menuId' })
  menu: Menu;
}
