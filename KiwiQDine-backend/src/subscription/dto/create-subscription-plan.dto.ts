import { Type } from 'class-transformer';
import { IsString, IsOptional, IsEnum, Matches, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PlanBillingCycle,
  SubscriptionPlanStatus,
} from '../../infrastructure/database/entities/subscription-plan.entity';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Pro', description: 'Display name of the subscription plan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'pro', description: 'Unique code for the subscription plan' })
  @IsString()
  @Matches(/^[a-z0-9-_]+$/i, {
    message: 'code must be alphanumeric with optional dashes or underscores',
  })
  code: string;

  @ApiPropertyOptional({ example: 'Plan suitable for mid-sized restaurants' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 79.99, description: 'Monthly price in dollars' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  priceMonthly?: number;

  @ApiPropertyOptional({ example: 799.99, description: 'Yearly price in dollars' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  priceYearly?: number;

  @ApiPropertyOptional({ example: 17, description: 'Percentage saved when paying yearly' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  yearlySavingsPercent?: number;

  @ApiPropertyOptional({ enum: SubscriptionPlanStatus, description: 'Plan availability status' })
  @IsOptional()
  @IsEnum(SubscriptionPlanStatus)
  status?: SubscriptionPlanStatus;

  @ApiProperty({ enum: PlanBillingCycle, description: 'Primary billing cycle for the plan', example: PlanBillingCycle.MONTHLY })
  @IsEnum(PlanBillingCycle)
  billingCycle: PlanBillingCycle;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of feature highlights shown for this plan',
    example: ['Up to 30 tables', 'Up to 200 menu items', 'Advanced QR codes'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Order for plan display', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({
    example: 150,
    description: 'Maximum number of orders/invoices allowed per month (null or 0 = unlimited)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 0 })
  orderLimit?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Maximum number of QR codes allowed (null or 0 = unlimited)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 0 })
  qrLimit?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Maximum number of users allowed (null or 0 = unlimited)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 0 })
  userLimit?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum number of tables allowed (null or 0 = unlimited)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 0 })
  tableLimit?: number;

  @ApiPropertyOptional({
    example: 40,
    description: 'Overage charge per additional invoice/order (in NZD or USD)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  overageChargePerInvoice?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'Overage charge per additional user per month (in USD)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  overageChargePerUser?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Overage charge per additional QR code (in USD)'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  overageChargePerQR?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Overage charge per additional table (in USD)'
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  overageChargePerTable?: number;

  @ApiPropertyOptional({ type: Boolean, description: 'Is this a specialized plan?' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSpecializedPlan?: boolean;

  @ApiPropertyOptional({ type: String, description: 'Tenant ID for specialized plan' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

