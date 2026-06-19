import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Menu } from './menu.entity';
import { Order } from './order.entity';

@Entity('cart_items')
export class CartItem extends BaseEntity {
  @Column({ type: 'uuid' })
  menuId: string;

  @ManyToOne(() => Menu)
  @JoinColumn({ name: 'menuId' })
  menu: Menu;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @OneToMany('SelectedCartItem', 'cartItem')
  selectedItems: any[];
}
