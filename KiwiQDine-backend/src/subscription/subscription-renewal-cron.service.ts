import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RestaurantSubscription,
  RestaurantSubscriptionStatus,
  SubscriptionPlanEntity,
  SubscriptionPlanStatus,
} from '../infrastructure/database/entities';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionRenewalCronService {
  private readonly logger = new Logger(SubscriptionRenewalCronService.name);

  constructor(
    @InjectRepository(RestaurantSubscription)
    private readonly restaurantSubscriptionRepository: Repository<RestaurantSubscription>,
    private readonly subscriptionService: SubscriptionService,
  ) { }
  

  /**
   * Handle subscription renewals for expiring subscriptions
   * Called by master cron job
   */
  async handleSubscriptionRenewalCron() {
    const today = new Date();
    const endDateStr = this.subscriptionService['formatDate'](today);

    // Find subscriptions that are ending today and are auto-renewable and still active
    const expiringSubscriptions = await this.restaurantSubscriptionRepository.find({
      where: {
        endDate: endDateStr,
        isAutoRenew: true,
        status: RestaurantSubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
    });

    for (const subscription of expiringSubscriptions) {
      // Use the existing plan from the relation
      const plan = subscription.plan;

      if (!plan || plan.isArchived || plan.status !== SubscriptionPlanStatus.ACTIVE) {
        this.logger.warn(`Cannot auto-renew subscription for restaurant ${subscription.restaurantId}. Plan ${plan?.code} is no longer active.`);
        continue;
      }

      await this.subscriptionService.renewSubscription(subscription.restaurantId, plan);
      this.logger.log(`Auto-renewed subscription for restaurant ${subscription.restaurantId} with plan ${plan.code}`);
    }
  }
}
