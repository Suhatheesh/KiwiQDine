import { IsString, IsInt, IsOptional, IsUUID, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty({
    description: 'Table name (unique per restaurant)',
    example: 'Window Table 1',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Table number/identifier',
    example: 'T-01',
  })
  @IsString()
  tableNumber: string;

  @ApiProperty({
    description: 'Number of seats/capacity',
    example: 4,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({
    description: 'Table location information (JSON object)',
    example: { section: 'Window Area', floor: 1, coordinates: { x: 10, y: 20 } },
  })
  @IsOptional()
  @IsObject()
  location?: Record<string, any>;

  @ApiProperty({
    description: 'Restaurant ID this table belongs to',
    format: 'uuid',
    example: 'restaurant-uuid',
  })
  @IsUUID()
  restaurantId: string;
}

