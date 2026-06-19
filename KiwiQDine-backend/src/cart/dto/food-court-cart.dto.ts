import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsInt, Min, IsOptional, IsEnum, IsNumber, IsObject, IsArray } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ format: 'uuid', description: 'Restaurant identifier' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ format: 'uuid', description: 'Menu item identifier' })
  @IsUUID()
  menuId: string;

  @ApiProperty({ example: 1, minimum: 1, description: 'Quantity to add' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Special instructions (string or object)',
    examples: {
      stringExample: { value: 'Extra spicy' },
      objectExample: { value: { portion: 'Medium', spiceLevel: 'High' } }
    }
  })
  @IsOptional()
  @IsObject()
  specialInstructions?: string | object;

  @ApiPropertyOptional({
    description: 'Selected addons for this menu item',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        addonId: { type: 'string', format: 'uuid' },
        quantity: { type: 'number', minimum: 1 }
      }
    },
    example: [
      { addonId: 'e3f513f6-840d-499f-90bb-ee5ec09992af', quantity: 1 },
      { addonId: 'd16bc8fe-c281-4865-8b15-e4be1c193d93', quantity: 1 }
    ]
  })
  @IsOptional()
  @IsArray()
  selectedAddons?: Array<{ addonId: string; quantity: number }>;
}

export class UpdateCartItemDto {
  @ApiProperty({ format: 'uuid', description: 'Menu item identifier' })
  @IsUUID()
  menuId: string;

  @ApiProperty({ example: 2, minimum: 1, description: 'New quantity' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Special instructions' })
  @IsOptional()
  @IsObject()
  specialInstructions?: string | object;

  @ApiPropertyOptional({
    description: 'Selected addons for this menu item (used to identify which cart item to update)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        addonId: { type: 'string', format: 'uuid' },
        quantity: { type: 'number', minimum: 1 }
      }
    }
  })
  @IsOptional()
  @IsArray()
  selectedAddons?: Array<{ addonId: string; quantity: number }>;
}

export class RemoveCartItemDto {
  @ApiProperty({ format: 'uuid', description: 'Menu item identifier to remove' })
  @IsUUID()
  menuId: string;

  @ApiPropertyOptional({
    description: 'Selected addons for this menu item (used to identify which cart item to remove)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        addonId: { type: 'string', format: 'uuid' },
        quantity: { type: 'number', minimum: 1 }
      }
    }
  })
  @IsOptional()
  @IsArray()
  selectedAddons?: Array<{ addonId: string; quantity: number }>;
}

export class CreateOrderFromCartDto {
  @ApiProperty({ description: 'Customer phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  customerName: string;

  @ApiPropertyOptional({
    enum: ['cash', 'card', 'qr', 'cashier'],
    description: 'Payment method'
  })
  @IsOptional()
  @IsEnum(['cash', 'card', 'qr', 'cashier'])
  paymentMethod?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Table ID' })
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiPropertyOptional({ description: 'Table number' })
  @IsOptional()
  @IsString()
  tableNo?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'QR code ID' })
  @IsOptional()
  @IsUUID()
  qrCodeId?: string;

  @ApiPropertyOptional({
    enum: ['takeaway', 'dine_in', 'parking'],
    description: 'Order type'
  })
  @IsOptional()
  @IsEnum(['takeaway', 'dine_in', 'parking'])
  orderType?: 'takeaway' | 'dine_in' | 'parking';

  @ApiPropertyOptional({
    description: 'Vehicle model (for parking orders)',
    example: 'Toyota Camry'
  })
  @IsOptional()
  @IsString()
  vehicleModel?: string;

  @ApiPropertyOptional({
    description: 'Vehicle number/license plate (for parking orders)',
    example: 'ABC-1234'
  })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;
}
