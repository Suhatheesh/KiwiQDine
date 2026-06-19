import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { currentStatus, dinningType } from '../order-entity.interface';

export class CreateOrderDTO {
  @ApiProperty({
    description: 'Initial lifecycle state for the order',
    enum: ['CREATED', 'ACCEPTED', 'DENIED', 'FINISHED', 'CANCELLED'],
    example: 'CREATED',
  })
  @IsString()
  @IsNotEmpty()
  state: currentStatus;

  @ApiProperty({
    description: 'Dining type associated with the order',
    enum: ['PICK_UP', 'DINE_IN', 'DELIVERY'],
    example: 'PICK_UP',
  })
  @IsString()
  @IsNotEmpty()
  type: dinningType;

  @ApiProperty({
    description: 'Identifier of the single client associated with the order',
    example: 'c9c39c09-6e3b-4f55-9d1a-19a01a6518e2',
  })
  @IsString()
  @IsNotEmpty()
  singleClientId: string;

  @ApiProperty({
    description: 'Total amount for the order',
    example: 128.5,
  })
  @IsNumber()
  @IsNotEmpty()
  total: number;

  @ApiProperty({
    description: 'Brief summary or title describing the order',
    example: 'Lunch combo with add-ons',
  })
  @IsString()
  @IsNotEmpty()
  summary: string;

  @ApiPropertyOptional({
    description: 'Line items included in the order',
    type: () => [CreateCartItemsDTO],
  })
  @IsOptional()
  @IsArray()
  cartItems?: CreateCartItemsDTO[];

  @ApiProperty({
    description: 'Restaurant identifier for payment timing validation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @ApiPropertyOptional({
    description: 'Payment method used (required for pay_at_first restaurants)',
    enum: ['cash', 'card', 'qr', 'cashier'],
    example: 'card',
  })
  @IsOptional()
  @IsEnum(['cash', 'card', 'qr', 'cashier'])
  paymentMethod?: 'cash' | 'card' | 'qr' | 'cashier';

  @ApiPropertyOptional({
    description: 'Payment status (required for pay_at_first restaurants)',
    enum: ['pending', 'paid', 'failed', 'refunded'],
    example: 'paid',
  })
  @IsOptional()
  @IsEnum(['pending', 'paid', 'failed', 'refunded'])
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
}

export class CreateCartItemsDTO {
  @ApiProperty({
    description: 'Identifier of the menu linked to the cart item',
    example: 'menu-123',
  })
  @IsString()
  @IsNotEmpty()
  menuId: string;

  @ApiProperty({
    description: 'Order identifier used when linking cart items',
    example: 'order-456',
  })
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Additional note for kitchen or fulfillment team',
    example: 'Extra spicy sauce on the side.',
  })
  @IsString()
  @IsNotEmpty()
  note: string;

  @ApiProperty({
    description: 'Total amount for this cart item including selected add-ons',
    example: 24.99,
  })
  @IsNumber()
  @IsNotEmpty()
  total: number;

  @ApiProperty({
    description: 'Selected menu items that compose this cart item',
    type: () => [CreateSelectedItemsDTO],
  })
  @IsNotEmpty()
  @IsArray()
  selectedItems: CreateSelectedItemsDTO[];
}

export class CreateSelectedItemsDTO {
  @ApiProperty({
    description: 'Identifier of the parent cart item',
    example: 'cart-item-001',
  })
  @IsNotEmpty()
  @IsString()
  cartItemId: string;

  @ApiProperty({
    description: 'Identifier of the menu associated with the selected item',
    example: 'menu-123',
  })
  @IsString()
  @IsNotEmpty()
  menuId: string;

  @ApiProperty({
    description: 'Identifier of the actual menu item selected',
    example: 'item-789',
  })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({
    description: 'Unit price applied to the selected item',
    example: 12.5,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    description: 'Quantity ordered for the selected item',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
