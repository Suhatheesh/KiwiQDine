import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { SubscriptionPlanEntity } from './subscription-plan.entity';
import { User } from './user.entity';

export enum SubscriptionChangeType {
  PLAN_ASSIGNED = 'plan_assigned',
  PLAN_CHANGED = 'plan_changed',
  PLAN_UPGRADED = 'plan_upgraded',
  PLAN_DOWNGRADED = 'plan_downgraded',
  PLAN_CANCELLED = 'plan_cancelled',
  PLAN_RENEWED = 'plan_renewed',
  PLAN_EXPIRED = 'plan_expired',
}

export enum SubscriptionChangeInitiator {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  RESTAURANT_ADMIN = 'restaurant_admin',
  SYSTEM = 'system',
}

@Entity('subscription_change_logs')
@Index(['restaurantId', 'createdAt'])
@Index(['changeType', 'createdAt'])
export class SubscriptionChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column({ type: 'uuid', nullable: true })
  oldPlanId: string | null;

  @ManyToOne(() => SubscriptionPlanEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'oldPlanId' })
  oldPlan: SubscriptionPlanEntity | null;

  @Column({ type: 'uuid', nullable: true })
  newPlanId: string | null;

  @ManyToOne(() => SubscriptionPlanEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'newPlanId' })
  newPlan: SubscriptionPlanEntity | null;

  @Column({ type: 'enum', enum: SubscriptionChangeType })
  changeType: SubscriptionChangeType;

  @Column({ type: 'enum', enum: SubscriptionChangeInitiator })
  initiatedBy: SubscriptionChangeInitiator;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
