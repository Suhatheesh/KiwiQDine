import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { CustomerRating } from './customer-rating.entity';
import { Restaurant } from './restaurant.entity';

@Entity('customers')
@Index(['phone', 'restaurantId'], { unique: true })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phone: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  restaurantId: string;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @OneToMany(() => CustomerRating, (rating) => rating.customer)
  ratings: CustomerRating[];

  @Column({ nullable: true })
  refreshTokenHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
