import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CustomerVerificationDto {
  @ApiProperty({ 
    description: 'Customer phone number (E.164 format, e.g., +1234567890)',
    example: '+1234567890'
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ 
    description: 'Customer full name',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  customerName: string;
}

