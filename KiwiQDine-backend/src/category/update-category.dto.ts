import { IsString, IsOptional, Length, MaxLength, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDTO {
  @IsString()
  @IsOptional()
  @Length(2, 256)
  @ApiPropertyOptional({ example: 'Starters', minLength: 2, maxLength: 256 })
  name?: string;

  @IsString()
  @MaxLength(256)
  @IsOptional()
  @ApiPropertyOptional({ example: 'Light appetizers to begin the meal', maxLength: 256 })
  description?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  image?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'categories/restaurant-id/image-name.jpg' })
  imageKey?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 0 })
  displayOrder?: number;

  @IsOptional()
  @ApiPropertyOptional({ example: false })
  isShowcase?: boolean;

  @IsOptional()
  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}

