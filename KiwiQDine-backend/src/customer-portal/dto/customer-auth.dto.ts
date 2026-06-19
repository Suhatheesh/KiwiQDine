import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';

export class SendCustomerOtpDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^(\+64|0)?[0-9]{8,10}$/, {
        message: 'Phone number must be a valid New Zealand number (e.g., +642112345678 or 02112345678)',
    })
    phoneNumber: string;

    @IsString()
    @IsOptional()
    name?: string;
}

export class VerifyCustomerOtpDto {
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9]{6}$/, {
        message: 'OTP must be a 6-digit number',
    })
    otp: string;

    @IsString()
    @IsOptional()
    name?: string;
}

export class RefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
