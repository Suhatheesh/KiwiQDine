import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../infrastructure/database/entities';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/order-status',
  transports: ['websocket', 'polling'],
})
export class OrderStatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private orderSubscriptions = new Map<string, Set<string>>(); // orderId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Remove user from connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }

    // Remove client from all order subscriptions
    for (const [orderId, socketIds] of this.orderSubscriptions.entries()) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.orderSubscriptions.delete(orderId);
      }
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Verify JWT token
      const payload = this.jwtService.verify(data.token, {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (user) {
        this.connectedUsers.set(user.id, client.id);
        client.emit('authenticated', { userId: user.id, role: user.role });
        console.log(`User ${user.id} authenticated on socket ${client.id}`);
      } else {
        client.emit('authentication_failed', { message: 'Invalid token' });
        client.disconnect();
      }
    } catch (error) {
      client.emit('authentication_failed', { message: 'Authentication error' });
      client.disconnect();
    }
  }

  @SubscribeMessage('subscribe_order')
  async handleSubscribeOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const orderId = data.orderId;

    // Add client to order subscription
    if (!this.orderSubscriptions.has(orderId)) {
      this.orderSubscriptions.set(orderId, new Set());
    }
    this.orderSubscriptions.get(orderId)!.add(client.id);

    client.emit('subscribed_to_order', { orderId });
    console.log(`Client ${client.id} subscribed to order ${orderId}`);
  }

  @SubscribeMessage('unsubscribe_order')
  async handleUnsubscribeOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const orderId = data.orderId;

    // Remove client from order subscription
    const socketIds = this.orderSubscriptions.get(orderId);
    if (socketIds) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.orderSubscriptions.delete(orderId);
      }
    }

    client.emit('unsubscribed_from_order', { orderId });
    console.log(`Client ${client.id} unsubscribed from order ${orderId}`);
  }

  @SubscribeMessage('subscribe_restaurant_orders')
  async handleSubscribeRestaurantOrders(
    @MessageBody() data: { restaurantId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const restaurantId = data.restaurantId;
    const room = `restaurant_${restaurantId}`;

    // Join restaurant room
    client.join(room);

    console.log(`[WebSocket] Restaurant subscription:`);
    console.log(`  - Socket ID: ${client.id}`);
    console.log(`  - Restaurant ID: ${restaurantId}`);
    console.log(`  - Room: ${room}`);

    // Get all clients in this room
    const clientsInRoom = await this.server.in(room).allSockets();
    console.log(`  - Total clients in room: ${clientsInRoom.size}`);

    client.emit('subscribed_to_restaurant', { restaurantId });
    console.log(`  - Subscription confirmed`);
  }

  @SubscribeMessage('subscribe_food_court_orders')
  async handleSubscribeFoodCourtOrders(
    @MessageBody() data: { foodCourtId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const foodCourtId = data.foodCourtId;

    // Join food court room
    client.join(`food_court_${foodCourtId}`);
    client.emit('subscribed_to_food_court', { foodCourtId });
    console.log(`Client ${client.id} subscribed to food court ${foodCourtId} orders`);
  }

  @SubscribeMessage('subscribe_customer_order')
  async handleSubscribeCustomerOrder(
    @MessageBody() data: { orderId: string; customerId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { orderId, customerId } = data;

    console.log(`[WebSocket] Customer subscribing to order:`);
    console.log(`  - Socket ID: ${client.id}`);
    console.log(`  - Order ID: ${orderId}`);
    console.log(`  - Customer ID: ${customerId || 'not provided'}`);

    // Add client to order subscription - client will ONLY receive updates for THIS specific order
    if (!this.orderSubscriptions.has(orderId)) {
      this.orderSubscriptions.set(orderId, new Set());
    }
    this.orderSubscriptions.get(orderId)!.add(client.id);

    // Note: We do NOT join customer room to avoid receiving ALL customer orders
    // Client will ONLY receive updates for the specific order they subscribed to

    client.emit('subscribed_to_customer_order', { orderId, customerId });
    console.log(`[WebSocket] Customer client ${client.id} successfully subscribed to order ${orderId}`);
    console.log(`[WebSocket] Client will ONLY receive updates for this specific order (not all customer orders)`);
    console.log(`[WebSocket] Total subscriptions for order ${orderId}: ${this.orderSubscriptions.get(orderId)!.size}`);
  }

  @SubscribeMessage('unsubscribe_customer_order')
  async handleUnsubscribeCustomerOrder(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const orderId = data.orderId;

    // Remove client from order subscription
    const socketIds = this.orderSubscriptions.get(orderId);
    if (socketIds) {
      socketIds.delete(client.id);
      if (socketIds.size === 0) {
        this.orderSubscriptions.delete(orderId);
      }
    }

    client.emit('unsubscribed_from_customer_order', { orderId });
    console.log(`Customer client ${client.id} unsubscribed from order ${orderId}`);
  }

  // Method to broadcast order status updates
  async broadcastOrderStatusUpdate(orderId: string, statusUpdate: any) {
    // If order is present in statusUpdate, format it
    if (statusUpdate.order) {
      statusUpdate.order = this.formatOrderForBroadcast(statusUpdate.order);
    }

    // Extract customerId from multiple possible locations
    const customerId = statusUpdate.customerId
      || statusUpdate.order?.customerId
      || statusUpdate.order?.customer?.id;

    console.log(`[WebSocket] Broadcasting order_status_update for order ${orderId}`);
    console.log(`[WebSocket] Customer ID extracted: ${customerId || 'NOT FOUND'}`);
    console.log(`[WebSocket] Status: ${statusUpdate.status}`);

    // Broadcast ONLY to specific subscribed clients (order-specific tracking)
    // NO customer room broadcasting - clients must explicitly subscribe to each order
    // NO global broadcasting - only send to clients who subscribed to THIS specific order
    const socketIds = this.orderSubscriptions.get(orderId);
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit('order_status_update', {
          orderId,
          ...statusUpdate,
        });
      });
      console.log(`[WebSocket] ✅ Sent order_status_update to ${socketIds.size} subscribed clients for order ${orderId}`);
    } else {
      console.log(`[WebSocket] ⚠️  No subscribed clients for order ${orderId}`);
    }
  }

  /**
   * Enhanced helper to format the order object with detailed item status,
   * timing info, addons, and progress tracking for the customer portal.
   */
  private formatOrderForBroadcast(order: any): any {
    if (!order) return null;

    // Format order items with detailed status and timing information
    const formattedOrderItems = order.orderItems?.map((item: any) => ({
      id: item.id,
      menuId: item.menuId,
      menuName: item.menu?.name || null,
      menuImage: item.menu?.image || null,
      categoryName: item.menu?.category?.name || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      specialInstructions: item.specialInstructions || null,
      // Item-level status and timing
      status: item.status || 'pending',
      estimatedPreparationTime: item.estimatedPreparationTime || null,
      originalPreparationTime: item.originalPreparationTime || null,
      startedAt: item.startedAt || null,
      readyAt: item.readyAt || null,
      servedAt: item.servedAt || null,
      // Calculate elapsed time if item is in progress
      elapsedTime: item.startedAt
        ? Math.floor((new Date().getTime() - new Date(item.startedAt).getTime()) / 1000 / 60) // in minutes
        : null,
      // Calculate remaining time if estimated time is available
      remainingTime: item.startedAt && item.estimatedPreparationTime
        ? Math.max(0, item.estimatedPreparationTime - Math.floor((new Date().getTime() - new Date(item.startedAt).getTime()) / 1000 / 60))
        : item.estimatedPreparationTime || null,
      // Include addons if available
      addons: item.orderItemAddons?.map((addon: any) => ({
        id: addon.id,
        addonId: addon.addonId,
        addonName: addon.addon?.name || addon.addonName || null,
        name: addon.addon?.name || addon.addonName || null, // For backward compatibility
        quantity: addon.quantity,
        unitPrice: addon.unitPrice,
        totalPrice: addon.totalPrice,
      })) || [],
      tableNo: item.tableNo || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })) || [];

    // Calculate overall order progress and estimated ready time
    const totalItems = formattedOrderItems.length;
    const itemsByStatus = {
      pending: formattedOrderItems.filter((item: any) => item.status === 'pending').length,
      in_progress: formattedOrderItems.filter((item: any) => item.status === 'in_progress').length,
      ready: formattedOrderItems.filter((item: any) => item.status === 'ready').length,
      served: formattedOrderItems.filter((item: any) => item.status === 'served').length,
    };

    // Calculate the maximum remaining time among all active items
    const activeItems = formattedOrderItems.filter((item: any) => item.status === 'pending' || item.status === 'in_progress');
    const maxRemainingTime = activeItems.length > 0
      ? Math.max(...activeItems.map((item: any) => item.remainingTime || 0))
      : 0;

    const estimatedOrderReadyTime = maxRemainingTime > 0
      ? new Date(new Date().getTime() + maxRemainingTime * 60000)
      : null;

    const progressPercentage = totalItems > 0
      ? Math.round(((itemsByStatus.in_progress + itemsByStatus.ready + itemsByStatus.served) / totalItems) * 100)
      : 0;

    // Return the formatted object
    return {
      id: order.id,
      orderId: order.id, // For compatibility
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      orderType: order.orderType,
      isOnHold: order.isOnHold || false,
      holdReason: order.holdReason || null,
      notes: order.notes || null,
      vehicleModel: order.vehicleModel || null,
      vehicleNumber: order.vehicleNumber || null,
      customerId: order.customerId || order.customer?.id,
      customerName: order.customer?.name || order.customerName || null,
      customerPhone: order.customer?.phone || order.customerPhone || null,
      restaurantId: order.restaurantId || order.restaurant?.id,
      restaurantName: order.restaurant?.name || null,
      tableNo: order.tableNo || null,
      paymentMethod: order.paymentMethod || null,
      paymentStatus: order.paymentStatus || null,
      payments: order.payments || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      // Enhanced items
      orderItems: formattedOrderItems,
      // Grouping info
      itemsProgress: {
        total: totalItems,
        byStatus: itemsByStatus,
        progressPercentage,
        maxRemainingTime, // Total minutes until whole order is ready
        estimatedOrderReadyTime, // ISO date for whole order
      },
      // Keep legacy fields
      itemsByCategory: order.itemsByCategory || null,
      items: order.items || null,
    };
  }

  // Method to broadcast new orders to restaurant/food court
  async broadcastNewOrder(order: any) {
    console.log(`[WebSocket] Broadcasting NEW ORDER:`);
    console.log(`  - Order ID: ${order.id}`);
    console.log(`  - Order Number: ${order.orderNumber}`);
    console.log(`  - Restaurant ID: ${order.restaurantId}`);
    console.log(`  - Food Court ID: ${order.foodCourtId}`);

    // Format complete order with detailed items
    const formattedOrder = this.formatOrderForBroadcast(order);

    // Broadcast to restaurant room
    if (order.restaurantId) {
      const room = `restaurant_${order.restaurantId}`;
      this.server.to(room).emit('new_order', formattedOrder);
      console.log(`  - Emitted to restaurant room: ${room}`);
    }

    // Broadcast to food court room
    if (order.foodCourtId) {
      const room = `food_court_${order.foodCourtId}`;
      this.server.to(room).emit('new_order', formattedOrder);
      console.log(`  - Emitted to food court room: ${room}`);
    }

    // Broadcast to customer room (IMPORTANT for multi-device sync)
    const customerId = order.customerId || order.customer?.id;
    if (customerId) {
      const room = `customer_${customerId}`;
      this.server.to(room).emit('new_order', formattedOrder);
      console.log(`  - Emitted to customer room: ${room}`);
    }

    // Also broadcast to anyone specifically subscribed to this order ID
    const socketIds = this.orderSubscriptions.get(order.id);
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit('new_order', formattedOrder);
      });
      console.log(`  - Emitted to ${socketIds.size} subscribed clients for order ${order.id}`);
    }

    console.log(`[WebSocket] NEW ORDER broadcast complete`);
  }

  // Method to broadcast order updates to restaurant/food court
  async broadcastOrderUpdate(order: any) {
    console.log(`[WebSocket] Broadcasting order update for order ${order.id || order.orderNumber}`);
    console.log(`[WebSocket] Order status: ${order.status}`);
    console.log(`[WebSocket] Customer ID: ${order.customerId || order.customer?.id || 'not found'}`);
    console.log(`[WebSocket] Restaurant ID: ${order.restaurantId}`);

    // Format order items with detailed status and timing information
    const formattedOrder = this.formatOrderForBroadcast(order);

    // Prepare status update payload for compatibility with order_status_update listeners
    const statusUpdatePayload = {
      orderId: order.id,
      status: order.status,
      updatedAt: new Date(),
      order: formattedOrder,
    };

    // Broadcast to restaurant room
    if (order.restaurantId) {
      this.server.to(`restaurant_${order.restaurantId}`).emit('order_update', formattedOrder);
      this.server.to(`restaurant_${order.restaurantId}`).emit('order_status_update', statusUpdatePayload);
      console.log(`[WebSocket] Sent to restaurant room: restaurant_${order.restaurantId}`);
    }

    // Broadcast to food court room
    if (order.foodCourtId) {
      this.server.to(`food_court_${order.foodCourtId}`).emit('order_update', formattedOrder);
      this.server.to(`food_court_${order.foodCourtId}`).emit('order_status_update', statusUpdatePayload);
      console.log(`[WebSocket] Sent to food court room: food_court_${order.foodCourtId}`);
    }

    // Broadcast to subscribed order clients ONLY (specific order tracking)
    // Clients ONLY receive updates for orders they specifically subscribed to
    const socketIds = this.orderSubscriptions.get(order.id);
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit('order_update', formattedOrder);
        this.server.to(socketId).emit('order_status_update', statusUpdatePayload);
      });
      console.log(`[WebSocket] Sent order_status_update to ${socketIds.size} subscribed clients for order ${order.id}`);
    } else {
      console.log(`[WebSocket] No subscribed clients for order ${order.id}`);
    }
  }
}
