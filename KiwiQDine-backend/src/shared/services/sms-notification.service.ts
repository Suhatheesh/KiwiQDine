import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

@Injectable()
export class SmsNotificationService {
    private readonly logger = new Logger(SmsNotificationService.name);

    constructor(
        private configService: ConfigService,
        private smsService: SmsService,
    ) { }

    /**
     * Send order ready notification to customer
     */
    async sendOrderReadyNotification(
        customerPhone: string,
        customerName: string,
        orderNumber: string,
    ): Promise<void> {
        const message = this.generateOrderReadyMessage(customerName, orderNumber);

        this.logger.log(`[SMS] Sending order ready notification:`);
        this.logger.log(`  To: ${customerPhone}`);
        this.logger.log(`  Customer: ${customerName}`);
        this.logger.log(`  Order: ${orderNumber}`);
        this.logger.log(`  Message: ${message}`);

        try {
            // Send SMS via Notify.lk
            await this.smsService.sendSMS(customerPhone, message);
            this.logger.log(`✅ Order ready SMS sent successfully to ${customerPhone}`);
        } catch (error) {
            this.logger.error(`❌ Failed to send order ready SMS: ${error.message}`);
            this.logger.error(`Error Stack: ${error.stack}`);
            // Don't throw - log error but don't fail the order status update
        }
    }

    /**
     * Generate personalized order ready message
     */
    private generateOrderReadyMessage(customerName: string, orderNumber: string): string {
        return `Hi ${customerName}! 🎉 Your order ${orderNumber} is ready! You can collect it now. Check live updates on DineSoon app. Thank you!`;
    }
}
