import { Controller, Post, Body } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { SendCustomerOtpDto, VerifyCustomerOtpDto, RefreshTokenDto } from './dto/customer-auth.dto';

@Controller('customer-portal/auth')
export class CustomerAuthController {
    constructor(private customerAuthService: CustomerAuthService) { }

    /**
     * Send OTP to customer phone number
     */
    @Post('send-otp')
    async sendOTP(@Body() sendOtpDto: SendCustomerOtpDto) {
        const result = await this.customerAuthService.generateOTP(
            sendOtpDto.phoneNumber,
            sendOtpDto.name,
        );

        return {
            message: `OTP sent to ${sendOtpDto.phoneNumber}. Valid for 5 minutes.`,
            expiresIn: result.expiresIn,
            // TODO: Remove this in production - OTP should only be sent via SMS
            otp: result.otp, // For development/testing only
        };
    }

    /**
     * Verify OTP and get JWT tokens
     */
    @Post('verify-otp')
    async verifyOTP(@Body() verifyOtpDto: VerifyCustomerOtpDto) {
        return await this.customerAuthService.verifyOTPAndGenerateTokens(
            verifyOtpDto.phoneNumber,
            verifyOtpDto.otp,
            verifyOtpDto.name,
        );
    }

    /**
     * Refresh access token
     */
    @Post('refresh')
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return await this.customerAuthService.refreshAccessToken(
            refreshTokenDto.refreshToken,
        );
    }
}
