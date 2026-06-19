import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GracePeriodService } from './grace-period.service';

@Injectable()
export class GracePeriodCronService {
    private readonly logger = new Logger(GracePeriodCronService.name);

    constructor(
        private readonly gracePeriodService: GracePeriodService,
    ) { }

    /**
     * Check for restaurants that need to enter grace period
     * Called by master cron job
     */
    async handleGracePeriodStart() {
        this.logger.log('Running grace period start check...');

        try {
            const restaurants = await this.gracePeriodService.getRestaurantsNeedingGracePeriod();

            this.logger.log(`Found ${restaurants.length} restaurants needing grace period`);

            for (const restaurant of restaurants) {
                try {
                    await this.gracePeriodService.startGracePeriod(restaurant.id);
                    this.logger.log(`Started grace period for restaurant ${restaurant.id} (${restaurant.name})`);
                } catch (error) {
                    this.logger.error(
                        `Failed to start grace period for restaurant ${restaurant.id}: ${error.message}`,
                        error.stack
                    );
                }
            }

            this.logger.log('Grace period start check completed');
        } catch (error) {
            this.logger.error(`Grace period start check failed: ${error.message}`, error.stack);
        }
    }

    /**
     * Check for restaurants whose grace period has expired
     * Archive them if invoices are still unpaid
     * Called by master cron job
     */
    async handleGracePeriodExpiration() {
        this.logger.log('Running grace period expiration check...');

        try {
            const restaurants = await this.gracePeriodService.getExpiredGracePeriodRestaurants();

            this.logger.log(`Found ${restaurants.length} restaurants with expired grace period`);

            for (const restaurant of restaurants) {
                try {
                    // Double-check if invoices are still unpaid
                    const hasUnpaid = await this.gracePeriodService.hasUnpaidInvoices(restaurant.id);

                    if (hasUnpaid) {
                        await this.gracePeriodService.archiveRestaurant(restaurant.id);
                        this.logger.log(
                            `Archived restaurant ${restaurant.id} (${restaurant.name}) due to unpaid invoices after grace period`
                        );
                    } else {
                        // Invoices were paid during grace period, clear grace period
                        await this.gracePeriodService.clearGracePeriod(restaurant.id);
                        this.logger.log(
                            `Cleared grace period for restaurant ${restaurant.id} (${restaurant.name}) - invoices paid`
                        );
                    }
                } catch (error) {
                    this.logger.error(
                        `Failed to process expired grace period for restaurant ${restaurant.id}: ${error.message}`,
                        error.stack
                    );
                }
            }

            this.logger.log('Grace period expiration check completed');
        } catch (error) {
            this.logger.error(`Grace period expiration check failed: ${error.message}`, error.stack);
        }
    }
}
