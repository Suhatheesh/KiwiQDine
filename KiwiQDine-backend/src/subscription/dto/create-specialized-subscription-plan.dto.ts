import { IsArray, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateSubscriptionPlanDto } from './create-subscription-plan.dto';

export class CreateSpecializedSubscriptionPlanDto {
  @ApiProperty({ type: CreateSubscriptionPlanDto })
  @ValidateNested()
  @Type(() => CreateSubscriptionPlanDto)
  plan: CreateSubscriptionPlanDto;

  @ApiProperty({ type: [String], description: 'Array of tenant IDs' })
  @IsArray()
  @IsString({ each: true })
  tenantIds: string[];
}
