import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBankDetailsDto {
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
