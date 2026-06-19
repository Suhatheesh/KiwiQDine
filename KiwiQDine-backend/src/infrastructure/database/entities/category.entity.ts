import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Restaurant } from './restaurant.entity';
import { Menu } from './menu.entity';

@Entity('categories')
@Index(['restaurantId', 'name'], { unique: true })
@Index(['restaurantId', 'code'], { unique: true })
@Index(['restaurantId'])
export class Category extends BaseEntity {
  @Column({ type: 'uuid' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string; // S3 public URL or signed URL

  @Column({ nullable: true })
  imageKey: string; // S3 key for image

  @Column({ type: 'boolean', default: false })
  isShowcase: boolean; // Featured/default category to highlight to customers

  @Column({ type: 'int', default: 0 })
  displayOrder: number; // Order for category display (lower = higher priority)

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Whether category is visible to customers

  @OneToMany(() => Menu, menu => menu.category)
  menus: Menu[];
}