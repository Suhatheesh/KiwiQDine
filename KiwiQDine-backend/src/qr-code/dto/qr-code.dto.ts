import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QRCodeType } from '../../infrastructure/database/entities';

export class CreateQRCodeDto {
  @IsEnum(QRCodeType)
  type: QRCodeType;

  @IsOptional()
  @IsUUID()
  restaurantId?: string;


  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateQRCodeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
