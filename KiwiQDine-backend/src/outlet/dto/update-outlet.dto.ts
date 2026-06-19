import { IsString, IsOptional, IsObject, IsEmail, ValidateNested, IsEnum, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

class BankDetailsDto {
  @ApiPropertyOptional({ description: 'Bank name', example: 'Bank of Example' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Account holder name', example: 'Example Holdings Ltd.' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({ description: 'Account number', example: '1234567890' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Branch name', example: 'Main Branch' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ description: 'IBAN number', example: 'GB29NWBK60161331926819' })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({ description: 'SWIFT code', example: 'NWBKGB2L' })
  @IsOptional()
  @IsString()
  swiftCode?: string;
}

export class UpdateOutletDto {
  @ApiPropertyOptional({ description: 'Updated outlet name', example: 'Downtown Dining - East' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Updated structured address for the outlet', type: () => OutletAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OutletAddressDto)
  address?: OutletAddressDto;

  @ApiPropertyOptional({ description: 'Updated logo URL for the outlet', example: 'https://cdn.example.com/logo-new.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'Updated contact email for the outlet', example: 'hello@downtowndining.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Updated contact phone number for the outlet', example: '+94778030468' })
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'contactPhoneNumber must be a valid phone number in E.164 format (e.g., +94778030468)',
  })
  contactPhoneNumber?: string;

  @ApiPropertyOptional({ description: 'Updated opening time', example: '08:30' })
  @IsOptional()
  @IsString()
  openTime?: string;

  @ApiPropertyOptional({ description: 'Updated closing time', example: '23:00' })
  @IsOptional()
  @IsString()
  closeTime?: string;

  @ApiPropertyOptional({
    description: 'Updated detailed opening hours for each day',
    example: { Monday: '08:30-22:30', Friday: '08:30-23:30' },
  })
  @IsOptional()
  @IsObject()
  openHours?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Updated payment timing option for the outlet',
    enum: ['pay_at_first', 'pay_at_last'],
    example: 'pay_at_last',
  })
  @IsOptional()
  @IsEnum(['pay_at_first', 'pay_at_last'])
  paymentTiming?: 'pay_at_first' | 'pay_at_last';

  @ApiPropertyOptional({ description: 'Bank details for payouts', type: () => BankDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto | null;

  @ApiPropertyOptional({ description: 'Primary brand color', example: '#2563EB' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Secondary brand color', example: '#1E40AF' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Tertiary brand color', example: '#DBEAFE' })
  @IsOptional()
  @IsString()
  tertiaryColor?: string;

  @ApiPropertyOptional({ description: 'Updated banner URL for the outlet', example: 'https://cdn.example.com/banner-new.png' })
  @IsOptional()
  @IsString()
  banner?: string;
}
