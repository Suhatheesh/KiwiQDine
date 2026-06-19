import { IsString, IsEnum, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus as OrderStatusEnum } from '../../infrastructure/database/entities/order.entity';

export class CreateOrderStatusDto {
  @ApiProperty({
    description: 'Identifier of the order whose status is being updated',
    format: 'uuid',
    example: '5f6b0a7c-9b0a-4ece-9e02-4b836f5ba705',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'New status applied to the order',
    enum: OrderStatusEnum,
    example: OrderStatusEnum.CONFIRMED,
  })
  @IsEnum(OrderStatusEnum)
  status: OrderStatusEnum;

  @ApiPropertyOptional({
    description: 'Optional notes describing the status change',
    example: 'Order confirmed by manager after payment verification.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Identifier of the user responsible for the update',
    example: 'manager-uuid',
  })
  @IsString()
  updatedBy: string;
}

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({
    description: 'Updated status for the order',
    enum: OrderStatusEnum,
    example: OrderStatusEnum.PREPARING,
  })
  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

  @ApiPropertyOptional({
    description: 'Optional notes describing the update',
    example: 'Kitchen started preparing the order.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Identifier of the user performing the update',
    example: 'kitchen-staff-uuid',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class UpdateOrderItemStatusDto {
  @ApiProperty({
    description: 'New status for the order item',
    example: 'in_progress',
  })
  @IsString()
  status: string;

  @ApiPropertyOptional({
    description: 'Additional preparation time requested in minutes',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  additionalPreparationTime?: number;

  @ApiProperty({
    description: 'Identifier of the user performing the update',
    example: 'kitchen-staff-uuid',
  })
  @IsString()
  updatedBy: string;
}

export class CancelOrderDto {
  @ApiProperty({
    description: 'Reason provided for cancelling the order',
    example: 'Customer requested cancellation prior to preparation.',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Identifier of the user performing the cancellation',
    example: 'tenant-admin-uuid',
  })
  @IsString()
  updatedBy: string;
}

export class HoldOrderDto {
  @ApiProperty({
    description: 'Reason for putting the order on hold',
    example: 'Waiting for customer confirmation',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Identifier of the user putting the order on hold',
    example: 'waiter-uuid',
  })
  @IsString()
  updatedBy: string;
}