import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Restaurant, Table, TableStatus, Order } from '../infrastructure/database/entities';
import { OrderStatus } from '../infrastructure/database/entities/order.entity';

@Injectable()
export class TableResetScheduler {
    private readonly logger = new Logger(TableResetScheduler.name);

    constructor(
        @InjectRepository(Restaurant)
        private restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Table)
        private tableRepository: Repository<Table>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
    ) { }

    /**
     * Runs every hour to check if any restaurant is opening and reset tables
     * Cron: At minute 0 of every hour
     */
    @Cron('0 * * * *', {
        name: 'reset-tables-at-opening',
        timeZone: 'Asia/Kolkata', // Adjust to your timezone
    })
    async handleTableResetAtOpening() {
        this.logger.log('Running scheduled table reset check...');

        try {
            // Get all active restaurants
            const restaurants = await this.restaurantRepository.find({
                where: {
                    isActive: true,
                    status: 'active',
                },
            });

            // Get current time in IST timezone
            const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const currentHour = nowIST.getHours();
            const currentMinute = nowIST.getMinutes();
            const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

            this.logger.log(`Current time: ${currentTime}, Checking ${restaurants.length} restaurants`);

            for (const restaurant of restaurants) {
                // Check if restaurant has opening time configured
                if (!restaurant.openTime) {
                    continue;
                }

                // Parse opening time (format: "09:00")
                const [openHour, openMinute] = restaurant.openTime.split(':').map(Number);

                // Check if current time matches opening time (within the same hour)
                if (currentHour === openHour && currentMinute === 0) {
                    this.logger.log(`Restaurant ${restaurant.name} (${restaurant.id}) is opening now. Resetting tables...`);
                    await this.resetRestaurantTables(restaurant.id, restaurant.name);
                }
            }

            this.logger.log('Table reset check completed');
        } catch (error) {
            this.logger.error('Error in table reset scheduler:', error);
        }
    }

    /**
     * Reset tables for a specific restaurant
     * Only resets tables that don't have active orders
     */
    private async resetRestaurantTables(restaurantId: string, restaurantName: string): Promise<void> {
        try {
            // Get all tables for this restaurant that are not AVAILABLE
            const tables = await this.tableRepository.find({
                where: {
                    restaurantId,
                    status: Not(TableStatus.AVAILABLE),
                },
            });

            if (tables.length === 0) {
                this.logger.log(`No tables to reset for ${restaurantName}`);
                return;
            }

            this.logger.log(`Found ${tables.length} non-available tables for ${restaurantName}`);

            // Get all active orders (not completed or cancelled) for this restaurant
            const activeOrders = await this.orderRepository.find({
                where: {
                    restaurantId,
                    status: Not(In([OrderStatus.COMPLETED, OrderStatus.CANCELLED])),
                },
                select: ['tableId'],
            });

            // Extract table IDs that have active orders
            const activeTableIds = new Set(
                activeOrders
                    .map(order => order.tableId)
                    .filter(Boolean) // Remove null/undefined
            );

            this.logger.log(`Found ${activeTableIds.size} tables with active orders`);

            // Reset tables that don't have active orders
            let resetCount = 0;
            for (const table of tables) {
                // SAFEGUARD: Don't reset if table has active orders
                if (activeTableIds.has(table.id)) {
                    this.logger.log(`Skipping table ${table.name} - has active orders`);
                    continue;
                }

                // SAFEGUARD: Don't reset MAINTENANCE tables (they need manual intervention)
                if (table.status === TableStatus.MAINTENANCE) {
                    this.logger.log(`Skipping table ${table.name} - in maintenance`);
                    continue;
                }

                // Reset table to AVAILABLE
                table.status = TableStatus.AVAILABLE;
                await this.tableRepository.save(table);
                resetCount++;
                this.logger.log(`Reset table ${table.name} to AVAILABLE`);
            }

            this.logger.log(`Successfully reset ${resetCount} tables for ${restaurantName}`);
        } catch (error) {
            this.logger.error(`Error resetting tables for ${restaurantName}:`, error);
        }
    }

    /**
     * Manual trigger for testing (can be called via API endpoint)
     */
    async manualTableReset(restaurantId: string): Promise<{ message: string; resetCount: number }> {
        this.logger.log(`Manual table reset triggered for restaurant ${restaurantId}`);

        const restaurant = await this.restaurantRepository.findOne({
            where: { id: restaurantId },
        });

        if (!restaurant) {
            throw new Error('Restaurant not found');
        }

        const tablesBefore = await this.tableRepository.count({
            where: {
                restaurantId,
                status: Not(TableStatus.AVAILABLE),
            },
        });

        await this.resetRestaurantTables(restaurantId, restaurant.name);

        const tablesAfter = await this.tableRepository.count({
            where: {
                restaurantId,
                status: Not(TableStatus.AVAILABLE),
            },
        });

        const resetCount = tablesBefore - tablesAfter;

        return {
            message: `Table reset completed for ${restaurant.name}`,
            resetCount,
        };
    }
}
