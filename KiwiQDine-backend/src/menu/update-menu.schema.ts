import { IsString, IsNumber, IsOptional, Min, IsUUID, IsArray, ValidateNested, IsBoolean, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { VariantOptionDto } from './create-menu.schema';

export class UpdateMenuDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  image?: string;

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

  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantOptionDto)
  variantOptions?: VariantOptionDto[];
}
