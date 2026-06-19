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
import { Restaurant } from './restaurant.entity';

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
}

@Entity('tables')
@Index(['restaurantId'])
@Index(['restaurantId', 'name'], { unique: true }) // Table name must be unique per restaurant
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Table name (unique per restaurant)

  @Column()
  tableNumber: string;

  @Column({ type: 'int', default: 4 })
  capacity: number;

  @Column({ type: 'enum', enum: TableStatus, default: TableStatus.AVAILABLE })
  status: TableStatus;

  @Column({ unique: true, nullable: true })
  qrCode: string;

  @Column({ nullable: true })
  qrCodeImage: string;

  @Column({ type: 'jsonb', nullable: true })
  location: Record<string, any>; // x, y coordinates for restaurant layout

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  // Restaurant relation
  @Column()
  restaurantId: string;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  // Relations
  @OneToMany('Order', 'table')
  orders: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
