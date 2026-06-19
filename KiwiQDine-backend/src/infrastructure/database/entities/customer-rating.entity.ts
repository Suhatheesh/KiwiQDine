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
import { Customer } from './customer.entity';
import { Restaurant } from './restaurant.entity';
import { Order } from './order.entity';

@Entity('customer_ratings')
@Index(['customerId'])
@Index(['restaurantId'])
@Index(['orderId'])
export class CustomerRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.ratings)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid' })
  restaurantId: string;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'int' })
  rating: number; // Rating from 1 to 5

  @Column({ type: 'text', nullable: true })
  comment: string; // Optional comment/review text

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional metadata (e.g., food quality, service, ambiance ratings)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

