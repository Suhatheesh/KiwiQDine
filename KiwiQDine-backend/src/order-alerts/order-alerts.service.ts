import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Order, OrderItem } from '../infrastructure/database/entities';
import { OrderStatus as OrderStatusEnum } from '../infrastructure/database/entities/order.entity';
import { AlertConfiguration } from './entities/alert-config.entity';
import { OrderAlertsGateway } from './order-alerts.gateway';
import {
    Alert,
    AlertType,
    AlertPriority,
    OrderAlertData,
    AlertConfigDto,
    UpdateAlertConfigDto,
} from './dto/alert.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderAlertsService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OrderAlertsService.name);
    private alertTimers: Map<string, NodeJS.Timeout> = new Map();
    private acknowledgedAlerts: Set<string> = new Set();

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        @InjectRepository(AlertConfiguration)
        private alertConfigRepository: Repository<AlertConfiguration>,
        private orderAlertsGateway: OrderAlertsGateway,
    ) { }

    async onModuleInit() {
        this.logger.log('Order Alerts Service initialized');
        // Start periodic alert checks
        await this.checkAllRestaurantsForAlerts();
    }

    onModuleDestroy() {
        // Clear all timers
        this.alertTimers.forEach((timer) => clearTimeout(timer));
        this.alertTimers.clear();
    }

    /**
     * Get or create alert configuration for a restaurant
     */
    async getAlertConfig(restaurantId: string): Promise<AlertConfiguration> {
        let config = await this.alertConfigRepository.findOne({
            where: { restaurantId },
        });

        if (!config) {
            // Create default configuration
            config = this.alertConfigRepository.create({
                restaurantId,
                pendingOrderReminderInterval: 5,
                waiterConfirmationReminderInterval: 3,
                orderOvertimeThreshold: 30,
                itemOvertimeThreshold: 20,
                enableImmediateAlerts: true,
                enablePendingOrderReminders: true,
                enableWaiterConfirmationReminders: true,
                enableOvertimeAlerts: true,
            });
            config = await this.alertConfigRepository.save(config);
            this.logger.log(`Created default alert config for restaurant ${restaurantId}`);
        }

        return config;
    }

    /**
     * Update alert configuration for a restaurant
     */
    async updateAlertConfig(updateDto: UpdateAlertConfigDto): Promise<AlertConfiguration> {
        const { restaurantId, ...configData } = updateDto;

        let config = await this.getAlertConfig(restaurantId);

        // Update fields
        if (configData.pendingOrderReminderInterval !== undefined) {
            config.pendingOrderReminderInterval = configData.pendingOrderReminderInterval;
        }
        if (configData.waiterConfirmationReminderInterval !== undefined) {
            config.waiterConfirmationReminderInterval = configData.waiterConfirmationReminderInterval;
        }
        if (configData.orderOvertimeThreshold !== undefined) {
            config.orderOvertimeThreshold = configData.orderOvertimeThreshold;
        }
        if (configData.itemOvertimeThreshold !== undefined) {
            config.itemOvertimeThreshold = configData.itemOvertimeThreshold;
        }
        if (configData.enableImmediateAlerts !== undefined) {
            config.enableImmediateAlerts = configData.enableImmediateAlerts;
        }

        return await this.alertConfigRepository.save(config);
    }

    /**
     * Send immediate alert for new order
     */
    async sendNewOrderAlert(order: Order) {
        const config = await this.getAlertConfig(order.restaurantId);

        if (!config.enableImmediateAlerts) {
            return;
        }

        const orderData = this.formatOrderData(order);
        const alert: Alert = {
            id: uuidv4(),
            type: AlertType.NEW_ORDER,
            priority: AlertPriority.HIGH,
            title: '🔔 New Order Received',
            message: `New ${orderData.orderType} order #${orderData.orderNumber} from ${orderData.customerName}`,
            orderData,
            timestamp: new Date(),
            acknowledged: false,
        };

        await this.orderAlertsGateway.broadcastAlert(order.restaurantId, alert);
        this.logger.log(`Sent immediate alert for new order ${order.orderNumber}`);
    }

    /**
     * Periodic check for all restaurants (runs every minute)
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async checkAllRestaurantsForAlerts() {
        try {
            // Get all unique restaurant IDs with active orders
            const activeOrders = await this.orderRepository.find({
                where: {
                    status: In([
                        OrderStatusEnum.PENDING,
                        OrderStatusEnum.CONFIRMED,
                        OrderStatusEnum.PREPARING,
                        OrderStatusEnum.READY,
                    ]),
                },
                relations: ['restaurant', 'customer', 'orderItems', 'orderItems.menu'],
            });

            const restaurantIds = [...new Set(activeOrders.map((o) => o.restaurantId))];

            for (const restaurantId of restaurantIds) {
                await this.checkRestaurantAlerts(restaurantId);
            }
        } catch (error) {
            this.logger.error('Error in periodic alert check:', error);
        }
    }

    /**
   * Check alerts for a specific restaurant
   */
    async checkRestaurantAlerts(restaurantId: string) {
        const config = await this.getAlertConfig(restaurantId);
        const alerts: Alert[] = [];

        // Get active orders for this restaurant
        const orders = await this.orderRepository.find({
            where: {
                restaurantId,
                status: In([
                    OrderStatusEnum.PENDING,
                    OrderStatusEnum.CONFIRMED,
                    OrderStatusEnum.PREPARING,
                    OrderStatusEnum.READY,
                ]),
            },
            relations: ['customer', 'orderItems', 'orderItems.menu', 'restaurant'],
            order: { createdAt: 'ASC' },
        });

        const now = new Date();

        // Group orders by alert type for batch processing
        const pendingConfirmationOrders: Order[] = [];
        const waiterConfirmationOrders: Order[] = [];
        const overtimeOrders: Order[] = [];

        for (const order of orders) {
            const waitingMinutes = Math.floor((now.getTime() - order.createdAt.getTime()) / 1000 / 60);

            // 1. Collect pending confirmation orders (PENDING status, staff-created)
            if (
                config.enablePendingOrderReminders &&
                order.status === OrderStatusEnum.PENDING &&
                order.createdByType === 'staff'
            ) {
                if (this.shouldSendReminder(order.id, waitingMinutes, config.pendingOrderReminderInterval)) {
                    pendingConfirmationOrders.push(order);
                }
            }

            // 2. Collect waiter confirmation needed orders (PENDING status, customer-created)
            // CRITICAL RULES:
            // - Parking orders: NEVER need waiter confirmation alerts
            // - Takeaway orders: NEVER need waiter confirmation alerts
            // - Pay-first dine-in: NEVER need waiter confirmation alerts (auto-confirm after payment)
            // - Pay-last dine-in: ONLY case where requireWaiterConfirmation matters
            if (
                config.enableWaiterConfirmationReminders &&
                order.status === OrderStatusEnum.PENDING &&
                order.createdByType === 'customer' &&
                order.orderType !== 'parking' &&
                order.orderType !== 'takeaway' &&
                order.restaurant?.paymentTiming === 'pay_at_last' &&
                order.restaurant?.requireWaiterConfirmation
            ) {
                if (this.shouldSendReminder(order.id, waitingMinutes, config.waiterConfirmationReminderInterval)) {
                    waiterConfirmationOrders.push(order);
                }
            }

            // 3. Collect CONFIRMED orders not yet preparing (kitchen hasn't started)
            // These are orders that have been accepted but kitchen hasn't begun work
            if (
                config.enablePendingOrderReminders &&
                order.status === OrderStatusEnum.CONFIRMED
            ) {
                if (this.shouldSendReminder(order.id, waitingMinutes, config.pendingOrderReminderInterval)) {
                    pendingConfirmationOrders.push(order);
                }
            }

            // 4. Collect PREPARING orders (kitchen is working but not done yet)
            // These are orders being cooked - remind if taking too long
            if (
                config.enablePendingOrderReminders &&
                order.status === OrderStatusEnum.PREPARING
            ) {
                if (this.shouldSendReminder(order.id, waitingMinutes, config.pendingOrderReminderInterval)) {
                    pendingConfirmationOrders.push(order);
                }
            }

            // 5. Collect overtime orders (any order taking too long, not yet READY)
            if (
                config.enableOvertimeAlerts &&
                waitingMinutes >= config.orderOvertimeThreshold &&
                order.status !== OrderStatusEnum.READY
            ) {
                if (this.shouldSendReminder(order.id, waitingMinutes, 10)) {
                    overtimeOrders.push(order);
                }
            }

            // 4. Check for item overtime alerts (individual)
            if (config.enableOvertimeAlerts && order.orderItems) {
                for (const item of order.orderItems) {
                    if (item.status === 'in_progress' && item.startedAt) {
                        const itemWaitingMinutes = Math.floor(
                            (now.getTime() - new Date(item.startedAt).getTime()) / 1000 / 60,
                        );

                        if (itemWaitingMinutes >= config.itemOvertimeThreshold) {
                            if (this.shouldSendReminder(`${order.id}_${item.id}`, itemWaitingMinutes, 10)) {
                                alerts.push(
                                    this.createItemOvertimeAlert(order, item, itemWaitingMinutes, config.itemOvertimeThreshold),
                                );
                            }
                        }
                    }
                }
            }
        }

        // Create grouped alerts for multiple orders
        if (pendingConfirmationOrders.length > 0) {
            if (pendingConfirmationOrders.length === 1) {
                const order = pendingConfirmationOrders[0];
                const waitingMinutes = Math.floor((now.getTime() - order.createdAt.getTime()) / 1000 / 60);
                alerts.push(this.createPendingConfirmationAlert(order, waitingMinutes));
            } else {
                alerts.push(this.createGroupedPendingConfirmationAlert(pendingConfirmationOrders));
            }
        }

        if (waiterConfirmationOrders.length > 0) {
            if (waiterConfirmationOrders.length === 1) {
                const order = waiterConfirmationOrders[0];
                const waitingMinutes = Math.floor((now.getTime() - order.createdAt.getTime()) / 1000 / 60);
                alerts.push(this.createWaiterConfirmationAlert(order, waitingMinutes));
            } else {
                alerts.push(this.createGroupedWaiterConfirmationAlert(waiterConfirmationOrders));
            }
        }

        if (overtimeOrders.length > 0) {
            if (overtimeOrders.length === 1) {
                const order = overtimeOrders[0];
                const waitingMinutes = Math.floor((now.getTime() - order.createdAt.getTime()) / 1000 / 60);
                alerts.push(this.createOrderOvertimeAlert(order, waitingMinutes, config.orderOvertimeThreshold));
            } else {
                alerts.push(this.createGroupedOvertimeAlert(overtimeOrders, config.orderOvertimeThreshold));
            }
        }

        // Broadcast all alerts for this restaurant
        if (alerts.length > 0) {
            await this.orderAlertsGateway.broadcastAlerts(restaurantId, alerts);
            this.logger.log(`Sent ${alerts.length} alerts for restaurant ${restaurantId}`);
        }
    }

    /**
     * Determine if a reminder should be sent based on interval
     */
    private shouldSendReminder(orderId: string, waitingMinutes: number, intervalMinutes: number): boolean {
        // Don't send if waiting time is 0
        if (waitingMinutes <= 0) {
            return false;
        }

        // Generate a unique key for this alert based on order ID and the interval bucket
        // This prevents sending the same alert multiple times within the same interval
        const intervalBucket = Math.floor(waitingMinutes / intervalMinutes);
        const alertKey = `${orderId}_${intervalBucket}`;

        // Check if we've already sent an alert for this interval bucket
        if (this.acknowledgedAlerts.has(alertKey)) {
            return false; // Already sent for this interval
        }

        // Send reminder if waiting time has reached or passed a multiple of the interval
        // This means: send at 5, 10, 15, 20, 25, 30... (for 5-minute interval)
        // The intervalBucket check ensures we only send once per interval period
        const shouldSend = waitingMinutes >= intervalMinutes && intervalBucket > 0;

        if (shouldSend) {
            // Mark this alert as sent for this interval
            this.acknowledgedAlerts.add(alertKey);

            // Clean up old alert keys (keep only last 100 to prevent memory leak)
            if (this.acknowledgedAlerts.size > 100) {
                const keysArray = Array.from(this.acknowledgedAlerts);
                keysArray.slice(0, 50).forEach(key => this.acknowledgedAlerts.delete(key));
            }

            this.logger.log(`Sending alert for order ${orderId} - waiting ${waitingMinutes} min (interval: ${intervalMinutes}, bucket: ${intervalBucket})`);
        }

        return shouldSend;
    }

    /**
     * Create pending confirmation alert
     */
    private createPendingConfirmationAlert(order: Order, waitingMinutes: number): Alert {
        const orderData = this.formatOrderData(order);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30000); // 30 seconds

        // Customize message based on order status
        let title = '⏰ Order Waiting for Confirmation';
        let message = `Order #${orderData.orderNumber} has been waiting for ${waitingMinutes} minutes. Please confirm to send to kitchen.`;

        if (order.status === OrderStatusEnum.CONFIRMED) {
            title = '👨‍🍳 Order Waiting to be Prepared';
            message = `Order #${orderData.orderNumber} has been confirmed for ${waitingMinutes} minutes. Please start preparing.`;
        } else if (order.status === OrderStatusEnum.PREPARING) {
            title = '🔥 Order Being Prepared';
            message = `Order #${orderData.orderNumber} has been preparing for ${waitingMinutes} minutes. Please expedite if possible.`;
        }

        return {
            id: `pending_${order.id}_${Date.now()}`,
            type: AlertType.PENDING_CONFIRMATION,
            priority: waitingMinutes >= 10 ? AlertPriority.URGENT : AlertPriority.HIGH,
            title,
            message,
            orderData: { ...orderData, waitingTime: waitingMinutes },
            timestamp: now,
            acknowledged: false,
            countdownSeconds: 30,
            expiresAt,
            actions: [
                {
                    id: `confirm_${order.id}`,
                    label: order.status === OrderStatusEnum.PENDING ? 'Accept Order' : 'View Order',
                    type: order.status === OrderStatusEnum.PENDING ? 'confirm' : 'view',
                    orderId: order.id,
                    endpoint: order.status === OrderStatusEnum.PENDING
                        ? `/api/order-management/${order.id}/confirm`
                        : `/api/order-management/${order.id}`,
                    method: order.status === OrderStatusEnum.PENDING ? 'PATCH' : 'GET',
                    requiresConfirmation: false,
                },
                {
                    id: `view_${order.id}`,
                    label: 'View Details',
                    type: 'view',
                    orderId: order.id,
                    endpoint: `/api/order-management/${order.id}`,
                    method: 'GET',
                    requiresConfirmation: false,
                },
            ],
        };
    }

    /**
     * Create waiter confirmation alert
     */
    private createWaiterConfirmationAlert(order: Order, waitingMinutes: number): Alert {
        const orderData = this.formatOrderData(order);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30000);

        return {
            id: `waiter_${order.id}_${Date.now()}`,
            type: AlertType.WAITER_CONFIRMATION_NEEDED,
            priority: waitingMinutes >= 5 ? AlertPriority.URGENT : AlertPriority.HIGH,
            title: '👨‍🍳 Waiter Confirmation Required',
            message: `Customer order #${orderData.orderNumber} needs waiter verification (waiting ${waitingMinutes} min). Please check and confirm.`,
            orderData: { ...orderData, waitingTime: waitingMinutes },
            timestamp: now,
            acknowledged: false,
            countdownSeconds: 30,
            expiresAt,
            actions: [
                {
                    id: `confirm_${order.id}`,
                    label: 'Accept Order',
                    type: 'confirm',
                    orderId: order.id,
                    endpoint: `/api/order-management/${order.id}/confirm`,
                    method: 'PATCH',
                    requiresConfirmation: false,
                },
                {
                    id: `view_${order.id}`,
                    label: 'View Details',
                    type: 'view',
                    orderId: order.id,
                    endpoint: `/api/order-management/${order.id}`,
                    method: 'GET',
                    requiresConfirmation: false,
                },
            ],
        };
    }

    /**
     * Create order overtime alert
     */
    private createOrderOvertimeAlert(order: Order, waitingMinutes: number, threshold: number): Alert {
        const orderData = this.formatOrderData(order);
        const overtimeMinutes = waitingMinutes - threshold;

        return {
            id: `overtime_${order.id}_${Date.now()}`,
            type: AlertType.ORDER_OVERTIME,
            priority: AlertPriority.URGENT,
            title: '🚨 Order Taking Too Long',
            message: `Order #${orderData.orderNumber} is ${overtimeMinutes} min over expected time (${waitingMinutes} min total). Please expedite!`,
            orderData: { ...orderData, waitingTime: waitingMinutes },
            timestamp: new Date(),
            acknowledged: false,
        };
    }

    /**
     * Create item overtime alert
     */
    private createItemOvertimeAlert(
        order: Order,
        item: OrderItem,
        itemWaitingMinutes: number,
        threshold: number,
    ): Alert {
        const orderData = this.formatOrderData(order);
        const overtimeMinutes = itemWaitingMinutes - threshold;

        return {
            id: `item_overtime_${item.id}_${Date.now()}`,
            type: AlertType.ITEM_OVERTIME,
            priority: AlertPriority.URGENT,
            title: '⚠️ Item Taking Too Long',
            message: `${item.menu?.name || 'Item'} in order #${orderData.orderNumber} is ${overtimeMinutes} min overtime (${itemWaitingMinutes} min in kitchen). Speed up!`,
            orderData: {
                ...orderData,
                waitingTime: itemWaitingMinutes,
                items: [
                    {
                        id: item.id,
                        menuName: item.menu?.name || 'Unknown',
                        quantity: item.quantity,
                        status: item.status,
                        waitingTime: itemWaitingMinutes,
                    },
                ],
            },
            timestamp: new Date(),
            acknowledged: false,
        };
    }

    /**
     * Format order data for alerts
     */
    private formatOrderData(order: Order): OrderAlertData {
        const now = new Date();
        const waitingMinutes = Math.floor((now.getTime() - order.createdAt.getTime()) / 1000 / 60);

        return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            customerName: order.customer?.name || 'Customer',
            tableNo: order.tableNo || undefined,
            orderType: order.orderType || 'dine_in',
            status: order.status,
            totalAmount: order.totalAmount,
            waitingTime: waitingMinutes,
            createdAt: order.createdAt,
            items: order.orderItems?.map((item) => ({
                id: item.id,
                menuName: item.menu?.name || 'Unknown',
                quantity: item.quantity,
                status: item.status,
                waitingTime: item.startedAt
                    ? Math.floor((now.getTime() - new Date(item.startedAt).getTime()) / 1000 / 60)
                    : undefined,
            })),
        };
    }

    /**
     * Create grouped pending confirmation alert (multiple orders)
     */
    private createGroupedPendingConfirmationAlert(orders: Order[]): Alert {
        const now = new Date();
        const ordersData = orders.map(order => this.formatOrderData(order));
        const oldestOrder = orders[0]; // Orders are sorted by createdAt ASC
        const oldestWaitingTime = Math.floor((now.getTime() - oldestOrder.createdAt.getTime()) / 1000 / 60);

        // Calculate countdown (30 seconds from now)
        const expiresAt = new Date(now.getTime() + 30000); // 30 seconds

        return {
            id: `pending_group_${Date.now()}`,
            type: AlertType.PENDING_CONFIRMATION,
            priority: oldestWaitingTime >= 10 ? AlertPriority.URGENT : AlertPriority.HIGH,
            title: `⏰ ${orders.length} Orders Waiting for Confirmation`,
            message: `You have ${orders.length} pending orders. Oldest has been waiting ${oldestWaitingTime} minutes. Please confirm to send to kitchen.`,
            orderData: ordersData[0], // Primary order for compatibility
            orders: ordersData, // All orders in array
            orderCount: orders.length,
            timestamp: now,
            acknowledged: false,
            countdownSeconds: 30,
            expiresAt,
            actions: [
                {
                    id: 'confirm_all',
                    label: 'Confirm All Orders',
                    type: 'confirm',
                    endpoint: '/api/order-management/bulk-confirm',
                    method: 'POST',
                    requiresConfirmation: false,
                },
                ...orders.map(order => ({
                    id: `confirm_${order.id}`,
                    label: `Accept #${order.orderNumber}`,
                    type: 'confirm' as const,
                    orderId: order.id,
                    endpoint: `/api/order-management/${order.id}/confirm`,
                    method: 'PATCH' as const,
                    requiresConfirmation: false,
                })),
            ],
        };
    }

    /**
     * Create grouped waiter confirmation alert (multiple orders)
     */
    private createGroupedWaiterConfirmationAlert(orders: Order[]): Alert {
        const now = new Date();
        const ordersData = orders.map(order => this.formatOrderData(order));
        const oldestOrder = orders[0];
        const oldestWaitingTime = Math.floor((now.getTime() - oldestOrder.createdAt.getTime()) / 1000 / 60);

        // Calculate countdown (30 seconds from now)
        const expiresAt = new Date(now.getTime() + 30000);

        return {
            id: `waiter_group_${Date.now()}`,
            type: AlertType.WAITER_CONFIRMATION_NEEDED,
            priority: oldestWaitingTime >= 5 ? AlertPriority.URGENT : AlertPriority.HIGH,
            title: `👨‍🍳 ${orders.length} Customer Orders Need Verification`,
            message: `${orders.length} customer orders waiting for waiter confirmation. Oldest: ${oldestWaitingTime} min. Please verify and confirm.`,
            orderData: ordersData[0],
            orders: ordersData,
            orderCount: orders.length,
            timestamp: now,
            acknowledged: false,
            countdownSeconds: 30,
            expiresAt,
            actions: [
                {
                    id: 'verify_all',
                    label: 'Verify & Confirm All',
                    type: 'confirm',
                    endpoint: '/api/order-management/bulk-confirm',
                    method: 'POST',
                    requiresConfirmation: false,
                },
                ...orders.map(order => ({
                    id: `verify_${order.id}`,
                    label: `Accept #${order.orderNumber}`,
                    type: 'confirm' as const,
                    orderId: order.id,
                    endpoint: `/api/order-management/${order.id}/confirm`,
                    method: 'PATCH' as const,
                    requiresConfirmation: false,
                })),
            ],
        };
    }

    /**
     * Create grouped overtime alert (multiple orders)
     */
    private createGroupedOvertimeAlert(orders: Order[], threshold: number): Alert {
        const now = new Date();
        const ordersData = orders.map(order => this.formatOrderData(order));
        const oldestOrder = orders[0];
        const oldestWaitingTime = Math.floor((now.getTime() - oldestOrder.createdAt.getTime()) / 1000 / 60);
        const oldestOvertime = oldestWaitingTime - threshold;

        // Calculate countdown (30 seconds from now)
        const expiresAt = new Date(now.getTime() + 30000);

        return {
            id: `overtime_group_${Date.now()}`,
            type: AlertType.ORDER_OVERTIME,
            priority: AlertPriority.URGENT,
            title: `🚨 ${orders.length} Orders Taking Too Long`,
            message: `${orders.length} orders are overtime! Oldest is ${oldestOvertime} min over (${oldestWaitingTime} min total). Please expedite!`,
            orderData: ordersData[0],
            orders: ordersData,
            orderCount: orders.length,
            timestamp: now,
            acknowledged: false,
            countdownSeconds: 30,
            expiresAt,
            actions: orders.map(order => ({
                id: `view_${order.id}`,
                label: `View #${order.orderNumber}`,
                type: 'view' as const,
                orderId: order.id,
                endpoint: `/api/order-management/${order.id}`,
                method: 'GET' as const,
                requiresConfirmation: false,
            })),
        };
    }

    /**
     * Manually trigger alert check for a restaurant (for testing or immediate check)
     */
    async triggerAlertCheck(restaurantId: string) {
        await this.checkRestaurantAlerts(restaurantId);
    }

    /**
     * Clear alert tracking for an order (call when order is confirmed/accepted)
     */
    clearOrderAlerts(orderId: string) {
        // Remove all alert keys for this order
        const keysToDelete = Array.from(this.acknowledgedAlerts).filter(key => key.startsWith(orderId));
        keysToDelete.forEach(key => this.acknowledgedAlerts.delete(key));

        this.logger.log(`Cleared ${keysToDelete.length} alert tracking entries for order ${orderId}`);
    }
}
