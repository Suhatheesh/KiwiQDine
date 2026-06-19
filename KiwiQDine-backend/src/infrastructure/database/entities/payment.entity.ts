import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  QR = 'qr',
  CASHIER = 'cashier', // Generic cashier payment (deprecated - use specific cashier methods below)
  CASHIER_CASH = 'cashier_cash', // Cashier payment with cash
  CASHIER_CARD = 'cashier_card', // Cashier payment with card
  CASHIER_QR = 'cashier_qr', // Cashier payment with QR code
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payments')
@Index(['orderId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.payments)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  // Cash payment tracking fields
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'Amount given by customer (for cash payments)' })
  amountTendered: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: 'Change returned to customer (for cash payments)' })
  changeReturned: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
