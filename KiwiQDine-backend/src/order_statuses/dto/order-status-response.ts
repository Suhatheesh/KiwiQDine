
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IAudit } from '../../infrastructure/database/mongoDB/base-document.interface';

export interface IOrderStatusResponseDTO extends IAudit {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export class OrderStatusResponseDoc {
  @ApiProperty({ description: 'Unique identifier of the order status', example: 'status-uuid' })
  id: string;

  @ApiProperty({ description: 'Display name of the status', example: 'Pending' })
  name: string;

  @ApiProperty({ description: 'Machine-readable status code', example: 'PENDING' })
  code: string;

  @ApiPropertyOptional({
    description: 'Optional description giving more context about when the status applies',
    example: 'Order has been received and awaits confirmation.',
  })
  description?: string;

  @ApiProperty({ description: 'Whether the status can be assigned to orders', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'ISO timestamp when the status was created', example: '2024-03-24T10:15:30.000Z' })
  auditCreatedDateTime: string;

  @ApiProperty({ description: 'Identifier of the user who created the status', example: 'admin-user' })
  auditCreatedBy: string;

  @ApiPropertyOptional({ description: 'Identifier of the user who last modified the status', example: 'ops-user' })
  auditModifiedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp of the last modification', example: '2024-04-01T09:45:12.000Z' })
  auditModifiedDateTime?: string;

  @ApiPropertyOptional({ description: 'Identifier of the user who deleted the status', example: 'system-user' })
  auditDeletedBy?: string;

  @ApiPropertyOptional({ description: 'ISO timestamp indicating when the status was deleted', example: '2024-05-10T12:00:00.000Z' })
  auditDeletedDateTime?: string;
}

export class OrderStatusResultDoc {
  @ApiProperty({ description: 'Indicates whether the operation succeeded', example: true })
  isSuccess: boolean;

  @ApiPropertyOptional({ description: 'Payload returned on success', type: () => OrderStatusResponseDoc })
  data?: OrderStatusResponseDoc;

  @ApiPropertyOptional({ description: 'Descriptive message about the result', example: 'Order status created successfully.' })
  message?: string;

  @ApiPropertyOptional({ description: 'HTTP error code when the request fails', example: 400 })
  errorCode?: number;
}

export class OrderStatusListResultDoc {
  @ApiProperty({ description: 'Indicates whether the operation succeeded', example: true })
  isSuccess: boolean;

  @ApiPropertyOptional({ description: 'Collection of order statuses', type: () => [OrderStatusResponseDoc] })
  data?: OrderStatusResponseDoc[];

  @ApiPropertyOptional({ description: 'Descriptive message about the result', example: 'Order statuses retrieved successfully.' })
  message?: string;

  @ApiPropertyOptional({ description: 'HTTP error code when the request fails', example: 400 })
  errorCode?: number;
}
