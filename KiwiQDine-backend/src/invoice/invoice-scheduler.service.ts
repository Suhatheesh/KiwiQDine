import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

import { Invoice, InvoiceStatus, InvoiceType } from '../infrastructure/database/entities/invoice.entity';
import { RestaurantSubscription, RestaurantSubscriptionStatus } from '../infrastructure/database/entities/restaurant-subscription.entity';
import { SubscriptionPlanEntity } from '../infrastructure/database/entities/subscription-plan.entity';
import { S3Service } from '../shared/services/s3.service';
import { OrderUsage } from '@/infrastructure/database/entities';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvoiceSchedulerService {
  private readonly logger = new Logger(InvoiceSchedulerService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(RestaurantSubscription)
    private readonly subscriptionRepository: Repository<RestaurantSubscription>,
    @InjectRepository(OrderUsage)
    private readonly orderUsageRepository: Repository<OrderUsage>,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepository: Repository<SubscriptionPlanEntity>,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate invoices for subscriptions due in 3 days
   * Called by master cron job
   */
  async generateInvoicesForDueSubscriptions() { 
    const today = new Date();

    // Check if test duration is configured in environment
    const testDurationDaysStr = this.configService.get<string>('SUBSCRIPTION_INVOICE_TEST_DURATION_DAYS');
    const addDays = testDurationDaysStr ? parseInt(testDurationDaysStr, 10) : 3;

    const toBilling = parseInt(testDurationDaysStr, 10);
    
    // Calculate the target due date (3 days from today)
    const targetDueDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + addDays));
    const dueDateStr = `${targetDueDate.getUTCFullYear()}-${String(targetDueDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDueDate.getUTCDate()).padStart(2, '0')}`;

    // Find all active subscriptions whose endDate (due date) is 3 days from today
    const subscriptions = await this.subscriptionRepository.find({
      where: {
        status: RestaurantSubscriptionStatus.ACTIVE,
        endDate: dueDateStr,
      },
      relations: ['plan', 'restaurant'],
    });

    let generatedCount = 0;
    for (const sub of subscriptions) {
      // Invoice period: start = due date, end = due date + 1 month
      const startDate = new Date(targetDueDate);
      const endDate = toBilling ? new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() + toBilling)) : new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, startDate.getUTCDate()));
      const billingPeriod = this.getBillingPeriodForDates(startDate, endDate);
      
      // Check for existing invoice for this restaurant and billing period
      const existing = await this.invoiceRepository.findOne({
        where: {
          restaurantId: sub.restaurantId,
          billing_period: billingPeriod,
          restaurantSubscriptionId: sub.id,
          type: InvoiceType.SUBSCRIPTION
        },
      });
      if (existing) {
        this.logger.warn(`Invoice already exists for restaurant ${sub.restaurantId} for period ${billingPeriod} for restaurant subscription ${sub.id}. Skipping.`);
        continue;
      }

      const plan = sub.plan;
      let amount = 0, base_amount = 0, fees = 0;
      if (sub.billingCycle === 'monthly') {
        base_amount = Number(plan.priceMonthly) || 0;
      } else if (sub.billingCycle === 'yearly') {
        base_amount = Number(plan.priceYearly) || 0;
      }
      amount = base_amount + fees;

      // Generate invoiceName in format 'INV-YYYYMM' for the next month
      const yearMonth = `${startDate.getUTCFullYear()}${String(startDate.getUTCMonth() + 1).padStart(2, '0')}`;
      const invoiceName = `INV-${yearMonth}`;

      const invoice = this.invoiceRepository.create({
        invoiceName: invoiceName,
        restaurantId: sub.restaurantId,
        planId: plan.id,
        billing_period: billingPeriod,
        billing_period_start: `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}-${String(startDate.getUTCDate()).padStart(2, '0')}`,
        billing_period_end: `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`,
        amount,
        base_amount,
        fees,
        status: InvoiceStatus.PENDING,
        due_date: `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}-${String(startDate.getUTCDate()).padStart(2, '0')}`,
        paid_date: null,
        restaurantSubscriptionId: sub.id,
        type: InvoiceType.SUBSCRIPTION
      });
      const pdfBuffer = await this.generateInvoicePdf(invoice);
      const s3Key = `${invoiceName}.pdf`;
      const s3Url = await this.s3Service.uploadPdf(pdfBuffer, s3Key, invoice.restaurantId);
      invoice.invoiceAttachmentUrl = s3Url.url;
      await this.invoiceRepository.save(invoice);
      generatedCount++;
    }
    this.logger.log(`Generated ${generatedCount} invoices for subscriptions due on ${dueDateStr}`);
  }

	async generateInvoicePdf(invoiceData: any): Promise<Buffer> {
    const planDetails = await this.planRepository.findOne({ where: { id: invoiceData.planId } });
		return new Promise((resolve) => {
			const doc = new PDFDocument({ margin: 50 });
			const buffers: Uint8Array[] = [];
			doc.on('data', buffers.push.bind(buffers));
			doc.on('end', () => {
				resolve(Buffer.concat(buffers));
			});

			// Helper function to format date
			const formatDate = (dateStr: string): string => {
				if (!dateStr) return 'N/A';
				const date = new Date(dateStr);
				return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
			};

			// Helper function to format amount
			const formatAmount = (amount: number | string): string => {
				const num = typeof amount === 'string' ? parseFloat(amount) : amount;
				return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
			};

			// Header - INVOICE
			doc.fontSize(28).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
			doc.moveDown(2);

			// Company Info
			doc.fontSize(12).font('Helvetica-Bold').text('Dinesoon', { align: 'left' });
			//doc.fontSize(10).font('Helvetica').text('Restaurant Management System', { align: 'left' });
			doc.moveDown(1.5);

			// Invoice Details Table - Centered
			const detailsTableTop = doc.y;
			const pageWidth = doc.page.width;
			const tableWidth = 440; // Total width of both columns
			const col1Width = 190;
			const col2Width = 250;
			const col1X = (pageWidth - tableWidth) / 2;
			const col2X = col1X + col1Width;
			const rowHeight = 25;

			// Draw invoice details table
			doc.fontSize(10).font('Helvetica');
			
			// Row 1 - Invoice Number
			doc.rect(col1X, detailsTableTop, col1Width, rowHeight).stroke();
			doc.rect(col2X, detailsTableTop, col2Width, rowHeight).stroke();
			doc.font('Helvetica-Bold').text('Invoice Number:', col1X + 5, detailsTableTop + 8, { width: col1Width - 10 });
			doc.font('Helvetica').text(invoiceData.invoiceName || 'N/A', col2X + 5, detailsTableTop + 8, { width: col2Width - 10 });

			// Row 2 - Invoice Date
			doc.rect(col1X, detailsTableTop + rowHeight, col1Width, rowHeight).stroke();
			doc.rect(col2X, detailsTableTop + rowHeight, col2Width, rowHeight).stroke();
			doc.font('Helvetica-Bold').text('Invoice Date:', col1X + 5, detailsTableTop + rowHeight + 8, { width: col1Width - 10 });
			doc.font('Helvetica').text(formatDate(invoiceData.createdAt || new Date().toISOString()), col2X + 5, detailsTableTop + rowHeight + 8, { width: col2Width - 10 });

			// Row 3 - Due Date
			doc.rect(col1X, detailsTableTop + rowHeight * 2, col1Width, rowHeight).stroke();
			doc.rect(col2X, detailsTableTop + rowHeight * 2, col2Width, rowHeight).stroke();
			doc.font('Helvetica-Bold').text('Due Date:', col1X + 5, detailsTableTop + rowHeight * 2 + 8, { width: col1Width - 10 });
			doc.font('Helvetica').text(formatDate(invoiceData.due_date), col2X + 5, detailsTableTop + rowHeight * 2 + 8, { width: col2Width - 10 });

			doc.moveDown(3);

			// Bill To Section
			const billToY = detailsTableTop + rowHeight * 3 + 20;
			doc.y = billToY;
			doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', 50);
			doc.font('Helvetica').text(invoiceData.restaurant?.name || 'Restaurant', 50);
			doc.text(invoiceData.restaurant?.address?.city || 'Colombo, Sri Lanka', 50);
			doc.moveDown(2);

			// Main Invoice Table
			const tableTop = doc.y;
			const descX = 50;
			const periodX = 270;
			const amountX = 450;
			const tableRowHeight = 30;

			// Table Header
			doc.fontSize(10).font('Helvetica-Bold');
			doc.rect(descX, tableTop, 220, tableRowHeight).stroke();
			doc.rect(periodX, tableTop, 180, tableRowHeight).stroke();
			doc.rect(amountX, tableTop, 95, tableRowHeight).stroke();
			
			doc.text('Description', descX + 5, tableTop + 10, { width: 210 });
			doc.text('Billing Period', periodX + 5, tableTop + 10, { width: 170 });
			doc.text('Amount (USD)', amountX + 5, tableTop + 10, { width: 85, align: 'right' });

			// Table Row - Line Item
			const rowY = tableTop + tableRowHeight;
			doc.rect(descX, rowY, 220, tableRowHeight).stroke();
			doc.rect(periodX, rowY, 180, tableRowHeight).stroke();
			doc.rect(amountX, rowY, 95, tableRowHeight).stroke();

			doc.font('Helvetica');
			const description = invoiceData.type === InvoiceType.OVERAGE 
				? 'Overage Charges' 
				: planDetails?.name || 'Subscription Plan';
			doc.text(description, descX + 5, rowY + 10, { width: 210 });
			
			const billingPeriodText = `${formatDate(invoiceData.billing_period_start)} - ${formatDate(invoiceData.billing_period_end)}`;
			doc.text(billingPeriodText, periodX + 5, rowY + 10, { width: 170 });
			doc.text(formatAmount(invoiceData.amount), amountX + 5, rowY + 10, { width: 85, align: 'right' });

			// Total Row
			const totalY = rowY + tableRowHeight;
			doc.rect(descX, totalY, 400, tableRowHeight).stroke();
			doc.rect(amountX, totalY, 95, tableRowHeight).stroke();

			doc.font('Helvetica-Bold');
			doc.text('Total Amount Due:', descX + 5, totalY + 10, { width: 390, align: 'right' });
			doc.text(`USD ${formatAmount(invoiceData.amount)}`, amountX + 5, totalY + 10, { width: 85, align: 'right' });

			// Footer Message
			doc.moveDown(3);
			doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666');
			doc.text('Payment is due by the due date mentioned above. Thank you for using our Restaurant Management System.', {
				align: 'center'
			});

			doc.end();
		});
	}

  /**
   * Returns the billing period string (e.g. 'January 2026') for a given invoice period.
   * Picks the month (start or end) that has more days in the period.
   */
  private getBillingPeriodForDates(startDate: Date, endDate: Date): string {
    const startMonth = startDate.getUTCMonth();
    const startYear = startDate.getUTCFullYear();
    const endMonth = endDate.getUTCMonth();
    const endYear = endDate.getUTCFullYear();

    // Calculate last day of start month in period
    const lastDayOfStartMonth = new Date(Date.UTC(startYear, startMonth + 1, 0)).getUTCDate();
    const daysInStartMonth = lastDayOfStartMonth - startDate.getUTCDate() + 1;

    // Calculate days in end month (from 1st to endDate)
    let daysInEndMonth = endDate.getUTCDate();
    // If period is within same month, all days are in start month
    if (startMonth === endMonth && startYear === endYear) {
      daysInEndMonth = 0;
    }

    let billingMonth, billingYear;
    if (daysInStartMonth > daysInEndMonth) {
      billingMonth = startMonth;
      billingYear = startYear;
    } else {
      billingMonth = endMonth;
      billingYear = endYear;
    }
    return new Date(Date.UTC(billingYear, billingMonth)).toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  /**
   * Returns the billing period string (e.g. 'January 2026') for a given invoice period.
   * Picks the month (start or end) that has more days in the period.
   */
  private getBillingMonth(startDate: Date, endDate: Date): string {
    const startMonth = startDate.getUTCMonth();
    const startYear = startDate.getUTCFullYear();
    const endMonth = endDate.getUTCMonth();
    const endYear = endDate.getUTCFullYear();

    // Calculate last day of start month in period
    const lastDayOfStartMonth = new Date(Date.UTC(startYear, startMonth + 1, 0)).getUTCDate();
    const daysInStartMonth = lastDayOfStartMonth - startDate.getUTCDate() + 1;

    // Calculate days in end month (from 1st to endDate)
    let daysInEndMonth = endDate.getUTCDate();
    // If period is within same month, all days are in start month
    if (startMonth === endMonth && startYear === endYear) {
      daysInEndMonth = 0;
    }

    let billingMonth, billingYear;
    if (daysInStartMonth > daysInEndMonth) {
      billingMonth = startMonth;
      billingYear = startYear;
    } else {
      billingMonth = endMonth;
      billingYear = endYear;
    }
    return `${billingYear}-${String(billingMonth + 1).padStart(2, '0')}`;
  }

  /**
   * Generate overage invoices for subscriptions ending today.
   * For each, if overageCount > 0 in order_usage for the ending month, generate an invoice for the excess orders.
   */
  async generateOverageInvoicesForEndingSubscriptions() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Find all subscriptions ending today
    const endingSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: RestaurantSubscriptionStatus.ACTIVE,
        endDate: todayStr,
      },
      relations: ['plan', 'restaurant'],
    });

    for (const sub of endingSubscriptions) {
      // Convert startDate and endDate (string) to Date objects
      const startDateObj = sub.startDate ? new Date(sub.startDate) : null;
      const endDateObj = sub.endDate ? new Date(sub.endDate) : null;
      if (!startDateObj || !endDateObj) continue;

      // Find order usage for the ending month
      //const monthKey = endDateObj.toISOString().slice(0, 7); // 'YYYY-MM'
      const billingMonth = this.getBillingMonth(startDateObj, endDateObj);
      const usage = await this.orderUsageRepository.findOne({ where: { restaurantId: sub.restaurantId, id: sub.usageId } });
      if (
        !usage ||
        (
          (!usage.overageCount || usage.overageCount <= 0) &&
          (!usage.overageUserCount || usage.overageUserCount <= 0) &&
          (!usage.overageQRCount || usage.overageQRCount <= 0) &&
          (!usage.overageTableCount || usage.overageTableCount <= 0)
        )
      ) continue;
      
      const currentPlan = sub.plan;
      
      const overageChargePerInvoice = Number(currentPlan.overageChargePerInvoice) || 0;
      const overageChargePerUser = Number(currentPlan.overageChargePerUser) || 0;
      const overageChargePerQR = Number(currentPlan.overageChargePerQR) || 0;
      const overageChargePerTable = Number(currentPlan.overageChargePerTable) || 0;

      const amount = (usage.overageCount * overageChargePerInvoice) 
      + (usage.overageUserCount * overageChargePerUser) 
      + (usage.overageQRCount * overageChargePerQR) 
      + (usage.overageTableCount * overageChargePerTable);
      
      const base_amount = amount;
      const fees = 0;
      const billingPeriod = this.getBillingPeriodForDates(startDateObj, endDateObj);
      const today = new Date();
      const invoiceName = `OVG-${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, '0')}${String(today.getUTCDate()).padStart(2, '0')}`;

      // Check for existing overage invoice
      const existing = await this.invoiceRepository.findOne({
        where: {
          restaurantId: sub.restaurantId,
          billing_period: billingPeriod,
          restaurantSubscriptionId: sub.id,
          type: InvoiceType.OVERAGE
        },
      });
      if (existing) {
        this.logger.warn(`Overage invoice already exists for restaurant ${sub.restaurantId} for period ${billingPeriod}`);
        continue;
      }

      // Create invoice entity
      const invoice = this.invoiceRepository.create({
        invoiceName: invoiceName,
        restaurantId: sub.restaurantId,
        planId: sub.plan.id,
        billing_period: billingPeriod,
        billing_period_start: startDateObj.toISOString().slice(0, 10),
        billing_period_end: endDateObj.toISOString().slice(0, 10),
        amount,
        base_amount,
        fees,
        status: InvoiceStatus.PENDING,
        due_date: endDateObj.toISOString().slice(0, 10),
        paid_date: null,
        restaurantSubscriptionId: sub.id,
        type: InvoiceType.OVERAGE
      });
      // Create a dummy PDF buffer instead of calling generateInvoicePdf
      const pdfBuffer = Buffer.from('DUMMY PDF CONTENT');
      const s3Key = `${invoiceName}.pdf`;
      const s3Url = await this.s3Service.uploadPdf(pdfBuffer, s3Key, invoice.restaurantId);
      invoice.invoiceAttachmentUrl = s3Url.url;
      await this.invoiceRepository.save(invoice);
      this.logger.log(`Generated overage invoice for restaurant ${sub.restaurantId} for period ${billingPeriod}`);
    }
  }
}