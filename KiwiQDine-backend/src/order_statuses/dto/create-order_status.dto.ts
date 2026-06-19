import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderStatusDto {
  @ApiProperty({
    description: 'Display name for the order status',
    example: 'Pending',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 64)
  name: string;

  @ApiProperty({
    description: 'Unique code for the order status, recommended uppercase',
    example: 'PENDING',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 32)
  code: string;

  @ApiPropertyOptional({
    description: 'Optional description that explains when this status is used',
    example: 'Order has been received and is awaiting confirmation.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Flag indicating whether this status can be assigned to orders',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
