import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('alert_configurations')
@Index(['restaurantId'], { unique: true })
export class AlertConfiguration {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    restaurantId: string;

    // Reminder intervals (in minutes)
    @Column({ type: 'int', default: 5 })
    pendingOrderReminderInterval: number;

    @Column({ type: 'int', default: 3 })
    waiterConfirmationReminderInterval: number;

    // Overtime thresholds (in minutes)
    @Column({ type: 'int', default: 30 })
    orderOvertimeThreshold: number;

    @Column({ type: 'int', default: 20 })
    itemOvertimeThreshold: number;

    // Feature flags
    @Column({ type: 'boolean', default: true })
    enableImmediateAlerts: boolean;

    @Column({ type: 'boolean', default: true })
    enablePendingOrderReminders: boolean;

    @Column({ type: 'boolean', default: true })
    enableWaiterConfirmationReminders: boolean;

    @Column({ type: 'boolean', default: true })
    enableOvertimeAlerts: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
