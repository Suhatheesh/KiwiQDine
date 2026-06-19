import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Addon } from './addon.entity';

/**
 * Junction table for many-to-many relationship between Menu and Addon
 * Allows the same addon to be assigned to multiple menu items
 * Example: "Extra Cheese" can be available for both "Veg Pizza" and "Chicken Pizza"
 */
@Entity('menu_addons')
@Index(['menuId', 'addonId'], { unique: true }) // Prevent duplicate assignments
export class MenuAddon {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    menuId: string;

    @ManyToOne(() => Menu, (menu) => menu.menuAddons, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'menuId' })
    menu: Menu;

    @Column({ type: 'uuid' })
    addonId: string;

    @ManyToOne(() => Addon, (addon) => addon.menuAddons, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'addonId' })
    addon: Addon;

    // Optional: Override price for this specific menu-addon combination
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    overridePrice?: number;

    // Optional: Make addon required for this specific menu item
    @Column({ type: 'boolean', default: false })
    isRequired: boolean;

    // Optional: Display order for this addon on this menu item
    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
