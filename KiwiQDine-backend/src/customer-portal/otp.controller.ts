import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from '../shared/services/otp.service';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';

@Controller('customer-portal/otp')
export class OtpController {
    constructor(private otpService: OtpService) { }

    /**
     * Send OTP to customer phone number
     */
    @Post('send')
    async sendOTP(@Body() sendOtpDto: SendOtpDto) {
        return await this.otpService.generateAndSendOTP(sendOtpDto.phoneNumber);
    }

    /**
     * Verify OTP for customer phone number
     */
    @Post('verify')
    async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto) {
        return await this.otpService.verifyOTP(
            verifyOtpDto.phoneNumber,
            verifyOtpDto.otp,
        );
    }
}
