import { IsString, IsNumber, IsOptional, Min, IsUUID, IsArray, ValidateNested, IsBoolean, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class VariantOptionItemDto {
  @ApiProperty({ description: 'Variant option name (e.g., "Small", "Medium", "Large")', example: 'Small' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Price for this variant option', example: 1200 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ description: 'Price modifier for this variant option (alias for price, will be mapped to price)', example: 1200 })
  @IsOptional()
  @IsNumber()
  priceModifier?: number;
}

export class VariantOptionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsString()
  type: 'single' | 'multiple';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  required?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantOptionItemDto)
  options: VariantOptionItemDto[];
}

export class CreateMenuDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityAvailable?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preparationTime?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'availableFrom must be in HH:mm format (e.g., "12:00", "09:30")',
  })
  availableFrom?: string; // Time in HH:mm format when item becomes available (e.g., "12:00")

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'availableTo must be in HH:mm format (e.g., "22:00", "23:30")',
  })
  availableTo?: string; // Time in HH:mm format when item stops being available (e.g., "22:00")

  @IsUUID()
  restaurantId: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantOptionDto)
  variantOptions?: VariantOptionDto[];
}
