import { Entity, Column, ManyToOne, OneToMany, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { OrderItem } from './order-item.entity';
import { Category } from './category.entity';
import { MenuAddon } from './menu-addon.entity';

@Entity('menus')
@Index(['restaurantId'])
@Index(['categoryId'])
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menus)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  // Category relation - Proper FK relationship
  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  note: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  image: string; // S3 public URL or signed URL

  @Column({ nullable: true })
  imageKey: string; // S3 key for image

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'int', nullable: true })
  quantityAvailable: number;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean; // Manager can mark items as featured

  @Column({ type: 'int', default: 0 })
  featuredOrder: number; // Order/priority for featured items display (lower = higher priority)

  @Column({ type: 'jsonb', nullable: true })
  badges: string[]; // Array of badge types: ['new', 'bestseller', 'chef_special', 'spicy', 'vegetarian', 'vegan', 'gluten_free']

  @Column({ type: 'int', nullable: true })
  preparationTime: number;

  @Column({ nullable: true })
  availableFrom: string; // Time in HH:mm format (e.g., "12:00") - when item becomes available

  @Column({ nullable: true })
  availableTo: string; // Time in HH:mm format (e.g., "22:00") - when item stops being available

  @Column({ type: 'jsonb', nullable: true })
  variantOptions?: Array<{
    id?: string;
    name: string;
    type: 'single' | 'multiple';
    required?: boolean;
    options: Array<{
      name: string;
      price: number;
    }>;
  }>;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.menu)
  orderItems: OrderItem[];

  // Many-to-many relationship with Addon through MenuAddon junction table
  @OneToMany(() => MenuAddon, (menuAddon) => menuAddon.menu)
  menuAddons: MenuAddon[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}