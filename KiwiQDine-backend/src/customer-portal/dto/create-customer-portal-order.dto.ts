import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested, IsInt, Min, IsEnum, registerDecorator, ValidationOptions, ValidationArguments, IsNumber } from 'class-validator';
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
export class AddonSelectionDto {
  @ApiProperty({ format: 'uuid', description: 'Addon identifier' })
  @IsUUID()
  addonId: string;

  @ApiProperty({ example: 1, minimum: 1, description: 'Quantity of this addon' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CustomerPortalOrderItemDto {
  @ApiProperty({ format: 'uuid', description: 'Identifier of the menu item being ordered' })
  @IsUUID()
  menuId: string;

  @ApiProperty({ example: 2, minimum: 1, description: 'Quantity ordered for the menu item' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Special instructions provided by the customer (string or object for customization options)',
    examples: {
      stringExample: { value: 'Extra spicy' },
      objectExample: { value: { portion: 'Medium', spiceLevel: 'High' } }
    }
  })
  @IsOptional()
  @IsStringOrObject()
  specialInstructions?: string | object;

  @ApiPropertyOptional({
    description: 'Selected addons for this menu item',
    type: [AddonSelectionDto],
    example: [
      { addonId: 'e3f513f6-840d-499f-90bb-ee5ec09992af', quantity: 1 },
      { addonId: 'd16bc8fe-c281-4865-8b15-e4be1c193d93', quantity: 1 }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddonSelectionDto)
  selectedAddons?: AddonSelectionDto[];
}

export class CreateCustomerPortalOrderDto {
  @ApiProperty({ format: 'uuid', description: 'Restaurant identifier for the order' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ description: 'Customer phone number (required for order processing)' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Customer name (required for order processing)' })
  @IsString()
  customerName: string;

  @ApiPropertyOptional({ description: 'Optional table number/ID associated with the order (from QR code)' })
  @IsOptional()
  @IsString()
  tableNo?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Optional table ID (UUID) - must be available to place order' })
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Optional QR code ID (used to get table ID if tableNo not provided)' })
  @IsOptional()
  @IsUUID()
  qrCodeId?: string;

  @ApiPropertyOptional({
    enum: ['takeaway', 'dine_in', 'parking'],
    description: 'Order type: takeaway (pickup), dine_in (table service), or parking (valet/drive-through with optional vehicle info)',
    example: 'dine_in'
  })
  @IsOptional()
  @IsEnum(['takeaway', 'dine_in', 'parking'])
  orderType?: 'takeaway' | 'dine_in' | 'parking';

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

  @ApiProperty({ type: [CustomerPortalOrderItemDto], description: 'List of menu items being ordered' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerPortalOrderItemDto)
  orderItems: CustomerPortalOrderItemDto[];

  @ApiProperty({
    enum: PaymentMethod,
    description: 'Payment method selected by customer (cash, card, qr, or cashier)',
    example: PaymentMethod.CASHIER
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Optional notes or special instructions for the order' })
  @IsOptional()
  @IsString()
  notes?: string;
}



