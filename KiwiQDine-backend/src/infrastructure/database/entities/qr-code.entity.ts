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
import { Restaurant } from './restaurant.entity';

export enum QRCodeType {
  TABLE = 'TABLE',
  FOOD_COURT = 'FOOD_COURT',
  TAKE_AWAY = 'TAKE_AWAY',
  PARKING = 'PARKING',
}

export enum QRCodeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('qr_codes')
@Index(['restaurantId'])
export class QRCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  qrUrl: string;

  @Column({ type: 'enum', enum: QRCodeType })
  type: QRCodeType;

  @Column({ type: 'enum', enum: QRCodeStatus, default: QRCodeStatus.ACTIVE })
  status: QRCodeStatus;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.qrCodes)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
