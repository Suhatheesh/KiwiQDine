import { Injectable, BadRequestException, Logger } from '@nestjs/common';

interface OTPRecord {
    otp: string;
    phoneNumber: string;
    expiresAt: Date;
    attempts: number;
}

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);
    private otpStore = new Map<string, OTPRecord>();
    private readonly OTP_EXPIRY_MINUTES = 5;
    private readonly MAX_ATTEMPTS = 3;

    /**
     * Generate OTP for testing only
     */
    async generateAndSendOTP(phoneNumber: string): Promise<{ message: string; expiresIn: number }> {
        if (!this.isValidPhoneNumber(phoneNumber)) {
            throw new BadRequestException('Invalid phone number format. Use 0211234567');
        }

        const otp = '123456';

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

        this.otpStore.set(phoneNumber, {
            otp,
            phoneNumber,
            expiresAt,
            attempts: 0,
        });

        console.log(`TEST OTP for ${phoneNumber}: ${otp}`);

        return {
            message: `Test OTP generated. Use 123456`,
            expiresIn: this.OTP_EXPIRY_MINUTES * 60,
        };
    }

    /**
     * Verify OTP
     */
    async verifyOTP(phoneNumber: string, otp: string): Promise<{ verified: boolean; message: string }> {
        const record = this.otpStore.get(phoneNumber);

        if (!record) {
            throw new BadRequestException('No OTP found for this phone number. Please request a new OTP.');
        }

        if (new Date() > record.expiresAt) {
            this.otpStore.delete(phoneNumber);
            throw new BadRequestException('OTP has expired. Please request a new OTP.');
        }

        if (record.attempts >= this.MAX_ATTEMPTS) {
            this.otpStore.delete(phoneNumber);
            throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP.');
        }

        record.attempts++;

        if (otp === '123456') {
            this.otpStore.delete(phoneNumber);
            return {
                verified: true,
                message: 'Phone number verified successfully',
            };
        }

        const attemptsLeft = this.MAX_ATTEMPTS - record.attempts;
        throw new BadRequestException(`Invalid OTP. ${attemptsLeft} attempt(s) remaining.`);
    }

    private isValidPhoneNumber(phoneNumber: string): boolean {
        const cleaned = phoneNumber.replace(/\D/g, '');

        if (cleaned.startsWith('64') && cleaned.length >= 10 && cleaned.length <= 11) {
            return true;
        }

        if (cleaned.startsWith('0') && cleaned.length === 10) {
            return true;
        }

        return false;
    }
}