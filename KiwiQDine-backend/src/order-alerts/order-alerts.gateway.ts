import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Alert } from './dto/alert.dto';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    },
    namespace: '/order-alerts',
    transports: ['websocket', 'polling'],
})
export class OrderAlertsGateway {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(OrderAlertsGateway.name);

    /**
     * Subscribe to restaurant alerts
     * All staff members should subscribe to their restaurant's alert room
     */
    @SubscribeMessage('subscribe_restaurant_alerts')
    async handleSubscribeRestaurantAlerts(
        @MessageBody() data: { restaurantId: string; userId?: string; role?: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { restaurantId, userId, role } = data;
        const room = `restaurant_alerts_${restaurantId}`;

        // Join restaurant alert room
        client.join(room);

        this.logger.log(`[Alert WebSocket] User subscribed to restaurant alerts:`);
        this.logger.log(`  - Socket ID: ${client.id}`);
        this.logger.log(`  - Restaurant ID: ${restaurantId}`);
        this.logger.log(`  - User ID: ${userId || 'guest'}`);
        this.logger.log(`  - Role: ${role || 'unknown'}`);
        this.logger.log(`  - Room: ${room}`);

        client.emit('subscribed_to_restaurant_alerts', { restaurantId });
    }

    @SubscribeMessage('unsubscribe_restaurant_alerts')
    async handleUnsubscribeRestaurantAlerts(
        @MessageBody() data: { restaurantId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { restaurantId } = data;
        const room = `restaurant_alerts_${restaurantId}`;

        client.leave(room);
        client.emit('unsubscribed_from_restaurant_alerts', { restaurantId });
        this.logger.log(`Client ${client.id} unsubscribed from restaurant alerts: ${restaurantId}`);
    }

    /**
     * Acknowledge an alert
     */
    @SubscribeMessage('acknowledge_alert')
    async handleAcknowledgeAlert(
        @MessageBody() data: { alertId: string; userId: string; restaurantId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { alertId, userId, restaurantId } = data;

        this.logger.log(`Alert ${alertId} acknowledged by user ${userId}`);

        // Broadcast acknowledgment to all clients in the restaurant
        const room = `restaurant_alerts_${restaurantId}`;
        this.server.to(room).emit('alert_acknowledged', {
            alertId,
            acknowledgedBy: userId,
            timestamp: new Date(),
        });
    }

    /**
     * Broadcast alert to restaurant
     */
    async broadcastAlert(restaurantId: string, alert: Alert) {
        const room = `restaurant_alerts_${restaurantId}`;

        this.logger.log(`[Alert Broadcast] Sending alert to restaurant ${restaurantId}:`);
        this.logger.log(`  - Type: ${alert.type}`);
        this.logger.log(`  - Priority: ${alert.priority}`);
        this.logger.log(`  - Order: ${alert.orderData.orderNumber}`);
        this.logger.log(`  - Message: ${alert.message}`);

        // Broadcast to restaurant room
        this.server.to(room).emit('order_alert', alert);

        // Also emit to global namespace for monitoring
        this.server.emit('order_alert_global', {
            restaurantId,
            alert,
        });

        // Get client count for logging
        const clientsInRoom = await this.server.in(room).allSockets();
        this.logger.log(`  - Clients notified: ${clientsInRoom.size}`);
    }

    /**
     * Broadcast multiple alerts at once (for periodic reminders)
     */
    async broadcastAlerts(restaurantId: string, alerts: Alert[]) {
        if (alerts.length === 0) return;

        const room = `restaurant_alerts_${restaurantId}`;

        this.logger.log(`[Alert Batch Broadcast] Sending ${alerts.length} alerts to restaurant ${restaurantId}`);

        // Broadcast batch to restaurant room
        this.server.to(room).emit('order_alerts_batch', {
            alerts,
            timestamp: new Date(),
            count: alerts.length,
        });

        // Get client count for logging
        const clientsInRoom = await this.server.in(room).allSockets();
        this.logger.log(`  - Clients notified: ${clientsInRoom.size}`);
    }

    /**
     * Clear/dismiss an alert
     */
    async clearAlert(restaurantId: string, alertId: string) {
        const room = `restaurant_alerts_${restaurantId}`;

        this.server.to(room).emit('alert_cleared', {
            alertId,
            timestamp: new Date(),
        });
    }
}
