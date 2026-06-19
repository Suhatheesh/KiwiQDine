import { Menu } from './../menu/menu';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  IsArray,
  IsUUID,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CreateLocationDTO } from './../location/create-location.dto';
import { PaymentMethod } from './restaurant.interface';

class RestaurantAddressDto {
  @ApiPropertyOptional({ description: 'Lane or street address', example: '42 Elm Street' })
  @IsOptional()
  @IsString()
  lane?: string;

  @ApiPropertyOptional({ description: 'City where the restaurant is located', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'District or state of the restaurant', example: 'Manhattan' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Country of the restaurant', example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;
}
export class CreateRestaurantDTO {
  @ApiProperty({ example: 'Cafe Delight', description: 'Display name of the restaurant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  readonly name: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Tenant identifier the restaurant belongs to' })
  @IsUUID()
  @IsOptional()
  readonly tenantId?: string;

  @ApiPropertyOptional({ description: 'URL or path for the restaurant logo' })
  @IsString()
  @MaxLength(256)
  @IsOptional()
  readonly logo?: string;

  @ApiPropertyOptional({ description: 'Structured address information for the restaurant', type: () => RestaurantAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RestaurantAddressDto)
  readonly address?: RestaurantAddressDto;

  @ApiPropertyOptional({ example: 'info@cafedelight.com', description: 'Contact email' })
  @IsString()
  @MaxLength(256)
  @IsOptional()
  @IsEmail()
  readonly contactEmail?: string;

  @ApiPropertyOptional({ example: '+15555550123', description: 'Contact phone number' })
  @IsString()
  @MaxLength(256)
  @IsOptional()
  readonly contactPhoneNumber?: string;

  @ApiPropertyOptional({ example: '09:00', description: 'Opening time (HH:MM)' })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  readonly openTime?: string; // e.g., "09:00"

  @ApiPropertyOptional({ example: '22:00', description: 'Closing time (HH:MM)' })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  readonly closeTime?: string; // e.g., "22:00"

  @ApiPropertyOptional({
    description: 'Custom operating hours per day of week',
    example: { Monday: '09:00-22:00', Tuesday: '09:00-22:00' },
  })
  @IsObject()
  @IsOptional()
  readonly openHours?: Record<string, string>; // e.g., { "mon-fri": "10:00-22:00", "sat-sun": "09:00-23:00" }

  // Legacy fields for backward compatibility
  @ApiPropertyOptional({ example: 'legacy@cafedelight.com', description: 'Legacy email field' })
  @IsString()
  @MaxLength(256)
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiPropertyOptional({ default: true, description: 'Whether the restaurant is active' })
  @IsBoolean()
  @IsOptional()
  readonly isActive?: boolean;

  @ApiPropertyOptional({ example: 'https://cafedelight.com', description: 'Restaurant website URL' })
  @IsString()
  @MaxLength(256)
  @IsOptional()
  readonly webUrl?: string;

  @ApiPropertyOptional({ description: 'Legacy logo URL' })
  @IsString()
  @MaxLength(256)
  @IsOptional()
  readonly logoUrl?: string;

  @ApiPropertyOptional({ description: 'Hero image URL' })
  @IsString()
  @MaxLength(256)
  @IsOptional()
  readonly imageUrl?: string;

  @ApiPropertyOptional({ example: 9, description: 'Opening hour in 24h format' })
  @IsNumber()
  @IsOptional()
  readonly openingHour?: number;

  @ApiPropertyOptional({ example: 22, description: 'Closing hour in 24h format' })
  @IsNumber()
  @IsOptional()
  readonly closingHour?: number;

  @ApiPropertyOptional({ default: false, description: 'Whether the restaurant is currently open' })
  @IsBoolean()
  @IsOptional()
  readonly opened?: boolean;

  @ApiPropertyOptional({ example: 'America/New_York', description: 'Timezone identifier' })
  @IsString()
  @MaxLength(256)
  @IsOptional()
  readonly timeZone?: string;

  @ApiPropertyOptional({ example: '+15555550123', description: 'Primary phone number' })
  @IsString()
  @MaxLength(256)
  @IsOptional()
  readonly phoneNumber?: string;

  @ApiPropertyOptional({ type: [String], description: 'Supported payment methods' })
  @IsString({ each: true })
  @IsOptional()
  readonly paymentMethod?: PaymentMethod[];

  @ApiPropertyOptional({ type: [Menu], description: 'Menus to associate at creation time' })
  @IsArray()
  @IsOptional()
  readonly menus?: Menu[];

  @ApiPropertyOptional({
    enum: ['pay_at_first', 'pay_at_last'],
    default: 'pay_at_last',
    description: 'Payment timing: pay_at_first (customer pays before eating) or pay_at_last (customer pays after eating)',
    example: 'pay_at_last'
  })
  @IsEnum(['pay_at_first', 'pay_at_last'])
  @IsOptional()
  readonly paymentTiming?: 'pay_at_first' | 'pay_at_last';

  @ApiPropertyOptional({ type: 'number', example: 0, description: 'Initial wallet balance' })
  @IsNumber()
  @IsOptional()
  readonly walletBalance?: number;

  @ApiPropertyOptional({ description: 'Location details for the restaurant' })
  @IsObject()
  @IsOptional()
  readonly location?: CreateLocationDTO;

  @ApiPropertyOptional({ example: '#FFFFFF', description: 'Primary brand color' })
  @IsString()
  @IsOptional()
  readonly primaryColor?: string;

  @ApiPropertyOptional({ example: '#000000', description: 'Secondary brand color' })
  @IsString()
  @IsOptional()
  readonly secondaryColor?: string;

  @ApiPropertyOptional({ example: '#F0F0F0', description: 'Tertiary brand color' })
  @IsString()
  @IsOptional()
  readonly tertiaryColor?: string;

  // Service Charge Configuration
  @ApiPropertyOptional({ example: 10.00, description: 'Service charge percentage (0-100)' })
  @IsNumber()
  @IsOptional()
  readonly serviceChargePercentage?: number;

  @ApiPropertyOptional({ default: false, description: 'Whether to apply service charge on orders' })
  @IsBoolean()
  @IsOptional()
  readonly applyServiceCharge?: boolean;

  @ApiPropertyOptional({ enum: ['percentage', 'fixed'], default: 'percentage', description: 'Type of service charge' })
  @IsEnum(['percentage', 'fixed'])
  @IsOptional()
  readonly serviceChargeType?: 'percentage' | 'fixed';

  @ApiPropertyOptional({ example: 50.00, description: 'Fixed service charge amount' })
  @IsNumber()
  @IsOptional()
  readonly fixedServiceCharge?: number;

  @ApiPropertyOptional({ default: false, description: 'Whether to require waiter confirmation for orders' })
  @IsBoolean()
  @IsOptional()
  readonly requireWaiterConfirmation?: boolean;
}
