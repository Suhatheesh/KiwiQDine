import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem, OrderAction } from '../infrastructure/database/entities';
import { OrderStatus as OrderStatusEnum } from '../infrastructure/database/entities/order.entity';
import { OrderActivityLogService } from './order-activity-log.service';
import { CreateOrderStatusDto, UpdateOrderStatusDto } from './dto/order-status.dto';
import { OrderStatusGateway } from './order-status.gateway';
import { OrderAutoCompleteService } from './order-auto-complete.service';
import { SmsNotificationService } from '../shared/services/sms-notification.service';

@Injectable()
export class OrderStatusService {
  private readonly logger = new Logger(OrderStatusService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private orderStatusGateway: OrderStatusGateway,
    private orderAutoCompleteService: OrderAutoCompleteService,
    private smsNotificationService: SmsNotificationService,
    private orderActivityLogService: OrderActivityLogService,
  ) { }

  async createOrderStatus(createOrderStatusDto: CreateOrderStatusDto, userId?: string): Promise<any> {
    const { orderId, status } = createOrderStatusDto;

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order status directly (no separate OrderStatus entity needed)
    order.status = status;
    const savedOrder = await this.orderRepository.save(order);

    // Log action (who changed the order status)
    // Note: status here is likely generic, we'll try to map to OrderAction
    let action = OrderAction.VIEWED;
    if (status === OrderStatusEnum.CONFIRMED) action = OrderAction.CONFIRMED;
    if (status === OrderStatusEnum.PREPARING) action = OrderAction.PREPARING;
    if (status === OrderStatusEnum.READY) action = OrderAction.READY;
    if (status === OrderStatusEnum.SERVED) action = OrderAction.SERVED;
    if (status === OrderStatusEnum.COMPLETED) action = OrderAction.COMPLETED;
    if (status === OrderStatusEnum.CANCELLED) action = OrderAction.CANCELLED;

    await this.orderActivityLogService.logAction(orderId, action, userId, `Status changed to ${status}`);

    // Fetch complete order with all relations for broadcasting
    const fullOrder = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'orderItems',
        'orderItems.menu',
        'orderItems.menu.category',
        'orderItems.orderItemAddons',
        'orderItems.orderItemAddons.addon',
        'customer',
        'restaurant',
      ],
    });

    // Broadcast status update via WebSocket
    await this.orderStatusGateway.broadcastOrderStatusUpdate(orderId, {
      status,
      updatedAt: new Date(),
      order: fullOrder,
    });

    // Broadcast to restaurant room with full order details
    await this.orderStatusGateway.broadcastOrderUpdate(fullOrder);

    // Check if order can be auto-completed (SERVED + PAID → COMPLETED)
    await this.orderAutoCompleteService.checkAndAutoComplete(orderId);

    return { orderId, status, updatedAt: new Date() };
  }

  async updateOrderItemStatus(
    orderItemId: string,
    status: string,
    updatedBy: string,
    additionalPreparationTime?: number,
  ): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id: orderItemId },
      relations: ['order', 'order.restaurant', 'order.customer', 'menu'],
    });

    if (!orderItem) {
      throw new NotFoundException('Order item not found');
    }

    const oldStatus = orderItem.status;
    orderItem.status = status;

    // Handle additional preparation time request
    if (additionalPreparationTime && additionalPreparationTime > 0) {
      orderItem.estimatedPreparationTime = (orderItem.estimatedPreparationTime || 0) + additionalPreparationTime;
      this.logger.log(`Item ${orderItem.menu?.name} (ID: ${orderItemId}) requested additional ${additionalPreparationTime} mins. New total est: ${orderItem.estimatedPreparationTime}`);
    }

    // Set timestamps based on status
    if (status === 'in_progress' && !orderItem.startedAt) {
      orderItem.startedAt = new Date();
    } else if (status === 'ready') {
      orderItem.readyAt = new Date();
    } else if (status === 'served') {
      orderItem.servedAt = new Date();
    }

    const savedOrderItem = await this.orderItemRepository.save(orderItem);

    // Log action based on item status
    let itemAction = OrderAction.VIEWED;
    if (status === 'in_progress') itemAction = OrderAction.PREPARING;
    else if (status === 'ready') itemAction = OrderAction.READY;
    else if (status === 'served') itemAction = OrderAction.SERVED;

    let logMessage = `Item ${orderItem.menu?.name} status changed from ${oldStatus} to ${status}`;
    if (additionalPreparationTime && additionalPreparationTime > 0) {
      logMessage += `. Kitchen requested ${additionalPreparationTime} more minutes.`;
    }

    await this.orderActivityLogService.logAction(
      orderItem.order.id,
      itemAction,
      updatedBy,
      logMessage
    );

    // Fetch complete order with all items to check status
    const order = await this.orderRepository.findOne({
      where: { id: orderItem.order.id },
      relations: [
        'orderItems',
        'orderItems.menu',
        'orderItems.menu.category',
        'orderItems.orderItemAddons',
        'orderItems.orderItemAddons.addon',
        'customer',
        'restaurant',
      ],
    });

    if (order) {
      const allItems = order.orderItems;
      const allServed = allItems.every(item => item.status === 'served');
      const anyInProgress = allItems.some(item => item.status === 'in_progress' || item.status === 'ready' || item.status === 'served');

      let orderStatusChanged = false;
      let newOrderStatus = order.status;

      // Auto-update order status based on item statuses
      if (allServed) {
        // All items served - move to COMPLETED or SERVED based on payment timing
        const targetStatus = order.restaurant?.paymentTiming === 'pay_at_first'
          ? OrderStatusEnum.COMPLETED
          : OrderStatusEnum.SERVED;

        if (order.status !== targetStatus) {
          newOrderStatus = targetStatus;
          orderStatusChanged = true;
        }
      } else if (anyInProgress && (order.status === OrderStatusEnum.CONFIRMED || order.status === OrderStatusEnum.PENDING)) {
        // At least one item in kitchen - move to PREPARING
        newOrderStatus = OrderStatusEnum.PREPARING;
        orderStatusChanged = true;
      }

      if (orderStatusChanged) {
        order.status = newOrderStatus;
        await this.orderRepository.save(order);
        this.logger.log(`Order ${order.orderNumber} status auto-updated to ${newOrderStatus} based on item status changes.`);

        // Send SMS notification if order is ready
        if (newOrderStatus === OrderStatusEnum.READY && order.customer && order.customer.phone) {
          try {
            await this.smsNotificationService.sendOrderReadyNotification(
              order.customer.phone,
              order.customer.name || 'Customer',
              order.orderNumber,
            );
          } catch (error) {
            this.logger.error('Failed to send order ready SMS:', error);
          }
        }
      }

      // ALWAYS broadcast order status update with full order details (even for item-only changes)
      // This ensures customers receive micro-updates for individual item status changes
      await this.orderStatusGateway.broadcastOrderStatusUpdate(order.id, {
        status: order.status,
        updatedAt: new Date(),
        order: order, // Include full order with updated items
        orderItemId: orderItem.id, // THE SPECIFIC ITEM UPDATED
        additionalPreparationTime: additionalPreparationTime && additionalPreparationTime > 0 ? additionalPreparationTime : undefined,
        delayMessage: additionalPreparationTime && additionalPreparationTime > 0
          ? `Kitchen requested ${additionalPreparationTime} extra minutes for ${orderItem.menu?.name}`
          : undefined,
      });

      // Broadcast complete order update
      await this.orderStatusGateway.broadcastOrderUpdate(order);
    }

    return savedOrderItem;
  }

  async getOrderStatusHistory(orderId: string): Promise<any[]> {
    return await this.orderActivityLogService.getOrderLogs(orderId);
  }

  async getActiveOrders(restaurantId?: string, foodCourtId?: string): Promise<Order[]> {
    const whereCondition: any = {
      status: OrderStatusEnum.PENDING,
    };

    if (restaurantId) {
      whereCondition.restaurantId = restaurantId;
    }

    return this.orderRepository.find({
      where: whereCondition,
      relations: ['orderItems', 'orderItems.menu', 'customer', 'restaurant'],
      order: { createdAt: 'ASC' },
    });
  }

  async getOrderById(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
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
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async estimateOrderReadyTime(orderId: string): Promise<Date> {
    const order = await this.getOrderById(orderId);

    let maxPreparationTime = 0;

    for (const orderItem of order.orderItems) {
      // Note: Menu entity doesn't have preparationTime in new structure
      // This would need to be calculated differently or added back
      maxPreparationTime = Math.max(maxPreparationTime, 15); // Default 15 minutes
    }

    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + maxPreparationTime);

    // Note: Order entity doesn't have estimatedReadyTime in new structure
    // await this.orderRepository.update(orderId, { estimatedReadyTime: estimatedTime });

    return estimatedTime;
  }

  async markOrderAsReady(orderId: string, userId: string): Promise<Order> {
    const order = await this.getOrderById(orderId);
    order.status = OrderStatusEnum.READY;
    const savedOrder = await this.orderRepository.save(order);

    await this.orderActivityLogService.logAction(orderId, OrderAction.READY, userId);

    // Broadcast status update via WebSocket
    const fullOrder = await this.getOrderById(orderId);
    await this.orderStatusGateway.broadcastOrderStatusUpdate(orderId, {
      status: OrderStatusEnum.READY,
      updatedAt: new Date(),
      order: fullOrder,
    });
    await this.orderStatusGateway.broadcastOrderUpdate(fullOrder);

    // Check if order can be auto-completed (if payment is already done)
    await this.orderAutoCompleteService.checkAndAutoComplete(orderId);

    return savedOrder;
  }

  async markOrderAsCompleted(orderId: string, userId: string): Promise<Order> {
    const order = await this.getOrderById(orderId);
    order.status = OrderStatusEnum.COMPLETED;
    const savedOrder = await this.orderRepository.save(order);

    await this.orderActivityLogService.logAction(orderId, OrderAction.COMPLETED, userId);

    // Broadcast status update via WebSocket
    const fullOrder = await this.getOrderById(orderId);
    await this.orderStatusGateway.broadcastOrderStatusUpdate(orderId, {
      status: OrderStatusEnum.COMPLETED,
      updatedAt: new Date(),
      order: fullOrder,
    });
    await this.orderStatusGateway.broadcastOrderUpdate(fullOrder);

    return savedOrder;
  }

  async cancelOrder(orderId: string, reason: string, updatedBy: string): Promise<Order> {
    const order = await this.getOrderById(orderId);
    order.status = OrderStatusEnum.CANCELLED;
    const savedOrder = await this.orderRepository.save(order);

    await this.orderActivityLogService.logAction(orderId, OrderAction.CANCELLED, updatedBy, reason);

    // Broadcast cancellation via WebSocket
    const fullOrder = await this.getOrderById(orderId);
    await this.orderStatusGateway.broadcastOrderStatusUpdate(orderId, {
      status: OrderStatusEnum.CANCELLED,
      reason,
      updatedBy,
      updatedAt: new Date(),
      order: fullOrder,
    });
    await this.orderStatusGateway.broadcastOrderUpdate(fullOrder);

    return savedOrder;
  }

  async holdOrder(orderId: string, reason: string, updatedBy: string): Promise<Order> {
    const order = await this.getOrderById(orderId);

    // Check if order can be put on hold
    if (order.status === OrderStatusEnum.COMPLETED || order.status === OrderStatusEnum.CANCELLED) {
      throw new BadRequestException(`Cannot hold order with status: ${order.status}`);
    }

    if (order.isOnHold) {
      throw new BadRequestException('Order is already on hold');
    }

    order.isOnHold = true;
    order.holdReason = reason;
    const savedOrder = await this.orderRepository.save(order);

    await this.orderActivityLogService.logAction(orderId, OrderAction.ON_HOLD, updatedBy, reason);

    // Broadcast hold status update via WebSocket
    const fullOrder = await this.getOrderById(orderId);
    await this.orderStatusGateway.broadcastOrderStatusUpdate(orderId, {
      status: order.status,
      isOnHold: true,
      holdReason: reason,
      updatedBy,
      updatedAt: new Date(),
      order: fullOrder,
    });
    await this.orderStatusGateway.broadcastOrderUpdate(fullOrder);

    return savedOrder;
  }

  async releaseOrder(orderId: string, updatedBy: string): Promise<any> {
    const order = await this.getOrderById(orderId);

    if (!order.isOnHold) {
      throw new BadRequestException('Order is not on hold');
    }

    order.isOnHold = false;
    order.holdReason = null;
    const savedOrder = await this.orderRepository.save(order);

    await this.orderActivityLogService.logAction(orderId, OrderAction.RELEASED, updatedBy);

    // Reload order with all relations for formatted response
    const fullOrder = await this.getOrderById(orderId);

    if (!fullOrder) {
      throw new NotFoundException('Order not found after release');
    }

    // Format order with customer details and order items
    const formattedOrder = this.formatOrderWithCustomerDetails(fullOrder);

    // Broadcast release status update via WebSocket
    await this.orderStatusGateway.broadcastOrderStatusUpdate(orderId, {
      status: order.status,
      isOnHold: false,
      updatedBy,
      updatedAt: new Date(),
      order: fullOrder,
    });
    await this.orderStatusGateway.broadcastOrderUpdate(fullOrder);

    return formattedOrder;
  }

  /**
   * Format order with customer details and order items grouped by category
   */
  private formatOrderWithCustomerDetails(order: Order): any {
    // Get payment method from the most recent payment
    const latestPayment = order.payments && order.payments.length > 0
      ? order.payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null;

    // Group items by category
    const itemsByCategory: Record<string, any[]> = {};

    if (order.orderItems && order.orderItems.length > 0) {
      order.orderItems.forEach((item) => {
        const categoryName = item.menu?.category?.name || 'Uncategorized';
        if (!itemsByCategory[categoryName]) {
          itemsByCategory[categoryName] = [];
        }

        itemsByCategory[categoryName].push({
          id: item.id,
          menuId: item.menuId,
          menuName: item.menu?.name || 'Unknown',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          specialInstructions: item.specialInstructions,
          status: item.status,
          estimatedPreparationTime: item.estimatedPreparationTime,
          originalPreparationTime: item.originalPreparationTime,
          category: categoryName,
        });
      });
    }

    // Convert to array format
    const categoryGroups = Object.keys(itemsByCategory).map(categoryName => ({
      category: categoryName,
      items: itemsByCategory[categoryName],
    }));

    // Calculate overall order progress and timing
    const allItems = order.orderItems || [];
    const totalItems = allItems.length;

    // Calculate remaining time for each item (in mins)
    const itemsWithRemainingTime = allItems.map(item => {
      const elapsed = item.startedAt
        ? Math.floor((new Date().getTime() - new Date(item.startedAt).getTime()) / 1000 / 60)
        : 0;
      const remaining = item.status === 'ready' || item.status === 'served'
        ? 0
        : Math.max(0, (item.estimatedPreparationTime || 0) - elapsed);
      return { ...item, remaining };
    });

    const maxRemainingTime = itemsWithRemainingTime.length > 0
      ? Math.max(...itemsWithRemainingTime.filter(i => i.status !== 'ready' && i.status !== 'served').map(i => i.remaining))
      : 0;

    const estimatedOrderReadyTime = maxRemainingTime > 0
      ? new Date(new Date().getTime() + maxRemainingTime * 60000)
      : null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      tableNo: order.tableNo,
      customerName: order.customer?.name || 'Customer',
      customerPhone: order.customer?.phone || null,
      customer: order.customer
        ? {
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
        }
        : null,
      orderType: order.orderType || null,
      status: order.status,
      isOnHold: order.isOnHold || false,
      holdReason: order.holdReason || null,
      notes: order.notes || null,
      vehicleModel: order.vehicleModel || null,
      vehicleNumber: order.vehicleNumber || null,
      totalAmount: order.totalAmount,
      paymentMethod: latestPayment?.method || null,
      paymentStatus: latestPayment?.status || null,
      restaurant: order.restaurant
        ? {
          id: order.restaurant.id,
          name: order.restaurant.name,
        }
        : null,
      itemsByCategory: categoryGroups,
      itemsProgress: {
        total: totalItems,
        maxRemainingTime: maxRemainingTime === -Infinity ? 0 : maxRemainingTime,
        estimatedOrderReadyTime,
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}