
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber, IsArray, ArrayMinSize } from 'class-validator';

export class CreateAddonDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  readonly name: string;

  @IsNumber()
  @IsNotEmpty()
  readonly quantity: number;

  @IsNumber()
  @IsNotEmpty()
  readonly unitPrice: number;

  @IsString()
  @MaxLength(256)
  @IsOptional()
  readonly description: string;

  @IsString()
  @IsOptional()
  readonly image?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one menu item must be selected' })
  @IsString({ each: true })
  menuIds: string[];
}
