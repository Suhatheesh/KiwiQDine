import { DataSource } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';

export class TransactionSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const transactionRepo = this.dataSource.getRepository(Transaction);
    const now = new Date();

    const transactions = [
      {
        restaurantId: '19d05b21-c093-439c-b0dc-8eeec922f8da',
        invoiceId: 'inv-001',
        amount: 150.00,
        date: '2025-12-01',
        description: 'Monthly subscription payment',
        status: 'Completed',
        createdAt: now,
        updatedAt: now,
      },
      {
        restaurantId: '19d05b21-c093-439c-b0dc-8eeec922f8da',
        invoiceId: 'inv-002',
        amount: 200.00,
        date: '2025-11-01',
        description: 'Addon purchase',
        status: 'Completed',
        createdAt: now,
        updatedAt: now,
      },
      {
        restaurantId: '19d05b21-c093-439c-b0dc-8eeec922f8da',
        invoiceId: 'inv-003',
        amount: 99.99,
        date: '2025-10-15',
        description: 'Refund',
        status: 'Pending',
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const transaction of transactions) {
      const exists = await transactionRepo.findOne({
        where: {
          invoiceId: transaction.invoiceId,
          restaurantId: transaction.restaurantId,
        },
      });
      if (!exists) {
        await transactionRepo.save(transaction);
      }
    }
  }
}
