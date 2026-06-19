import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { RestaurantSubscription, RestaurantSubscriptionStatus } from '../infrastructure/database/entities/restaurant-subscription.entity';
import { Invoice, InvoiceStatus } from '../infrastructure/database/entities/invoice.entity';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { InvoiceFilterDto } from './dto/invoice-filter.dto';
import { GracePeriodService } from '@/subscription/grace-period.service';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(RestaurantSubscription)
    private readonly restaurantSubscriptionRepository: Repository<RestaurantSubscription>,
    @Inject(forwardRef(() => GracePeriodService))
    private readonly gracePeriodService: GracePeriodService,
  ) { }

  async findAll(): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoiceRepository.find();
    return invoices.map((invoice) => new InvoiceResponseDto(invoice));
  }

  async findByRestaurantId(restaurantId: string): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoiceRepository.find({
      where: { restaurantId }, relations: ['plan']
    });
    return invoices.map((invoice) => new InvoiceResponseDto(invoice));
  }

  async findById(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!invoice) {
      return null;
    }

    return new InvoiceResponseDto(invoice);
  }

  async findAllWithFilters(filters: InvoiceFilterDto): Promise<{
    data: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.restaurant', 'restaurant')
      .leftJoinAndSelect('invoice.plan', 'plan');

    // Apply filters
    if (filters.restaurantId) {
      queryBuilder.andWhere('invoice.restaurantId = :restaurantId', {
        restaurantId: filters.restaurantId
      });
    }

    if (filters.restaurantName) {
      queryBuilder.andWhere('restaurant.name ILIKE :restaurantName', {
        restaurantName: `%${filters.restaurantName}%`
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('invoice.status = :status', {
        status: filters.status
      });
    }

    if (filters.plan) {
      queryBuilder.andWhere('invoice.plan = :plan', {
        plan: filters.plan
      });
    }

    if (filters.billingPeriod) {
      queryBuilder.andWhere('invoice.billing_period = :billingPeriod', {
        billingPeriod: filters.billingPeriod
      });
    }

    // Date range filters
    if (filters.fromDate && filters.toDate) {
      queryBuilder.andWhere('invoice.created_at BETWEEN :fromDate AND :toDate', {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      });
    } else if (filters.fromDate) {
      queryBuilder.andWhere('invoice.created_at >= :fromDate', {
        fromDate: filters.fromDate
      });
    } else if (filters.toDate) {
      queryBuilder.andWhere('invoice.created_at <= :toDate', {
        toDate: filters.toDate
      });
    }

    // Amount range filters
    if (filters.minAmount !== undefined && filters.maxAmount !== undefined) {
      queryBuilder.andWhere('invoice.amount BETWEEN :minAmount AND :maxAmount', {
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
      });
    } else if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('invoice.amount >= :minAmount', {
        minAmount: filters.minAmount
      });
    } else if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('invoice.amount <= :maxAmount', {
        maxAmount: filters.maxAmount
      });
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`invoice.${sortBy}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const invoices = await queryBuilder.getMany();

    return {
      data: invoices.map((invoice) => new InvoiceResponseDto(invoice)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInvoiceSummary() {
    // Total revenue (paid invoices)
    const totalRevenueResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.status = :status', { status: InvoiceStatus.PAID })
      .getRawOne();

    // Monthly total revenue (paid invoices, current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthlyRevenueResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.status = :status', { status: InvoiceStatus.PAID })
      .andWhere('invoice.paid_date >= :monthStart', { monthStart: monthStart.toISOString().slice(0, 10) })
      .andWhere('invoice.paid_date <= :monthEnd', { monthEnd: monthEnd.toISOString().slice(0, 10) })
      .getRawOne();

    // Pending (awaiting payment)
    const pendingResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.status = :status', { status: InvoiceStatus.PENDING })
      .getRawOne();

    // Overdue (requires attention)
    const overdueResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.status = :status', { status: InvoiceStatus.OVERDUE })
      .getRawOne();

    return {
      totalRevenue: Number(totalRevenueResult.total) || 0,
      monthlyRevenue: Number(monthlyRevenueResult.total) || 0,
      pending: Number(pendingResult.total) || 0,
      overdue: Number(overdueResult.total) || 0,
    };
  }

  async getInvoiceSummaryForRestaurant(restaurantId: string) {
    // Total revenue (paid invoices)
    const totalRevenueResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.status = :status', { status: InvoiceStatus.PAID })
      .andWhere('invoice.restaurantId = :restaurantId', { restaurantId })
      .getRawOne();

    // Monthly total revenue (paid invoices, current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthlyRevenueResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.status = :status', { status: InvoiceStatus.PAID })
      .andWhere('invoice.restaurantId = :restaurantId', { restaurantId })
      .andWhere('invoice.paid_date >= :monthStart', { monthStart: monthStart.toISOString().slice(0, 10) })
      .andWhere('invoice.paid_date <= :monthEnd', { monthEnd: monthEnd.toISOString().slice(0, 10) })
      .getRawOne();

    // Pending (awaiting payment)
    const pendingResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.status = :status', { status: InvoiceStatus.PENDING })
      .andWhere('invoice.restaurantId = :restaurantId', { restaurantId })
      .getRawOne();

    // Overdue (requires attention)
    const overdueResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'total')
      .where('invoice.status = :status', { status: InvoiceStatus.OVERDUE })
      .andWhere('invoice.restaurantId = :restaurantId', { restaurantId })
      .getRawOne();

    // Get nextBillDate from active subscription with isAutoRenew true
    const activeSubscription = await this.restaurantSubscriptionRepository.findOne({
      where: {
        restaurantId,
        status: RestaurantSubscriptionStatus.ACTIVE,
        isAutoRenew: true,
      },
      order: { endDate: 'DESC' },
    });
    const nextBillDate = activeSubscription ? activeSubscription.endDate : null;

    return {
      totalRevenue: Number(totalRevenueResult.total) || 0,
      monthlyRevenue: Number(monthlyRevenueResult.total) || 0,
      pending: Number(pendingResult.total) || 0,
      overdue: Number(overdueResult.total) || 0,
      nextBillDate,
    };
  }

  async markAsPaid(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!invoice) {
      return null;
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paid_date = new Date().toISOString().split('T')[0];

    await this.invoiceRepository.save(invoice);

    // Check if restaurant has any remaining unpaid invoices
    const hasUnpaidInvoices = await this.gracePeriodService.hasUnpaidInvoices(invoice.restaurantId);

    // If no unpaid invoices remain, clear grace period
    if (!hasUnpaidInvoices) {
      await this.gracePeriodService.clearGracePeriod(invoice.restaurantId);
    }

    return new InvoiceResponseDto(invoice);
  }
}
