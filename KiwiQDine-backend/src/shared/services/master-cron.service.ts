import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GracePeriodCronService } from '../../subscription/grace-period-cron.service';
import { SubscriptionRenewalCronService } from '../../subscription/subscription-renewal-cron.service';
import { InvoiceSchedulerService } from '../../invoice/invoice-scheduler.service';

@Injectable()
export class MasterCronService {
  private readonly logger = new Logger(MasterCronService.name);

  constructor(
    private readonly gracePeriodCronService: GracePeriodCronService,
    private readonly subscriptionRenewalCronService: SubscriptionRenewalCronService,
    private readonly invoiceSchedulerService: InvoiceSchedulerService,
  ) {}

  /**
   * Master cron job that runs all subscription and invoice tasks in order
   * Runs twice a day at 00:00 and 12:00 Sri Lankan time
   */
  @Cron('0 0,12 * * *', { name: 'masterCronJob', timeZone: 'Asia/Colombo' })
  async handleMasterCron() {
    this.logger.log('=== Starting Master Cron Job ===');

    try {
      // 1. Handle grace period start
      this.logger.log('Step 1/5: Running handleGracePeriodStart...');
      await this.gracePeriodCronService.handleGracePeriodStart();
      this.logger.log('Step 1/5: Completed handleGracePeriodStart');

      // 2. Handle grace period expiration
      this.logger.log('Step 2/5: Running handleGracePeriodExpiration...');
      await this.gracePeriodCronService.handleGracePeriodExpiration();
      this.logger.log('Step 2/5: Completed handleGracePeriodExpiration');

      // 3. Handle subscription renewals
      this.logger.log('Step 3/5: Running handleSubscriptionRenewalCron...');
      await this.subscriptionRenewalCronService.handleSubscriptionRenewalCron();
      this.logger.log('Step 3/5: Completed handleSubscriptionRenewalCron');

      // 4. Generate invoices for due subscriptions
      this.logger.log('Step 4/5: Running generateInvoicesForDueSubscriptions...');
      await this.invoiceSchedulerService.generateInvoicesForDueSubscriptions();
      this.logger.log('Step 4/5: Completed generateInvoicesForDueSubscriptions');

      // 5. Generate overage invoices for ending subscriptions
      this.logger.log('Step 5/5: Running generateOverageInvoicesForEndingSubscriptions...');
      await this.invoiceSchedulerService.generateOverageInvoicesForEndingSubscriptions();
      this.logger.log('Step 5/5: Completed generateOverageInvoicesForEndingSubscriptions');

      this.logger.log('=== Master Cron Job Completed Successfully ===');
    } catch (error) {
      this.logger.error(`Master cron job failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
