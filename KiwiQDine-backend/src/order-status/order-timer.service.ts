import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Order, OrderItem } from '../infrastructure/database/entities';
import { OrderStatus as OrderStatusEnum } from '../infrastructure/database/entities/order.entity';
import { OrderStatusGateway } from './order-status.gateway';

@Injectable()
export class OrderTimerService {
  private readonly logger = new Logger(OrderTimerService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private orderStatusGateway: OrderStatusGateway,
  ) {}

  /**
   * Broadcast timing updates for active orders every minute
   * This ensures customers see live countdown timers
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async broadcastTimingUpdates() {
    try {
      // Find all active orders that are being prepared
      const activeOrders = await this.orderRepository.find({
        where: {
          status: OrderStatusEnum.PREPARING,
        },
        relations: [
          'orderItems',
          'orderItems.menu',
          'orderItems.menu.category',
          'orderItems.orderItemAddons',
          'orderItems.orderItemAddons.addon',
          'customer',
          'restaurant',
          'table',
          'payments',
          'ratings',
        ],
      });

      this.logger.debug(`Broadcasting timing updates for ${activeOrders.length} active orders`);

      // Broadcast each order update
      for (const order of activeOrders) {
        // Only broadcast if order has items in progress
        const hasActiveItems = order.orderItems?.some(
          item => item.status === 'in_progress' || item.status === 'pending'
        );

        if (hasActiveItems) {
          await this.orderStatusGateway.broadcastOrderUpdate(order);
          this.logger.debug(`Broadcasted timing update for order ${order.orderNumber}`);
        }
      }
    } catch (error) {
      this.logger.error('Error broadcasting timing updates:', error);
    }
  }

  /**
   * Also broadcast for orders in CONFIRMED or READY status
   * (optional - can be enabled if needed)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async broadcastConfirmedOrdersTimingUpdates() {
    try {
      const confirmedOrders = await this.orderRepository.find({
        where: [
          { status: OrderStatusEnum.CONFIRMED },
          { status: OrderStatusEnum.READY },
        ],
        relations: [
          'orderItems',
          'orderItems.menu',
          'orderItems.menu.category',
          'orderItems.orderItemAddons',
          'orderItems.orderItemAddons.addon',
          'customer',
          'restaurant',
          'table',
          'payments',
          'ratings',
        ],
      });

      for (const order of confirmedOrders) {
        const hasActiveItems = order.orderItems?.some(
          item => item.status === 'in_progress' || item.status === 'pending' || item.status === 'ready'
        );

        if (hasActiveItems) {
          await this.orderStatusGateway.broadcastOrderUpdate(order);
          this.logger.debug(`Broadcasted timing update for ${order.status} order ${order.orderNumber}`);
        }
      }
    } catch (error) {
      this.logger.error('Error broadcasting confirmed orders timing updates:', error);
    }
  }
}
