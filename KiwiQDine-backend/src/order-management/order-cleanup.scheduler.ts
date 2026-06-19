import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, In } from 'typeorm';
import { Order } from '../infrastructure/database/entities';
import { OrderStatus } from '../infrastructure/database/entities/order.entity';

@Injectable()
export class OrderCleanupScheduler {
    private readonly logger = new Logger(OrderCleanupScheduler.name);

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
    ) { }

    /**
     * Runs daily at 2:00 AM to mark abandoned orders
     * Cron: At 02:00 every day
     */
    @Cron('0 2 * * *', {
        name: 'mark-abandoned-orders',
        timeZone: 'Asia/Kolkata',
    })
    async handleAbandonedOrders() {
        this.logger.log('Running abandoned orders cleanup...');

        try {
            // Calculate cutoff date (1 day ago) in IST timezone
            const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const oneDayAgo = new Date(nowIST);
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            this.logger.log(`Marking orders older than ${oneDayAgo.toISOString()} as abandoned (IST timezone)`);

            // Find orders that are:
            // 1. Older than 1 day
            // 2. NOT completed, cancelled, or already abandoned
            // 3. Still in pending/confirmed/preparing/ready/served status
            const abandonedOrders = await this.orderRepository.find({
                where: {
                    createdAt: LessThan(oneDayAgo),
                    status: Not(In([
                        OrderStatus.COMPLETED,
                        OrderStatus.CANCELLED,
                        OrderStatus.ABANDONED,
                    ])),
                },
                relations: ['restaurant'],
            });

            if (abandonedOrders.length === 0) {
                this.logger.log('No abandoned orders found');
                return;
            }

            this.logger.log(`Found ${abandonedOrders.length} abandoned orders`);

            // Group by restaurant for better logging
            const ordersByRestaurant = abandonedOrders.reduce((acc, order) => {
                const restaurantId = order.restaurantId;
                const restaurantName = order.restaurant?.name || 'Unknown';

                if (!acc[restaurantId]) {
                    acc[restaurantId] = {
                        name: restaurantName,
                        orders: [],
                    };
                }

                acc[restaurantId].orders.push(order);
                return acc;
            }, {} as Record<string, { name: string; orders: Order[] }>);

            // Mark orders as abandoned
            let totalMarked = 0;
            for (const [restaurantId, data] of Object.entries(ordersByRestaurant)) {
                this.logger.log(`Restaurant: ${data.name} - Marking ${data.orders.length} orders as abandoned`);

                for (const order of data.orders) {
                    const previousStatus = order.status;
                    order.status = OrderStatus.ABANDONED;
                    await this.orderRepository.save(order);

                    this.logger.log(
                        `Marked order ${order.orderNumber} as ABANDONED (was ${previousStatus}, age: ${this.getOrderAge(order.createdAt)} days)`
                    );
                    totalMarked++;
                }
            }

            this.logger.log(`Successfully marked ${totalMarked} orders as ABANDONED across ${Object.keys(ordersByRestaurant).length} restaurants`);
        } catch (error) {
            this.logger.error('Error in abandoned orders cleanup:', error);
        }
    }

    /**
     * Get order age in days (using IST timezone)
     */
    private getOrderAge(createdAt: Date): number {
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const diffMs = nowIST.getTime() - new Date(createdAt).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Manual trigger for testing
     */
    async manualCleanup(daysOld: number = 1): Promise<{ message: string; markedCount: number; orders: any[] }> {
        this.logger.log(`Manual cleanup triggered for orders older than ${daysOld} days`);

        // Calculate cutoff date in IST timezone
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const cutoffDate = new Date(nowIST);
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const abandonedOrders = await this.orderRepository.find({
            where: {
                createdAt: LessThan(cutoffDate),
                status: Not(In([
                    OrderStatus.COMPLETED,
                    OrderStatus.CANCELLED,
                    OrderStatus.ABANDONED,
                ])),
            },
            relations: ['restaurant'],
        });

        const orderDetails = abandonedOrders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            restaurantName: order.restaurant?.name,
            previousStatus: order.status,
            age: this.getOrderAge(order.createdAt),
            createdAt: order.createdAt,
        }));

        // Mark as abandoned
        for (const order of abandonedOrders) {
            order.status = OrderStatus.ABANDONED;
            await this.orderRepository.save(order);
        }

        return {
            message: `Marked ${abandonedOrders.length} orders as ABANDONED`,
            markedCount: abandonedOrders.length,
            orders: orderDetails,
        };
    }

    /**
     * Get statistics about abandoned orders
     */
    async getAbandonedOrdersStats(): Promise<{
        totalAbandoned: number;
        byRestaurant: Array<{ restaurantId: string; restaurantName: string; count: number }>;
        byPreviousStatus: Record<string, number>;
    }> {
        const abandonedOrders = await this.orderRepository.find({
            where: {
                status: OrderStatus.ABANDONED,
            },
            relations: ['restaurant'],
        });

        // Group by restaurant
        const byRestaurant = abandonedOrders.reduce((acc, order) => {
            const restaurantId = order.restaurantId;
            const restaurantName = order.restaurant?.name || 'Unknown';

            const existing = acc.find(r => r.restaurantId === restaurantId);
            if (existing) {
                existing.count++;
            } else {
                acc.push({
                    restaurantId,
                    restaurantName,
                    count: 1,
                });
            }

            return acc;
        }, [] as Array<{ restaurantId: string; restaurantName: string; count: number }>);

        return {
            totalAbandoned: abandonedOrders.length,
            byRestaurant: byRestaurant.sort((a, b) => b.count - a.count),
            byPreviousStatus: {}, // This would require storing previous status
        };
    }
}
