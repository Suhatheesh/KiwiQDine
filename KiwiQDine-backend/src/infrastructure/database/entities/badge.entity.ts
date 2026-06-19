import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('badges')
@Index(['restaurantId'])
@Index(['restaurantId', 'code'], { unique: true })
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column()
  name: string; // Display name (e.g., "Chef's Special", "New Arrival")

  @Column()
  code: string; // Unique code for the badge (e.g., "chef_special", "new")

  @Column({ nullable: true })
  description: string; // Optional description

  @Column({ nullable: true })
  icon: string; // Icon name or URL (e.g., "fire", "star", "https://...")

  @Column({ default: '#FF5722' })
  backgroundColor: string; // Hex color for badge background

  @Column({ default: '#FFFFFF' })
  textColor: string; // Hex color for badge text

  @Column({ type: 'int', default: 0 })
  displayOrder: number; // Order for display (lower = higher priority)

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Whether badge is available for use

  @Column({ type: 'boolean', default: false })
  isSystem: boolean; // System badges cannot be deleted (e.g., bestseller)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
