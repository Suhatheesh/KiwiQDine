import {
  SubscriptionPlanEntity,
  RestaurantSubscription,
  OrderUsage,
  SubscriptionPlanStatus,
} from '../infrastructure/database/entities';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { AssignRestaurantSubscriptionDto } from './dto/assign-restaurant-subscription.dto';

export interface ISubscriptionService {
  createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanEntity>;
  getPlans(status?: SubscriptionPlanStatus): Promise<SubscriptionPlanEntity[]>;
  getPlan(planId: string): Promise<SubscriptionPlanEntity>;
  getPlanByCode(code: string): Promise<SubscriptionPlanEntity | null>;
  updatePlan(planId: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanEntity>;
  assignRestaurantToPlan(dto: AssignRestaurantSubscriptionDto): Promise<RestaurantSubscription>;
  renewSubscription(restaurantId: string, plan: SubscriptionPlanEntity): Promise<RestaurantSubscription>;
  getRestaurantSubscriptions(restaurantId: string): Promise<RestaurantSubscription[]>;
  getActiveSubscription(restaurantId: string): Promise<RestaurantSubscription | null>;
  recordOrderUsage(restaurantId: string, orderDate?: Date, count?: number): Promise<OrderUsage>;
  getOrderUsage(restaurantId: string, month?: string): Promise<OrderUsage[]>;
  evaluateRestaurantSubscription(
    restaurantId: string,
    month?: string,
  ): Promise<{
    usage: OrderUsage | null;
    plan: SubscriptionPlanEntity | null;
    subscription: RestaurantSubscription | null;
  }>;
  canRestaurantCreateOrder(restaurantId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentOrders?: number;
    orderLimit?: number;
    plan?: SubscriptionPlanEntity;
    isOverage?: boolean;
  }>;
}



