import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

export enum OrderAction {
    // Order Actions
    CREATED = 'created',
    CONFIRMED = 'confirmed',
    PREPARING = 'preparing',
    READY = 'ready',
    SERVED = 'served',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    ON_HOLD = 'on_hold',
    RELEASED = 'released',
    VIEWED = 'viewed',
    UPDATED = 'updated',
    PAYMENT_PROCESSED = 'payment_processed',
    DELETED = 'deleted',

    // Customer Behavior Actions
    QR_SCANNED = 'qr_scanned',
    MENU_VIEWED = 'menu_viewed',
    ITEM_VIEWED = 'item_viewed',
    CART_ACTION = 'cart_action',
    SEARCH = 'search',

    // Staff System Actions
    LOGIN = 'login',
    LOGOUT = 'logout',
    MENU_MODIFIED = 'menu_modified',
    RESTAURANT_MODIFIED = 'restaurant_modified',
    STAFF_MANAGEMENT = 'staff_management',
    SETTINGS_CHANGED = 'settings_changed',
}

@Entity('order_activity_logs')
export class OrderActivityLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    orderId: string;

    @ManyToOne(() => Order, { nullable: true })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column({ type: 'uuid', nullable: true })
    restaurantId: string;

    @Column({ type: 'uuid', nullable: true })
    tenantId: string;

    @Column({ type: 'varchar', nullable: true })
    entityId: string; // Generic ID for other entities (menuId, userId, etc.)

    @Column({ type: 'enum', enum: OrderAction })
    action: OrderAction;

    @Column({ nullable: true })
    status: string; // The order status after this action

    @Column({ type: 'uuid', nullable: true })
    performedById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'performedById' })
    performedBy: User;

    @Column({ nullable: true })
    performedByName: string;

    @Column({ nullable: true })
    performedByRole: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: any; // Additional data like payment method, cancellation reason, etc.

    @CreateDateColumn()
    createdAt: Date;
}
