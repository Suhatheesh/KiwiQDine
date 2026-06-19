import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsUUID, ValidateNested, IsBoolean, Min, IsNotEmpty, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../infrastructure/database/entities';

// Custom validator for specialInstructions that accepts both string and object
function IsStringOrObject(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrObject',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === undefined || value === null) {
            return true; // Optional field
          }
          return typeof value === 'string' || (typeof value === 'object' && !Array.isArray(value) && value !== null);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a string or an object`;
        },
      },
    });
  };
}

// DTO for addon selections
export class OrderItemAddonSelectionDto {
  @ApiProperty({ format: 'uuid', description: 'Addon identifier' })
  @IsUUID()
  addonId: string;

  @ApiProperty({ example: 1, minimum: 1, description: 'Quantity of this addon' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderItemDto {
  @ApiProperty({ format: 'uuid', description: 'Menu item identifier' })
  @IsUUID()
  menuId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Special instructions for the item (string or object for customization options)',
    oneOf: [
      { type: 'string', example: 'Extra spicy' },
      { type: 'object', example: { portion: 'Medium', spiceLevel: 'High' } }
    ],
    examples: {
      stringExample: { value: 'Extra spicy' },
      objectExample: { value: { portion: 'Medium', spiceLevel: 'High' } }
    }
  })
  @IsOptional()
  @IsStringOrObject()
  @Transform(({ value }) => {
    // Preserve the value as-is (string or object) - don't transform it
    // The service layer will handle serialization
    return value;
  })
  specialInstructions?: string | object;

  @ApiPropertyOptional({ type: [String], description: 'List of addon identifiers applied to the item', isArray: true })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  addonIds?: string[];

  @ApiPropertyOptional({
    description: 'Structured addon selections with quantities',
    type: [OrderItemAddonSelectionDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemAddonSelectionDto)
  selectedAddons?: OrderItemAddonSelectionDto[];
}

export class CreateOrderDto {
  @ApiProperty({ format: 'uuid', description: 'Restaurant identifier' })
  @IsUUID()
  restaurantId: string;

  @ApiPropertyOptional({
    description: 'Customer identifier - can be phone number (for authenticated customers) or customer UUID (for staff creating orders). If not provided, phone must be provided.',
    example: '+1234567890',
    examples: {
      phoneNumber: { value: '+1234567890', description: 'Phone number (customer authenticated via OTP)' },
      customerUuid: { value: 'd9351999-259b-47df-b56a-960c3b27a7ec', description: 'Customer UUID (staff creating order)' }
    }
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Customer phone number (alternative to customerId)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Customer name (used when creating a new customer)' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Optional associated table number' })
  @IsOptional()
  @IsString()
  tableNo?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Optional table ID (UUID)' })
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiPropertyOptional({
    enum: ['takeaway', 'dine_in', 'parking'],
    description: 'Order type: takeaway (pickup), dine_in (table service), or parking (valet/drive-through with optional vehicle info)',
    example: 'dine_in'
  })
  @IsOptional()
  @IsEnum(['takeaway', 'dine_in', 'parking'])
  orderType?: 'takeaway' | 'dine_in' | 'parking';

  @ApiProperty({ type: [CreateOrderItemDto], description: 'Items included in the order' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Payment method selected for the order. Required for restaurant portal order creation. Staff must select a payment method when creating orders.',
    example: PaymentMethod.CASHIER
  })
  @IsNotEmpty({ message: 'Payment method is required when creating orders from restaurant portal' })
  @IsEnum(PaymentMethod, { message: 'Payment method must be one of: cash, card, qr, cashier' })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Vehicle model (Optional - for parking orders)',
    example: 'Toyota Camry'
  })
  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @ApiPropertyOptional({
    description: 'Vehicle number/license plate (Optional - for parking orders)',
    example: 'ABC-1234'
  })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ description: 'Serialized customer details' })
  @IsOptional()
  @IsString()
  customerInfo?: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ type: [CreateOrderItemDto], description: 'Updated items for the order. When provided, replaces the existing order items and recalculates totals.' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems?: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: 'Updated notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Serialized customer details' })
  @IsOptional()
  @IsString()
  customerInfo?: string;

  @ApiPropertyOptional({ description: 'Whether the restaurant is accepting orders' })
  @IsOptional()
  @IsBoolean()
  isAcceptingOrders?: boolean;
}

export class ProcessPaymentDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Reference received for the payment' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Additional payment notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Amount given by customer (for cash payments)', example: 1500 })
  @IsOptional()
  @IsNumber()
  amountTendered?: number;

  @ApiPropertyOptional({ description: 'Change returned to customer (for cash payments)', example: 200 })
  @IsOptional()
  @IsNumber()
  changeReturned?: number;
}
export class UpdateOrderItemStatusDto {
  @ApiProperty({ enum: ['pending', 'in_progress', 'ready', 'served'], description: 'New status for the order item' })
  @IsEnum(['pending', 'in_progress', 'ready', 'served'])
  status: string;
}
