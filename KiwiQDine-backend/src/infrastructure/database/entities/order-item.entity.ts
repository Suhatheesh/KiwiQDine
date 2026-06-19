import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  ValueTransformer,
} from 'typeorm';
import { Order } from './order.entity';
import { Menu } from './menu.entity';
import { OrderItemAddon } from './order-item-addon.entity';

// Transformer to handle both strings and objects stored as text
const specialInstructionsTransformer: ValueTransformer = {
  to(value: string | object | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    // If it's a string, store as-is
    if (typeof value === 'string') {
      return value;
    }
    // If it's an object, stringify it
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  },
  from(value: string | null): string | object | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    // Try to parse as JSON, if it fails, return as string
    try {
      const parsed = JSON.parse(value);
      // If parsed result is a string, return it as string
      if (typeof parsed === 'string') {
        return parsed;
      }
      // Otherwise return the parsed object
      return parsed;
    } catch {
      // If it's not valid JSON, return as string
      return value;
    }
  },
};

@Entity('order_items')
@Index(['orderId'])
@Index(['menuId'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'text', nullable: true, transformer: specialInstructionsTransformer })
  specialInstructions: string | object | null;

  @Column({ type: 'enum', enum: ['pending', 'in_progress', 'ready', 'served'], default: 'pending' })
  status: string;

  @Column({ type: 'int', nullable: true })
  estimatedPreparationTime: number; // in minutes (updated with delays)

  @Column({ type: 'int', nullable: true })
  originalPreparationTime: number; // in minutes (initial estimate)

  @Column({ nullable: true })
  tableNo: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readyAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  servedAt: Date;

  // Order relation
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.orderItems)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  // Menu relation
  @Column({ type: 'uuid' })
  menuId: string;

  @ManyToOne(() => Menu, (menu) => menu.orderItems)
  @JoinColumn({ name: 'menuId' })
  menu: Menu;

  // OrderItemAddon relation - cascade delete addons when order item is deleted
  @OneToMany(() => OrderItemAddon, (orderItemAddon) => orderItemAddon.orderItem, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  orderItemAddons: OrderItemAddon[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
