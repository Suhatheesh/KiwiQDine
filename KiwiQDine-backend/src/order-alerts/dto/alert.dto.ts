import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum AlertType {
    PENDING_CONFIRMATION = 'pending_confirmation',
    WAITER_CONFIRMATION_NEEDED = 'waiter_confirmation_needed',
    ORDER_OVERTIME = 'order_overtime',
    ITEM_OVERTIME = 'item_overtime',
    NEW_ORDER = 'new_order',
}

export enum AlertPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export interface OrderAlertData {
    orderId: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    tableNo?: string;
    orderType: 'dine_in' | 'takeaway' | 'parking';
    status: string;
    totalAmount: number;
    waitingTime: number; // in minutes
    createdAt: Date;
    items?: {
        id: string;
        menuName: string;
        quantity: number;
        status: string;
        waitingTime?: number;
    }[];
}

export interface Alert {
    id: string;
    type: AlertType;
    priority: AlertPriority;
    title: string;
    message: string;
    orderData: OrderAlertData;
    orders?: OrderAlertData[]; // For grouped alerts with multiple orders
    orderCount?: number; // Total number of orders in this alert
    timestamp: Date;
    acknowledged: boolean;
    countdownSeconds?: number; // Countdown timer in seconds (e.g., 30)
    expiresAt?: Date; // When the countdown expires
    actions?: AlertAction[]; // Quick action buttons
}

export interface AlertAction {
    id: string;
    label: string; // e.g., "Accept Order", "Confirm", "View Details"
    type: 'confirm' | 'view' | 'dismiss' | 'custom';
    orderId?: string; // For single order actions
    endpoint?: string; // API endpoint to call
    method?: 'POST' | 'PATCH' | 'GET';
    requiresConfirmation?: boolean;
}

export class AlertConfigDto {
    @ApiProperty({ description: 'Interval in minutes for pending order reminders', example: 5 })
    @IsNumber()
    @Min(1)
    @IsOptional()
    pendingOrderReminderInterval?: number;

    @ApiProperty({ description: 'Interval in minutes for waiter confirmation reminders', example: 3 })
    @IsNumber()
    @Min(1)
    @IsOptional()
    waiterConfirmationReminderInterval?: number;

    @ApiProperty({ description: 'Threshold in minutes for order overtime alerts', example: 30 })
    @IsNumber()
    @Min(1)
    @IsOptional()
    orderOvertimeThreshold?: number;

    @ApiProperty({ description: 'Threshold in minutes for item overtime alerts', example: 20 })
    @IsNumber()
    @Min(1)
    @IsOptional()
    itemOvertimeThreshold?: number;

    @ApiProperty({ description: 'Enable/disable immediate alerts for new orders', example: true })
    @IsOptional()
    enableImmediateAlerts?: boolean;
}

export class UpdateAlertConfigDto extends AlertConfigDto {
    @ApiProperty({ description: 'Restaurant ID' })
    @IsString()
    restaurantId: string;
}
