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
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrderItemAddon } from './order-item-addon.entity';
import { MenuAddon } from './menu-addon.entity';

export enum AddonType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export enum AddonStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('addons')
@Index(['restaurantId'])
@Index(['name', 'restaurantId'])
export class Addon extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string; // S3 public URL or signed URL

  @Column({ nullable: true })
  imageKey: string; // S3 key for image management

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'enum', enum: AddonType, default: AddonType.SINGLE })
  type: AddonType;

  @Column({ type: 'enum', enum: AddonStatus, default: AddonStatus.ACTIVE })
  status: AddonStatus;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'int', default: 1 })
  maxSelection: number;

  // Restaurant scoping - addons belong to a restaurant
  @Column({ type: 'uuid' })
  restaurantId: string;

  // Many-to-many relationship with Menu through MenuAddon junction table
  @OneToMany(() => MenuAddon, (menuAddon) => menuAddon.addon)
  menuAddons: MenuAddon[];

  // Relations
  @OneToMany(() => OrderItemAddon, (orderItemAddon) => orderItemAddon.addon)
  orderItemAddons: OrderItemAddon[];
}
