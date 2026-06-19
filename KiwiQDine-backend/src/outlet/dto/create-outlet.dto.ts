import { IsString, IsOptional, IsObject, IsEmail, ValidateNested, IsEnum, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OutletAddressDto {
  @ApiPropertyOptional({ description: 'Lane or street where the outlet is located', example: '42 Elm Street' })
  @IsOptional()
  @IsString()
  lane?: string;

  @ApiPropertyOptional({ description: 'City of the outlet', example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'District or state of the outlet', example: 'Manhattan' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Country of the outlet', example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class CreateOutletDto {
  @ApiProperty({ description: 'Name of the outlet', example: 'Downtown Dining' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Structured address of the outlet', type: () => OutletAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OutletAddressDto)
  address?: OutletAddressDto;

  @ApiPropertyOptional({ description: 'Logo URL of the outlet', example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Contact email for the outlet', example: 'contact@downtowndining.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone number for the outlet', example: '+94778030468' })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'contactPhoneNumber must be a valid phone number in E.164 format (e.g., +94778030468)',
  })
  contactPhoneNumber?: string;

  @ApiPropertyOptional({ description: 'Opening time of the outlet', example: '09:00' })
  @IsOptional()
  @IsString()
  openTime?: string;

  @ApiPropertyOptional({ description: 'Closing time of the outlet', example: '22:00' })
  @IsOptional()
  @IsString()
  closeTime?: string;

  @ApiPropertyOptional({
    description: 'Detailed opening hours for each day',
    example: { Monday: '09:00-21:00', Tuesday: '09:00-21:00' },
  })
  @IsOptional()
  @IsObject()
  openHours?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Payment timing option for the outlet',
    enum: ['pay_at_first', 'pay_at_last'],
    example: 'pay_at_last',
  })
  @IsOptional()
  @IsEnum(['pay_at_first', 'pay_at_last'])
  paymentTiming?: 'pay_at_first' | 'pay_at_last';

  @ApiPropertyOptional({ description: 'Banner URL of the outlet', example: 'https://cdn.example.com/banner.png' })
  @IsOptional()
  @IsString()
  banner?: string;
}
