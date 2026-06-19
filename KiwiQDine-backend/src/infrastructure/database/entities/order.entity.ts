import { Entity, Column, ManyToOne, OneToMany, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { Customer } from './customer.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { Table } from './table.entity';
import { CustomerRating } from './customer-rating.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ABANDONED = 'abandoned',
}

@Entity('orders')
@Index(['restaurantId'])
@Index(['customerId'])
@Index(['orderNumber'], { unique: true })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  orderNumber: string; // Readable order number like #4523313

  @Column({ type: 'uuid' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.orders)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ nullable: true })
  tableNo: string;

  @Column({ type: 'uuid', nullable: true })
  tableId: string; // Reference to Table entity

  @ManyToOne(() => Table, { nullable: true })
  @JoinColumn({ name: 'tableId' })
  table: Table;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'boolean', default: false })
  isOnHold: boolean;

  @Column({ nullable: true })
  holdReason: string;

  @Column({ type: 'enum', enum: ['takeaway', 'dine_in', 'parking'], nullable: true })
  orderType: 'takeaway' | 'dine_in' | 'parking';

  // Pricing Breakdown
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number; // Items total before charges

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceCharge: number; // Calculated service charge

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number; // Tax amount (for future use)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number; // Discount amount (for future use)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number; // subtotal + serviceCharge + tax - discount

  get total(): number {
    return this.totalAmount;
  }

  @Column({ type: 'text', nullable: true })
  notes: string; // Customer notes or special instructions for the order

  // Vehicle Information (Optional - for parking orders)
  @Column({ type: 'varchar', nullable: true })
  vehicleModel: string; // e.g., "Toyota Camry", "Honda Civic"

  @Column({ type: 'varchar', nullable: true })
  vehicleNumber: string; // e.g., "ABC-1234", "CAR-5678"

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @OneToMany(() => CustomerRating, (rating) => rating.order)
  ratings: CustomerRating[];

  @Column({ type: 'varchar', nullable: true })
  createdBy: string; // User ID or Customer ID who created the order

  @Column({ type: 'enum', enum: ['customer', 'staff'], default: 'staff' })
  createdByType: 'customer' | 'staff'; // Track if order was created by customer or restaurant staff

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}