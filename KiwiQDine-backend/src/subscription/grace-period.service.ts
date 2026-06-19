import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Restaurant, Invoice, InvoiceStatus, RestaurantSubscription, RestaurantSubscriptionStatus } from '@/infrastructure/database/entities';

@Injectable()
export class GracePeriodService {
    private readonly logger = new Logger(GracePeriodService.name);

    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
        @InjectRepository(RestaurantSubscription)
        private readonly subscriptionRepository: Repository<RestaurantSubscription>,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Get grace period duration in days from environment variable
     */
    getGracePeriodDays(): number {
        return parseInt(this.configService.get<string>('GRACE_PERIOD_DAYS', '2'), 10);
    }

    /**
     * Start grace period for a restaurant
     * Called when subscription expires and there are unpaid invoices
     */
    async startGracePeriod(restaurantId: string): Promise<void> {
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId },
        });

        if (!restaurant) {
            this.logger.warn(`Restaurant ${restaurantId} not found`);
            return;
        }

        const today = new Date();
        const gracePeriodDays = this.getGracePeriodDays();
        const gracePeriodEndDate = new Date(today);
        gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + gracePeriodDays);

        restaurant.status = 'grace_period';
        restaurant.gracePeriodStartDate = this.formatDate(today);
        restaurant.gracePeriodEndDate = this.formatDate(gracePeriodEndDate);

        await this.restaurantRepository.save(restaurant);

        this.logger.log(
            `Grace period started for restaurant ${restaurantId}. ` +
            `Start: ${restaurant.gracePeriodStartDate}, End: ${restaurant.gracePeriodEndDate}`
        );
    }

    /**
     * End grace period and archive restaurant (set to inactive)
     * Called when grace period expires and invoices are still unpaid
     */
    async archiveRestaurant(restaurantId: string): Promise<void> {
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId },
        });

        if (!restaurant) {
            this.logger.warn(`Restaurant ${restaurantId} not found`);
            return;
        }

        // Mark all active subscriptions as cancelled
        await this.subscriptionRepository.update(
            {
                restaurantId,
                status: RestaurantSubscriptionStatus.ACTIVE,
            },
            {
                status: RestaurantSubscriptionStatus.CANCELLED,
            }
        );

        // Archive means set to inactive
        restaurant.status = 'inactive';
        restaurant.isActive = false;

        await this.restaurantRepository.save(restaurant);

        this.logger.log(`Restaurant ${restaurantId} archived (set to inactive) due to unpaid invoices after grace period`);
    }

    /**
     * Check if restaurant has unpaid invoices
     */
    async hasUnpaidInvoices(restaurantId: string): Promise<boolean> {
        const unpaidInvoices = await this.invoiceRepository.count({
            where: {
                restaurantId,
                status: InvoiceStatus.PENDING,
            },
        });

        return unpaidInvoices > 0;
    }

    /**
     * Check if restaurant has overdue invoices
     */
    async hasOverdueInvoices(restaurantId: string): Promise<boolean> {
        const today = this.formatDate(new Date());

        const overdueInvoices = await this.invoiceRepository.count({
            where: {
                restaurantId,
                status: InvoiceStatus.PENDING,
            },
        });

        if (overdueInvoices === 0) return false;

        // Check if any pending invoice has a due date in the past
        const invoices = await this.invoiceRepository.find({
            where: {
                restaurantId,
                status: InvoiceStatus.PENDING,
            },
        });

        return invoices.some(invoice => invoice.due_date < today);
    }

    /**
     * Manually adjust grace period for a restaurant (Super Admin only)
     */
    async adjustGracePeriod(
        restaurantId: string,
        gracePeriodEndDate: string
    ): Promise<Restaurant> {
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId },
        });

        if (!restaurant) {
            throw new NotFoundException(`Restaurant ${restaurantId} not found`);
        }

        restaurant.gracePeriodEndDate = gracePeriodEndDate;

        await this.restaurantRepository.save(restaurant);

        this.logger.log(
            `Grace period adjusted for restaurant ${restaurantId}. New end date: ${gracePeriodEndDate}`
        );

        return restaurant;
    }

    /**
     * Clear grace period (when invoices are paid)
     */
    async clearGracePeriod(restaurantId: string): Promise<void> {
        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId },
        });

        if (!restaurant) {
            this.logger.warn(`Restaurant ${restaurantId} not found`);
            return;
        }

        // Only clear if restaurant is in grace period
        if (restaurant.status === 'grace_period') {
            restaurant.status = 'active';
            restaurant.gracePeriodStartDate = null;
            restaurant.gracePeriodEndDate = null;

            await this.restaurantRepository.save(restaurant);

            this.logger.log(`Grace period cleared for restaurant ${restaurantId}`);
        }
    }

    /**
     * Get restaurants in grace period that have expired
     */
    async getExpiredGracePeriodRestaurants(): Promise<Restaurant[]> {
        const today = this.formatDate(new Date());

        const restaurants = await this.restaurantRepository
            .createQueryBuilder('restaurant')
            .where('restaurant.status = :status', { status: 'grace_period' })
            .andWhere('restaurant.gracePeriodEndDate <= :today', { today })
            .getMany();

        return restaurants;
    }

    /**
     * Get restaurants whose subscriptions have expired with unpaid invoices
     * These should enter grace period
     */
    async getRestaurantsNeedingGracePeriod(): Promise<Restaurant[]> {
        const today = this.formatDate(new Date());

        // Find restaurants with expired subscriptions
        const expiredSubscriptions = await this.subscriptionRepository
            .createQueryBuilder('subscription')
            .where('subscription.endDate <= :today', { today })
            .andWhere('subscription.status = :status', { status: RestaurantSubscriptionStatus.ACTIVE })
            .getMany();

        const restaurantsNeedingGracePeriod: Restaurant[] = [];

        for (const subscription of expiredSubscriptions) {
            // Check if restaurant has unpaid invoices
            const hasUnpaid = await this.hasUnpaidInvoices(subscription.restaurantId);

            if (hasUnpaid) {
                const restaurant = await this.restaurantRepository.findOne({
                    where: { id: subscription.restaurantId },
                });

                // Only add if not already in grace period or inactive (archived)
                if (restaurant && restaurant.status !== 'grace_period' && restaurant.status !== 'inactive') {
                    restaurantsNeedingGracePeriod.push(restaurant);
                }
            }
        }

        return restaurantsNeedingGracePeriod;
    }

    /**
     * Format date to YYYY-MM-DD
     */
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
