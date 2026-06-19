import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsArray, IsNumber, IsString, IsBoolean } from 'class-validator';
import { CreateSubscriptionPlanDto } from './create-subscription-plan.dto';
import {
  PlanBillingCycle,
  SubscriptionPlanStatus,
} from '../../infrastructure/database/entities/subscription-plan.entity';

export class UpdateSubscriptionPlanDto extends PartialType(CreateSubscriptionPlanDto) {
  @ApiPropertyOptional({ enum: PlanBillingCycle })
  @IsOptional()
  @IsEnum(PlanBillingCycle)
  billingCycle?: PlanBillingCycle;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Monthly price in dollars' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMonthly?: number;

  @ApiPropertyOptional({ description: 'Yearly price in dollars' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceYearly?: number;

  @ApiPropertyOptional({ description: 'Percentage saved when paying yearly' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearlySavingsPercent?: number;

  @ApiPropertyOptional({ enum: SubscriptionPlanStatus })
  @IsOptional()
  @IsEnum(SubscriptionPlanStatus)
  status?: SubscriptionPlanStatus;

  @ApiPropertyOptional({ example: 'pro-plan', description: 'Plan code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Discounted annual price in dollars' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  annualPrice?: number;

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

  @ApiPropertyOptional({ type: Boolean, description: 'Archive this plan' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isArchived?: boolean;

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



