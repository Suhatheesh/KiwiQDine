import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsNumber,
  IsDate,
} from 'class-validator';
import {
  PlanBillingCycle,
  SubscriptionPlanStatus,
} from '../../infrastructure/database/entities/subscription-plan.entity';

export class GetSubscriptionPlanDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  priceMonthly: string;

  @ApiProperty()
  @IsString()
  priceYearly: string;

  @ApiProperty({ enum: SubscriptionPlanStatus })
  @IsEnum(SubscriptionPlanStatus)
  status: SubscriptionPlanStatus;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  order: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({ enum: PlanBillingCycle })
  @IsEnum(PlanBillingCycle)
  billingCycle: PlanBillingCycle;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearlySavingsPercent: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  orderLimit: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  qrLimit: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userLimit: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tableLimit: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  overageChargePerInvoice: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  overageChargePerUser: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  overageChargePerQR: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  overageChargePerTable: string | null;

  @ApiProperty()
  @Type(() => Boolean)
  @IsBoolean()
  isArchived: boolean;

  @ApiProperty()
  @Type(() => Boolean)
  @IsBoolean()
  isSpecializedPlan: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  specializedPlanId: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tenantIds?: string[] | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tenantNames?: string[] | null;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  updatedAt: Date;
}
