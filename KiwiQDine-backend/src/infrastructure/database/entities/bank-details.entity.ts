import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('bank_details')
@Index(['restaurantId'], { unique: true })
export class BankDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  restaurantId: string;

  @OneToOne(() => Restaurant, (restaurant) => restaurant.bankDetails)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  accountName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  branch: string;

  @Column({ nullable: true })
  iban: string;

  @Column({ nullable: true })
  swiftCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
