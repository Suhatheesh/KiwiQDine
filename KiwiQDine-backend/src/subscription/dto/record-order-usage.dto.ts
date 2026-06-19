import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordOrderUsageDto {
  @ApiProperty({ example: 1, minimum: 1, description: 'Number of orders to add to the tally' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  count: number;

  @ApiPropertyOptional({ description: 'Order date in ISO 8601 format', example: '2025-11-01' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

