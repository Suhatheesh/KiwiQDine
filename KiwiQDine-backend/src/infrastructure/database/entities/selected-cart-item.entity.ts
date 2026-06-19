import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('selected_cart_items')
export class SelectedCartItem extends BaseEntity {
  @Column({ type: 'uuid' })
  cartItemId: string;

  @ManyToOne('CartItem', { lazy: true })
  @JoinColumn({ name: 'cartItemId' })
  cartItem: Promise<any>;

  @Column({ type: 'uuid' })
  itemId: string;

  @Column({ type: 'uuid' })
  menuId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}