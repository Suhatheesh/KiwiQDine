import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBadgeDto {
  @ApiProperty({ description: 'Display name of the badge', example: "Chef's Special" })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Unique code for the badge (lowercase, underscores allowed)', example: 'chef_special' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'Code must start with a letter and contain only lowercase letters, numbers, and underscores',
  })
  code: string;

  @ApiPropertyOptional({ description: 'Description of when to use this badge' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon name or URL', example: 'fire' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Background color (hex)', example: '#FF5722' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Background color must be a valid hex color (e.g., #FF5722)' })
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Text color (hex)', example: '#FFFFFF' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Text color must be a valid hex color (e.g., #FFFFFF)' })
  textColor?: string;

  @ApiPropertyOptional({ description: 'Display order (lower = higher priority)', example: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Whether badge is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBadgeDto {
  @ApiPropertyOptional({ description: 'Display name of the badge' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of when to use this badge' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon name or URL' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Background color (hex)' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Background color must be a valid hex color (e.g., #FF5722)' })
  backgroundColor?: string;

  @ApiPropertyOptional({ description: 'Text color (hex)' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Text color must be a valid hex color (e.g., #FFFFFF)' })
  textColor?: string;

  @ApiPropertyOptional({ description: 'Display order (lower = higher priority)' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Whether badge is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BadgeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  restaurantId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiProperty()
  backgroundColor: string;

  @ApiProperty()
  textColor: string;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
