import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('food_court_carts')
@Index(['sessionId'])
@Index(['customerId'])
export class FoodCourtCart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  sessionId: string; // For guest users (browser session)

  @Column({ type: 'uuid', nullable: true })
  customerId: string; // For authenticated customers

  @Column({ type: 'uuid' })
  tenantId: string; // Food court tenant ID

  @Column({ type: 'jsonb' })
  items: Array<{
    restaurantId: string;
    restaurantName: string;
    menuId: string;
    menuName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions?: string | object;
    selectedAddons?: Array<{ addonId: string; quantity: number }>;
    image?: string;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'uuid', nullable: true })
  tableId: string;

  @Column({ nullable: true })
  tableNo: string;

  @Column({ type: 'uuid', nullable: true })
  qrCodeId: string;

  @Column({ type: 'enum', enum: ['takeaway', 'dine_in', 'parking'], nullable: true })
  orderType: 'takeaway' | 'dine_in' | 'parking';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
