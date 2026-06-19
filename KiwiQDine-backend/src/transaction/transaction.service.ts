import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../infrastructure/database/entities/transaction.entity';
import { Restaurant } from '../infrastructure/database/entities/restaurant.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) { }

  async getAll(filters?: { status?: string; startDate?: string; endDate?: string }): Promise<Transaction[]> {
    const query = this.transactionRepository.createQueryBuilder('transaction');

    if (filters?.status) {
      query.andWhere('transaction.status = :status', { status: filters.status });
    }

    if (filters?.startDate) {
      query.andWhere('transaction.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('transaction.date <= :endDate', { endDate: filters.endDate });
    }

    return await query.orderBy('transaction.createdAt', 'DESC').getMany();
  }

  async getAllByRestaurantId(restaurantId: string, filters?: { status?: string; startDate?: string; endDate?: string }): Promise<Transaction[]> {
    const query = this.transactionRepository.createQueryBuilder('transaction')
      .where('transaction.restaurantId = :restaurantId', { restaurantId });

    if (filters?.status) {
      query.andWhere('transaction.status = :status', { status: filters.status });
    }

    if (filters?.startDate) {
      query.andWhere('transaction.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('transaction.date <= :endDate', { endDate: filters.endDate });
    }

    return await query.orderBy('transaction.createdAt', 'DESC').getMany();
  }

  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.transactionRepository.create(data);
    const saved = await this.transactionRepository.save(transaction);

    if (saved.status === 'Completed') {
      await this.updateWallet(saved);
    }

    return saved;
  }

  async getById(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({ where: { id } });
  }

  async updateStatus(id: string, status: string): Promise<Transaction | null> {
    const transaction = await this.getById(id);
    if (!transaction) return null;

    const oldStatus = transaction.status;
    transaction.status = status;
    const saved = await this.transactionRepository.save(transaction);

    if (oldStatus !== 'Completed' && status === 'Completed') {
      await this.updateWallet(saved);
    }

    return saved;
  }

  private async updateWallet(transaction: Transaction) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: transaction.restaurantId },
    });

    if (!restaurant) return;

    const amount = Number(transaction.amount);

    if (transaction.type === 'payout') {
      // For payouts (Wallet Return payment), we reduce the balance and increase withdrawn
      restaurant.walletBalance = Number(restaurant.walletBalance) - amount;
      restaurant.walletTotalWithdrawn = Number(restaurant.walletTotalWithdrawn) + amount;
    } else {
      // For earned or other credit types, we increase balance and earned
      restaurant.walletBalance = Number(restaurant.walletBalance) + amount;
      restaurant.walletTotalEarned = Number(restaurant.walletTotalEarned) + amount;
    }

    await this.restaurantRepository.save(restaurant);
  }
}
