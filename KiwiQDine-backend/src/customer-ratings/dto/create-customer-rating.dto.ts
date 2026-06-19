import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsString, IsOptional, IsObject, ValidateIf } from 'class-validator';

export class CreateCustomerRatingDto {
  @ApiProperty({ description: 'Customer ID', format: 'uuid' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Restaurant ID', format: 'uuid' })
  @IsUUID()
  restaurantId: string;

  @ApiPropertyOptional({ description: 'Order ID (optional - if rating is for a specific order)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ description: 'Rating value (1-5)', minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Comment/review text', example: 'Great food and excellent service!' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (e.g., detailed ratings for food quality, service, ambiance)',
    example: {
      foodQuality: 5,
      service: 4,
      ambiance: 5,
      valueForMoney: 4,
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

