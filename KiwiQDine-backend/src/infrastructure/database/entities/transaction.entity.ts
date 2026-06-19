import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('transactions')
@Index(['id'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'restaurant_id', type: 'varchar', length: 50 })
  restaurantId: string;

  @Column({ name: 'invoice_id', type: 'varchar', length: 50 })
  invoiceId: string; // TODO: Set as FK to invoice table later

  @Column({ name: 'amount', type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'date', type: 'date' })
  date: string;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'pending' })
  status: string;

  @Column({ name: 'type', type: 'varchar', length: 30, default: 'payout' })
  type: string; // e.g., 'payout', 'adjustment'

  @Column({ type: 'varchar', nullable: true })
  attachmentUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
