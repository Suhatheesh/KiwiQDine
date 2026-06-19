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
import { FoodCourt } from './food-court.entity';

export enum VendorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Entity('vendors')
@Index(['foodCourtId'])
@Index(['slug'], { unique: true })
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  cuisineType: string;

  @Column({ type: 'jsonb', nullable: true })
  operatingHours: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  serviceCharge: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'enum', enum: VendorStatus, default: VendorStatus.ACTIVE })
  status: VendorStatus;

  @Column({ type: 'boolean', default: true })
  isAcceptingOrders: boolean;

  @Column({ type: 'int', default: 0 })
  averagePreparationTime: number; // in minutes

  // Food Court relation
  @Column()
  foodCourtId: string;

  @ManyToOne(() => FoodCourt, (foodCourt) => foodCourt.vendors)
  @JoinColumn({ name: 'foodCourtId' })
  foodCourt: FoodCourt;

  // Relations
  @OneToMany('Menu', 'vendor')
  menus: any[];

  @OneToMany('Order', 'vendor')
  orders: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
