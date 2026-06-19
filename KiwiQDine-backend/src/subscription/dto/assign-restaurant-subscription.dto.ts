import { Type } from 'class-transformer';
import { IsUUID, IsEnum, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle } from '../../infrastructure/database/entities';

export class AssignRestaurantSubscriptionDto {
  @ApiProperty({ format: 'uuid', description: 'Restaurant identifier' })
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ format: 'uuid', description: 'Target subscription plan identifier' })
  @IsUUID()
  planId: string;

  @ApiPropertyOptional({ enum: BillingCycle, description: 'Billing cadence for the subscription' })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Auto renew setting for the subscription' })
  @IsOptional()
  @IsBoolean()
  isAutoRenew?: boolean;

  @ApiPropertyOptional({ description: 'Subscription start date in ISO 8601 format', type: String, example: '2025-01-01' })
  @IsOptional()
  @Type(() => String)
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Subscription end date in ISO 8601 format', type: String, example: '2025-12-31' })
  @IsOptional()
  @Type(() => String)
  @IsDateString()
  endDate?: string;
}

