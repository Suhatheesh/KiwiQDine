import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, Payment } from '../infrastructure/database/entities';
import { OrderStatus } from '../infrastructure/database/entities/order.entity';
import { PaymentStatus } from '../infrastructure/database/entities/payment.entity';

@Injectable()
export class OrderAutoCompleteService {
    private readonly logger = new Logger(OrderAutoCompleteService.name);

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
    ) { }

    /**
     * Automatically mark order as COMPLETED if:
     * 1. Order status is SERVED
     * 2. Payment status is PAID
     * 
     * This works for both:
     * - Pay First: Order goes PENDING → CONFIRMED → PREPARING → READY → SERVED → COMPLETED (when paid)
     * - Pay Last: Order goes PENDING → CONFIRMED → PREPARING → READY → SERVED → COMPLETED (when paid)
     */
    async autoCompleteOrder(orderId: string): Promise<boolean> {
        try {
            // Get order with payments
            const order = await this.orderRepository.findOne({
                where: { id: orderId },
                relations: ['payments'],
            });

            if (!order) {
                this.logger.warn(`Order ${orderId} not found`);
                return false;
            }

            // Check if order is already completed or cancelled
            if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
                this.logger.log(`Order ${order.orderNumber} is already ${order.status}, skipping auto-complete`);
                return false;
            }

            // Check if order is SERVED
            if (order.status !== OrderStatus.SERVED) {
                this.logger.log(`Order ${order.orderNumber} is ${order.status}, not SERVED yet, skipping auto-complete`);
                return false;
            }

            // Check if payment is PAID
            const hasPaidPayment = order.payments?.some(
                payment => payment.status === PaymentStatus.PAID
            );

            if (!hasPaidPayment) {
                this.logger.log(`Order ${order.orderNumber} is SERVED but not PAID yet, skipping auto-complete`);
                return false;
            }

            // All conditions met: SERVED + PAID → COMPLETED
            order.status = OrderStatus.COMPLETED;
            await this.orderRepository.save(order);

            this.logger.log(`✅ Order ${order.orderNumber} auto-completed (SERVED + PAID → COMPLETED)`);
            return true;
        } catch (error) {
            this.logger.error(`Error auto-completing order ${orderId}:`, error);
            return false;
        }
    }

    /**
     * Check and auto-complete order after status update
     * Call this after updating order status to SERVED
     */
    async checkAndAutoComplete(orderId: string): Promise<void> {
        await this.autoCompleteOrder(orderId);
    }

    /**
     * Check and auto-complete order after payment
     * Call this after marking payment as PAID
     */
    async checkAndAutoCompleteAfterPayment(orderId: string): Promise<void> {
        await this.autoCompleteOrder(orderId);
    }

    /**
     * Bulk auto-complete all eligible orders
     * Useful for fixing existing orders or running as a scheduled task
     */
    async bulkAutoComplete(): Promise<{ completed: number; orders: string[] }> {
        try {
            // Find all SERVED orders with PAID payments
            const servedOrders = await this.orderRepository.find({
                where: {
                    status: OrderStatus.SERVED,
                },
                relations: ['payments'],
            });

            this.logger.log(`Found ${servedOrders.length} SERVED orders to check`);

            const completedOrders: string[] = [];

            for (const order of servedOrders) {
                const hasPaidPayment = order.payments?.some(
                    payment => payment.status === PaymentStatus.PAID
                );

                if (hasPaidPayment) {
                    order.status = OrderStatus.COMPLETED;
                    await this.orderRepository.save(order);
                    completedOrders.push(order.orderNumber || order.id);
                    this.logger.log(`✅ Bulk auto-completed order ${order.orderNumber}`);
                }
            }

            this.logger.log(`Bulk auto-complete finished: ${completedOrders.length} orders completed`);

            return {
                completed: completedOrders.length,
                orders: completedOrders,
            };
        } catch (error) {
            this.logger.error('Error in bulk auto-complete:', error);
            return { completed: 0, orders: [] };
        }
    }
}
