import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrFindCustomerDto {
  @ApiProperty({
    description: 'Customer phone number (unique identifier)',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;
}
