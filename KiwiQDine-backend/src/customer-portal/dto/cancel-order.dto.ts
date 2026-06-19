import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({
    description: 'Reason for cancelling the order',
    example: 'Changed my mind',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

