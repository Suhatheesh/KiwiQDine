import { IsString, IsInt, IsOptional, IsObject, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TableStatus } from '../../infrastructure/database/entities';

export class UpdateTableDto {
  @ApiPropertyOptional({
    description: 'Table name (unique per restaurant)',
    example: 'Window Table 1',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Table number/identifier',
    example: 'T-01',
  })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiPropertyOptional({
    description: 'Number of seats/capacity',
    example: 4,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Table location information (JSON object)',
    example: { section: 'Window Area', floor: 1, coordinates: { x: 10, y: 20 } },
  })
  @IsOptional()
  @IsObject()
  location?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Table booking status',
    enum: TableStatus,
    example: TableStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;

  // Accept but ignore 'type' field from frontend for backward compatibility
  @ApiPropertyOptional({
    description: 'Table type (ignored, for backward compatibility)',
    example: 'TABLE',
  })
  @IsOptional()
  @IsString()
  type?: string;
}

