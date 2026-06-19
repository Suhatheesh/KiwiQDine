import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDTO {
  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  imageKey?: string;

  @IsOptional()
  displayOrder?: number;

  @IsOptional()
  isShowcase?: boolean;

  @IsOptional()
  isActive?: boolean;
}
