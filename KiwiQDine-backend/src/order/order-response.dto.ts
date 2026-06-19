
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { IAudit } from '../infrastructure/database/mongoDB/base-document.interface';
import { IOrderNoteResponseDTO } from 'src/order_notes/dto/order-note-response';
import { IOrderStatusResponseDTO } from 'src/order_statuses/dto/order-status-response';

export interface IOrderResponseDTO extends IAudit {
  id: string;
  state: IOrderStatusResponseDTO;
  type: string;
  singleclientId: string;
  customerId?: string;
  subtotal: number;
  serviceCharge: number;
  tax: number;
  total: number;
  discount?: number;
  notes?: IOrderNoteResponseDTO[];
  orderManagerId?: string;
}

export class OrderStatusResponseDoc {
  @ApiProperty({ description: 'Unique identifier of the order status', example: 'status-123' })
  id: string;

  @ApiProperty({ description: 'Display name of the status', example: 'Created' })
  name: string;

  @ApiProperty({ description: 'Machine readable code for the status', example: 'CREATED' })
  code: string;

  @ApiPropertyOptional({ description: 'Optional description providing more context about the status', example: 'Order has been registered and awaiting processing.' })
  description?: string;

  @ApiProperty({ description: 'Indicates whether the status can be used for new orders', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp indicating when the status was created', example: '2024-03-24T10:15:30.000Z' })
  auditCreatedDateTime: string;

  @ApiProperty({ description: 'Identifier of the user who created the status', example: 'admin-user' })
  auditCreatedBy: string;

  @ApiPropertyOptional({ description: 'Identifier of the user who last modified the status', example: 'operations-user' })
  auditModifiedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp for the last status modification', example: '2024-04-01T09:45:12.000Z' })
  auditModifiedDateTime?: string;

  @ApiPropertyOptional({ description: 'Identifier of the user who deleted the status', example: 'system-user' })
  auditDeletedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp indicating when the status was deleted', example: '2024-05-10T12:00:00.000Z' })
  auditDeletedDateTime?: string;
}

export class OrderNoteResponseDoc {
  @ApiProperty({ description: 'Unique identifier for the note entry', example: 'note-789' })
  id: string;

  @ApiProperty({ description: 'Free-form note text supplied for the order', example: 'Customer requested extra napkins.' })
  note: string;

  @ApiProperty({ description: 'Order identifier the note belongs to', example: 'order-456' })
  orderId: string;

  @ApiProperty({ description: 'ISO timestamp indicating when the note was created', example: '2024-03-24T10:20:00.000Z' })
  auditCreatedDateTime: string;

  @ApiProperty({ description: 'Identifier of the user who created the note', example: 'waiter-15' })
  auditCreatedBy: string;

  @ApiPropertyOptional({ description: 'Identifier of the user who last modified the note', example: 'manager-7' })
  auditModifiedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp for the last modification of the note', example: '2024-03-24T10:45:00.000Z' })
  auditModifiedDateTime?: string;

  @ApiPropertyOptional({ description: 'Identifier of the user who deleted the note', example: 'system-user' })
  auditDeletedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp indicating when the note was deleted', example: '2024-04-01T08:00:00.000Z' })
  auditDeletedDateTime?: string;
}

export class OrderResponseDoc {
  @ApiProperty({ description: 'Unique identifier for the order', example: 'order-456' })
  id: string;

  @ApiProperty({ description: 'Order status information', type: () => OrderStatusResponseDoc })
  state: OrderStatusResponseDoc;

  @ApiProperty({ description: 'Dining type associated with the order', example: 'PICK_UP' })
  type: string;

  @ApiProperty({ description: 'Identifier of the single client associated with the order', example: 'c9c39c09-6e3b-4f55-9d1a-19a01a6518e2' })
  singleclientId: string;

  @ApiPropertyOptional({ description: 'Identifier of the customer placing the order', example: 'customer-321' })
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Total amount of items before charges', example: 100.0 })
  subtotal: number;

  @ApiProperty({ description: 'Calculated service charge amount', example: 10.0 })
  serviceCharge: number;

  @ApiProperty({ description: 'Tax amount', example: 0.0 })
  tax: number;

  @ApiProperty({ description: 'Total amount billed for the order', example: 110.0 })
  total: number;

  @ApiPropertyOptional({ description: 'Discount amount applied to the order', example: 10 })
  discount?: number;

  @ApiPropertyOptional({ description: 'Collection of notes associated with the order', type: () => [OrderNoteResponseDoc] })
  notes?: OrderNoteResponseDoc[];

  @ApiPropertyOptional({ description: 'Identifier of the assigned order manager', example: 'order-manager-12' })
  orderManagerId?: string;

  @ApiProperty({ description: 'ISO timestamp indicating when the order was created', example: '2024-03-24T10:15:30.000Z' })
  auditCreatedDateTime: string;

  @ApiProperty({ description: 'Identifier of the user who created the order', example: 'cashier-2' })
  auditCreatedBy: string;

  @ApiPropertyOptional({ description: 'Identifier of the user who last modified the order', example: 'manager-7' })
  auditModifiedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp for the last order modification', example: '2024-03-24T11:05:45.000Z' })
  auditModifiedDateTime?: string;

  @ApiPropertyOptional({ description: 'Identifier of the user who deleted the order', example: 'system-user' })
  auditDeletedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp indicating when the order was deleted', example: '2024-04-01T09:25:00.000Z' })
  auditDeletedDateTime?: string;
}

export class OrderResultDoc {
  @ApiProperty({ description: 'Indicates whether the operation completed successfully', example: true })
  isSuccess: boolean;

  @ApiPropertyOptional({ description: 'Payload returned when the operation succeeds', type: () => OrderResponseDoc })
  data?: OrderResponseDoc;

  @ApiPropertyOptional({ description: 'Human-readable message describing the result', example: 'Order created successfully.' })
  message?: string;

  @ApiPropertyOptional({ description: 'HTTP status code representing the error when the operation fails', example: 400 })
  errorCode?: number;
}
