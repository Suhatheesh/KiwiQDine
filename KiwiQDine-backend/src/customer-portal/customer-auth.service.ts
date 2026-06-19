import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Customer } from '../infrastructure/database/entities/customer.entity';
import { SmsService } from '../shared/services/sms.service';

// In-memory OTP storage (for production, use Redis)
interface OTPRecord {
    otp: string;
    phoneNumber: string;
    name?: string;
    expiresAt: Date;
    attempts: number;
}

@Injectable()
export class CustomerAuthService {
    private readonly logger = new Logger(CustomerAuthService.name);
    private otpStore = new Map<string, OTPRecord>();
    private readonly OTP_EXPIRY_MINUTES = 5;
    private readonly MAX_ATTEMPTS = 3;

    constructor(
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private smsService: SmsService,
    ) {
        // Clean up expired OTPs every minute
        setInterval(() => this.cleanupExpiredOTPs(), 60000);
    }

    /**
   * Generate and store OTP (without sending SMS for now)
   * Allows multiple OTP requests for same phone number with different names
   */
    async generateOTP(phoneNumber: string, name?: string): Promise<{ otp: string; expiresIn: number }> {
        // Validate phone number format
        if (!this.isValidPhoneNumber(phoneNumber)) {
            throw new BadRequestException('Invalid phone number format. Use format: +647712345678 or 02112345678');
        }

        // Generate 6-digit OTP
        const otp = this.generateOTPCode();

        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

        // Check if there's an existing OTP for this phone number
        const existingOTP = this.otpStore.get(phoneNumber);

        if (existingOTP) {
            // Allow resending OTP - update with new OTP and name
            this.logger.log(`Resending OTP for ${phoneNumber} (name updated from "${existingOTP.name}" to "${name}")`);
        }

        // Store OTP (overwrites existing if any - allows name updates)
        this.otpStore.set(phoneNumber, {
            otp,
            phoneNumber,
            name, // Name can be different each time
            expiresAt,
            attempts: 0,
        });

        this.logger.log(`Generated OTP for ${phoneNumber}: ${otp} (expires at ${expiresAt.toISOString()})`);

        // Send OTP via SMS
        await this.smsService.sendOTP(phoneNumber, otp);

        return {
            otp, // In production, don't return this - send via SMS
            expiresIn: this.OTP_EXPIRY_MINUTES * 60, // in seconds
        };
    }

    /**
     * Verify OTP and generate JWT tokens
     */
    async verifyOTPAndGenerateTokens(
        phoneNumber: string,
        otp: string,
        name?: string,
    ): Promise<{
        verified: boolean;
        accessToken: string;
        refreshToken: string;
        customer: Partial<Customer>;
    }> {
        const record = this.otpStore.get(phoneNumber);

        if (!record) {
            throw new BadRequestException('No OTP found for this phone number. Please request a new OTP.');
        }

        // Check if OTP has expired
        if (new Date() > record.expiresAt) {
            this.otpStore.delete(phoneNumber);
            throw new BadRequestException('OTP has expired. Please request a new OTP.');
        }

        // Check max attempts
        if (record.attempts >= this.MAX_ATTEMPTS) {
            this.otpStore.delete(phoneNumber);
            throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP.');
        }

        // Increment attempts
        record.attempts++;

        // Verify OTP
        if (record.otp !== otp) {
            const attemptsLeft = this.MAX_ATTEMPTS - record.attempts;
            this.logger.warn(`Invalid OTP attempt for ${phoneNumber}. Attempts left: ${attemptsLeft}`);

            throw new BadRequestException(
                `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`
            );
        }

        // OTP is correct - remove from store
        this.otpStore.delete(phoneNumber);
        this.logger.log(`OTP verified successfully for ${phoneNumber}`);

        // Find or create customer
        let customer = await this.customerRepository.findOne({
            where: { phone: phoneNumber },
        });

        if (!customer) {
            // Create new customer
            customer = this.customerRepository.create({
                phone: phoneNumber,
                name: name || record.name || 'Customer',
            });
            customer = await this.customerRepository.save(customer);
            this.logger.log(`Created new customer: ${customer.id} (${phoneNumber})`);
        } else {
            // Update name if provided
            if (name && customer.name !== name) {
                customer.name = name;
                await this.customerRepository.save(customer);
            }
            this.logger.log(`Found existing customer: ${customer.id} (${phoneNumber})`);
        }

        // Generate JWT tokens
        const tokens = await this.generateTokens(customer);

        // Hash and store refresh token
        const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
        customer.refreshTokenHash = refreshTokenHash;
        await this.customerRepository.save(customer);

        return {
            verified: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            customer: {
                id: customer.id,
                phone: customer.phone,
                name: customer.name,
                createdAt: customer.createdAt,
            },
        };
    }

    /**
     * Generate JWT access and refresh tokens for customer
     */
    private async generateTokens(customer: Customer): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        const payload = {
            sub: customer.id,
            phone: customer.phone,
            name: customer.name,
            type: 'customer',
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
                expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME', '1h'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME', '7d'),
            }),
        ]);

        return { accessToken, refreshToken };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            // Verify refresh token
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
            });

            // Find customer
            const customer = await this.customerRepository.findOne({
                where: { id: payload.sub },
            });

            if (!customer) {
                throw new BadRequestException('Customer not found');
            }

            // Verify refresh token hash
            if (!customer.refreshTokenHash) {
                throw new BadRequestException('No refresh token found');
            }

            const isValid = await bcrypt.compare(refreshToken, customer.refreshTokenHash);
            if (!isValid) {
                throw new BadRequestException('Invalid refresh token');
            }

            // Generate new access token
            const newPayload = {
                sub: customer.id,
                phone: customer.phone,
                name: customer.name,
                type: 'customer',
            };

            const accessToken = await this.jwtService.signAsync(newPayload, {
                secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
                expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME', '1h'),
            });

            return { accessToken };
        } catch (error) {
            throw new BadRequestException('Invalid or expired refresh token');
        }
    }

    /**
     * Generate 6-digit OTP
     */
    private generateOTPCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Validate Sri Lankan phone number format
     */
    private isValidPhoneNumber(phoneNumber: string): boolean {
        // Remove all non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');

        // Check if it's a valid Sri Lankan number
        // Format: +94771234567 (11 digits: 94 + 9 digits) or 0771234567 (10 digits)
        if (cleaned.length === 11 && cleaned.startsWith('94')) {
            return true;
        }
        if (cleaned.length === 10 && cleaned.startsWith('0')) {
            return true;
        }

        return false;
    }

    /**
     * Clean up expired OTPs
     */
    private cleanupExpiredOTPs(): void {
        const now = new Date();
        let cleaned = 0;

        for (const [phoneNumber, record] of this.otpStore.entries()) {
            if (now > record.expiresAt) {
                this.otpStore.delete(phoneNumber);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.log(`Cleaned up ${cleaned} expired OTP(s)`);
        }
    }
}
