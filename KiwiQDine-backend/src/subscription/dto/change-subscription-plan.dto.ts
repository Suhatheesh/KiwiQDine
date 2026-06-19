import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { BillingCycle } from '../../infrastructure/database/entities';

export class ChangeSubscriptionPlanDto {
  @ApiProperty({
    description: 'ID of the new subscription plan',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  newPlanId: string;

  @ApiPropertyOptional({
    description: 'Reason for changing the plan',
    example: 'Restaurant requested upgrade due to increased order volume'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Billing cycle for the new plan',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY
  })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;
}
