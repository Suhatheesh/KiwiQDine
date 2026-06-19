import { IsString, IsNotEmpty, Length, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateCategoryDTO {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ example: 'restaurant-uuid', description: 'Owning restaurant identifier' })
  restaurantId: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 256)
  @ApiProperty({ example: 'Starters', minLength: 2, maxLength: 256 })
  name: string;

  @IsString()
  @MaxLength(256)
  @IsOptional()
  @ApiPropertyOptional({ example: 'Light appetizers to begin the meal', maxLength: 256 })
  description: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'https://example.com/category-image.jpg', description: 'Optional category image URL' })
  image?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'categories/restaurant-id/image-name.jpg', description: 'Optional S3 key for the category image' })
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
