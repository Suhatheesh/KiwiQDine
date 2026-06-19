import { DataSource } from 'typeorm';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { SubscriptionPlanEntity } from '../entities/subscription-plan.entity';

export class InvoiceSeeder {
  constructor(private dataSource: DataSource) { }

  async run(): Promise<void> {
    const invoiceRepo = this.dataSource.getRepository(Invoice);
    const planRepo = this.dataSource.getRepository(SubscriptionPlanEntity);

    // Fetch an actual subscription plan from the database
    const plan = await planRepo.findOne({
      where: {},
      order: { order: 'ASC' }
    });

    // Skip seeding if no subscription plan exists
    if (!plan) {
      console.log('[InvoiceSeeder] Skipping: No subscription plans found in database');
      return;
    }

    const restaurantId = '19d05b21-c093-439c-b0dc-8eeec922f8da';
    const planId = plan.id; // Use actual plan UUID from database
    const now = new Date();

    const invoices = [
      {
        // id will be auto-generated (uuid)
        invoiceName: 'INV-202511',
        billing_period: 'November 2025',
        billing_period_start: '2025-11-01',
        billing_period_end: '2025-11-30',
        planId: planId,
        amount: 141.00,
        base_amount: 99.00,
        fees: 42.00,
        status: InvoiceStatus.PENDING,
        due_date: '2025-12-01',
        paid_date: null,
        invoiceAttachmentUrl: null,
        created_at: now,
        updated_at: now,
        restaurantId,
      },
      {
        invoiceName: 'INV-202510',
        billing_period: 'October 2025',
        billing_period_start: '2025-10-01',
        billing_period_end: '2025-10-31',
        planId: planId,
        amount: 152.00,
        base_amount: 99.00,
        fees: 53.00,
        status: InvoiceStatus.PAID,
        due_date: '2025-11-01',
        paid_date: '2025-11-02',
        invoiceAttachmentUrl: null,
        created_at: now,
        updated_at: now,
        restaurantId,
      },
      {
        invoiceName: 'INV-202509',
        billing_period: 'September 2025',
        billing_period_start: '2025-09-01',
        billing_period_end: '2025-09-30',
        planId: planId,
        amount: 128.00,
        base_amount: 99.00,
        fees: 29.00,
        status: InvoiceStatus.PAID,
        due_date: '2025-10-01',
        paid_date: '2025-10-01',
        invoiceAttachmentUrl: null,
        created_at: now,
        updated_at: now,
        restaurantId,
      },
    ];

    for (const invoice of invoices) {
      const exists = await invoiceRepo.findOne({
        where: {
          billing_period: invoice.billing_period,
          planId: invoice.planId,
          restaurantId: invoice.restaurantId,
        },
      });
      if (!exists) {
        await invoiceRepo.save(invoice);
      }
    }
  }
}
