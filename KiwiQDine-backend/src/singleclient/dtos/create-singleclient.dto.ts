import { IsEmail, IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateSingleClientDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  readonly password: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  readonly role?: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  readonly firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  readonly lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  readonly organisationName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  readonly phoneNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  readonly organisationAddress?: string;
}
