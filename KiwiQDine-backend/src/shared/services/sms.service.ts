import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly apiUrl = 'https://app.notify.lk/api/v1';

    constructor(private configService: ConfigService) { }

    /**
     * Send OTP SMS to customer phone number
     */
    async sendOTP(phoneNumber: string, otp: string): Promise<void> {
        this.logger.log(`========== SMS SENDING STARTED ==========`);

        const userId = this.configService.get('NOTIFY_LK_USER_ID');
        const apiKey = this.configService.get('NOTIFY_LK_API_KEY');
        const senderId = this.configService.get('NOTIFY_LK_SENDER_ID', 'DineSoon');

        this.logger.log(`📋 SMS Configuration Check:`);
        this.logger.log(`  - User ID: ${userId ? '✅ Configured' : '❌ Missing'}`);
        this.logger.log(`  - API Key: ${apiKey ? '✅ Configured' : '❌ Missing'}`);
        this.logger.log(`  - Sender ID: ${senderId}`);
        this.logger.log(`  - API URL: ${this.apiUrl}`);

        if (!userId || !apiKey) {
            this.logger.error('❌ Notify.lk credentials not configured in environment variables');
            this.logger.error('Required: NOTIFY_LK_USER_ID and NOTIFY_LK_API_KEY');
            throw new BadRequestException('SMS service not configured');
        }

        // Format phone number (remove +94 and add 0)
        const formattedPhone = this.formatPhoneNumber(phoneNumber);
        this.logger.log(`📱 Phone Number Formatting:`);
        this.logger.log(`  - Original: ${phoneNumber}`);
        this.logger.log(`  - Formatted: ${formattedPhone}`);

        const message = `Your DineSoon verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
        this.logger.log(`📝 SMS Message: ${message}`);
        this.logger.log(`📏 Message Length: ${message.length} characters`);

        const requestParams = {
            user_id: userId,
            api_key: apiKey,
            sender_id: senderId,
            to: formattedPhone,
            message: message,
        };

        this.logger.log(`🌐 API Request Details:`);
        this.logger.log(`  - URL: ${this.apiUrl}/send`);
        this.logger.log(`  - Method: GET`);
        this.logger.log(`  - Params: ${JSON.stringify({ ...requestParams, api_key: '***HIDDEN***' })}`);

        try {
            this.logger.log(`📤 Sending SMS request to Notify.lk...`);

            const response = await axios.get(`${this.apiUrl}/send`, {
                params: requestParams,
                timeout: 10000, // 10 second timeout
            });

            this.logger.log(`📥 Response received from Notify.lk:`);
            this.logger.log(`  - Status Code: ${response.status}`);
            this.logger.log(`  - Response Data: ${JSON.stringify(response.data)}`);

            if (response.data.status === 'success') {
                this.logger.log(`✅ OTP SMS sent successfully to ${formattedPhone}`);
                this.logger.log(`  - Message ID: ${response.data.data?.message_id || 'N/A'}`);
                this.logger.log(`  - Cost: ${response.data.data?.cost || 'N/A'}`);
            } else {
                this.logger.error(`❌ Notify.lk returned non-success status:`);
                this.logger.error(`  - Status: ${response.data.status}`);
                this.logger.error(`  - Message: ${response.data.message || 'No message'}`);
                this.logger.error(`  - Full Response: ${JSON.stringify(response.data)}`);
                throw new BadRequestException(`Failed to send OTP: ${response.data.message || 'Unknown error'}`);
            }
        } catch (error) {
            this.logger.error(`========== SMS SENDING FAILED ==========`);
            this.logger.error(`❌ Error Type: ${error.constructor.name}`);
            this.logger.error(`❌ Error Message: ${error.message}`);

            if (error.response) {
                this.logger.error(`📥 Error Response from Notify.lk:`);
                this.logger.error(`  - Status Code: ${error.response.status}`);
                this.logger.error(`  - Response Data: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                this.logger.error(`📡 No response received from Notify.lk`);
                this.logger.error(`  - Request was made but no response`);
                this.logger.error(`  - Possible network issue or timeout`);
            } else {
                this.logger.error(`⚙️ Error setting up request: ${error.message}`);
            }

            this.logger.error(`Stack Trace: ${error.stack}`);
            this.logger.error(`========================================`);

            throw new BadRequestException(`Failed to send OTP. Please try again. Error: ${error.message}`);
        }

        this.logger.log(`========== SMS SENDING COMPLETED ==========`);
    }

    /**
     * Send generic SMS message
     */
    async sendSMS(phoneNumber: string, message: string): Promise<void> {
        this.logger.log(`========== SMS SENDING STARTED ==========`);

        const userId = this.configService.get('NOTIFY_LK_USER_ID');
        const apiKey = this.configService.get('NOTIFY_LK_API_KEY');
        const senderId = this.configService.get('NOTIFY_LK_SENDER_ID', 'DineSoon');

        this.logger.log(`📋 SMS Configuration Check:`);
        this.logger.log(`  - User ID: ${userId ? '✅ Configured' : '❌ Missing'}`);
        this.logger.log(`  - API Key: ${apiKey ? '✅ Configured' : '❌ Missing'}`);
        this.logger.log(`  - Sender ID: ${senderId}`);

        if (!userId || !apiKey) {
            this.logger.error('❌ Notify.lk credentials not configured');
            throw new BadRequestException('SMS service not configured');
        }

        const formattedPhone = this.formatPhoneNumber(phoneNumber);
        this.logger.log(`📱 Phone: ${phoneNumber} → ${formattedPhone}`);
        this.logger.log(`📝 Message: ${message}`);

        const requestParams = {
            user_id: userId,
            api_key: apiKey,
            sender_id: senderId,
            to: formattedPhone,
            message: message,
        };

        try {
            this.logger.log(`📤 Sending SMS to Notify.lk...`);

            const response = await axios.get(`${this.apiUrl}/send`, {
                params: requestParams,
                timeout: 10000,
            });

            this.logger.log(`📥 Response: ${JSON.stringify(response.data)}`);

            if (response.data.status === 'success') {
                this.logger.log(`✅ SMS sent successfully to ${formattedPhone}`);
            } else {
                this.logger.error(`❌ Notify.lk error: ${response.data.message || 'Unknown'}`);
                throw new BadRequestException(`Failed to send SMS: ${response.data.message || 'Unknown error'}`);
            }
        } catch (error) {
            this.logger.error(`❌ SMS sending failed: ${error.message}`);
            if (error.response) {
                this.logger.error(`Response: ${JSON.stringify(error.response.data)}`);
            }
            throw new BadRequestException(`Failed to send SMS: ${error.message}`);
        }

        this.logger.log(`========== SMS SENDING COMPLETED ==========`);
    }

    /**
     * Format phone number for Sri Lankan numbers
     * Notify.lk requires 11 digits: 94XXXXXXXXX (country code + 9 digits)
     * Converts various formats to 94XXXXXXXXX:
     * - +94771234567 -> 94771234567
     * - 0771234567 -> 94771234567
     * - 771234567 -> 94771234567
     */
    private formatPhoneNumber(phoneNumber: string): string {
        const cleaned = phoneNumber.replace(/\D/g, '');

        if (cleaned.startsWith('64')) {
            return cleaned;
        }

        if (cleaned.startsWith('0')) {
            return '64' + cleaned.substring(1);
        }

        return cleaned;
    }

    /**
     * Check Notify.lk account status and balance
     */
    async checkAccountStatus(): Promise<{ active: boolean; balance: number }> {
        const userId = this.configService.get('NOTIFY_LK_USER_ID');
        const apiKey = this.configService.get('NOTIFY_LK_API_KEY');

        if (!userId || !apiKey) {
            throw new BadRequestException('SMS service not configured');
        }

        try {
            const response = await axios.get(`${this.apiUrl}/status`, {
                params: {
                    user_id: userId,
                    api_key: apiKey,
                },
            });

            if (response.data.status === 'success') {
                return {
                    active: response.data.data.active,
                    balance: response.data.data.acc_balance,
                };
            } else {
                throw new BadRequestException('Failed to check account status');
            }
        } catch (error) {
            this.logger.error('Error checking account status:', error.message);
            throw new BadRequestException('Failed to check SMS service status');
        }
    }
}
