import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrderItem } from './order-item.entity';

@Entity('items')
@Index(['name'], { unique: true })
export class Item extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  maximumPermitted: number;

  @Column({ type: 'int', nullable: true })
  preparationTime?: number;

  // Note: This entity is legacy and may be deprecated in favor of Menu entity
  // Addons now reference Menu, not Item
}