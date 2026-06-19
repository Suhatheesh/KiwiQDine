import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderItem, Restaurant, Menu } from '../infrastructure/database/entities';
import { OrderStatus as OrderStatusEnum } from '../infrastructure/database/entities/order.entity';
import { OrderStatusService } from '../order-status/order-status.service';

@Injectable()
export class KitchenDisplayService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    private orderStatusService: OrderStatusService,
  ) {}

  async getKitchenOrders(
    restaurantId?: string,
    vendorId?: string,
    status?: string,
  ): Promise<Order[]> {
    const whereCondition: any = {};

    if (restaurantId) {
      whereCondition.restaurantId = restaurantId;
    }

    // If specific status requested, filter by that status
    if (status) {
      whereCondition.status = status;
      return this.orderRepository.find({
        where: whereCondition,
        relations: ['orderItems', 'orderItems.menu', 'customer', 'restaurant'],
        order: { createdAt: 'ASC' },
      });
    }

    // Default: Get all active kitchen orders (PENDING, CONFIRMED, PREPARING, READY)
    // These are orders that need kitchen attention or are being prepared
    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.menu', 'menu')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatusEnum.PENDING,
          OrderStatusEnum.CONFIRMED,
          OrderStatusEnum.PREPARING,
          OrderStatusEnum.READY,
        ],
      })
      .andWhere('order.isOnHold = :isOnHold', { isOnHold: false })
      .andWhere(restaurantId ? 'order.restaurantId = :restaurantId' : '1=1', {
        restaurantId,
      })
      .orderBy('order.createdAt', 'ASC')
      .getMany();
  }

  async getOrderItems(
    restaurantId?: string,
    vendorId?: string,
    status?: string,
  ): Promise<OrderItem[]> {
    const query = this.orderItemRepository
      .createQueryBuilder('orderItem')
      .leftJoinAndSelect('orderItem.order', 'order')
      .leftJoinAndSelect('orderItem.menu', 'menu')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.status IN (:...statuses)', { 
        statuses: [
          OrderStatusEnum.PENDING, 
          OrderStatusEnum.CONFIRMED, 
          OrderStatusEnum.PREPARING,
          OrderStatusEnum.READY
        ] 
      })
      .andWhere('order.isOnHold = :isOnHold', { isOnHold: false });

    if (restaurantId) {
      query.andWhere('order.restaurantId = :restaurantId', { restaurantId });
    }

    if (status) {
      query.andWhere('orderItem.status = :status', { status });
    }

    return query
      .orderBy('order.createdAt', 'ASC')
      .addOrderBy('orderItem.createdAt', 'ASC')
      .getMany();
  }

  async startOrderItem(orderItemId: string, userId: string): Promise<OrderItem> {
    return this.orderStatusService.updateOrderItemStatus(orderItemId, 'in_progress', userId);
  }

  async markOrderItemReady(orderItemId: string, userId: string): Promise<OrderItem> {
    return this.orderStatusService.updateOrderItemStatus(orderItemId, 'ready', userId);
  }

  async extendOrderItemTime(
    orderItemId: string,
    additionalMinutes: number,
    userId: string,
  ): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id: orderItemId },
      relations: ['menu'],
    });

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    // Note: Menu doesn't have preparationTime in new structure
    // Log extension for now
    console.log(`Extended preparation time for order item ${orderItemId} by ${additionalMinutes} minutes`);

    return orderItem;
  }

  async getKitchenStatistics(
    restaurantId?: string,
    vendorId?: string,
    date?: string,
  ): Promise<any> {
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    const whereCondition: any = {
      createdAt: Between(startDate, endDate),
    };

    if (restaurantId) {
      whereCondition.restaurantId = restaurantId;
    }

    const orders = await this.orderRepository.find({
      where: whereCondition,
      relations: ['orderItems'],
    });

    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => sum + order.orderItems.length, 0);
    
    const completedOrders = orders.filter(order => 
      order.status === OrderStatusEnum.COMPLETED
    ).length;

    const pendingOrders = orders.filter(order => 
      order.status === OrderStatusEnum.PENDING
    ).length;

    const inProgressOrders = orders.filter(order => 
      order.status === OrderStatusEnum.PREPARING
    ).length;

    const readyOrders = orders.filter(order => 
      order.status === OrderStatusEnum.READY
    ).length;

    return {
      totalOrders,
      totalItems,
      completedOrders,
      pendingOrders,
      inProgressOrders,
      readyOrders,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
    };
  }
}