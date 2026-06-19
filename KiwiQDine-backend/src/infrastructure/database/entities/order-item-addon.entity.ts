import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Addon } from './addon.entity';

@Entity('order_item_addons')
@Index(['orderItemId'])
@Index(['addonId'])
export class OrderItemAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  // OrderItem relation
  @Column({ type: 'uuid' })
  orderItemId: string;

  @ManyToOne(() => OrderItem, (orderItem) => orderItem.orderItemAddons)
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem;

  // Addon relation
  @Column({ type: 'uuid' })
  addonId: string;

  @ManyToOne(() => Addon, (addon) => addon.orderItemAddons)
  @JoinColumn({ name: 'addonId' })
  addon: Addon;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
