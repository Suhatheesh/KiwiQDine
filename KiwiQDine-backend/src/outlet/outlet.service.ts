import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { BillingCycle, Invoice, InvoiceStatus, Restaurant, RestaurantSubscription, RestaurantSubscriptionStatus, SubscriptionPlanEntity } from '../infrastructure/database/entities';
import { BankDetails } from '../infrastructure/database/entities/bank-details.entity';
import { CreateOutletDto, UpdateOutletDto } from './dto';
import { PaginationDto, PaginationResponse } from '../shared/dto/pagination.dto';
import { S3Service } from '@/shared/services/s3.service';
import { RestaurantService } from '@/restaurant';

@Injectable()
export class OutletService {
  private readonly logger = new Logger(OutletService.name);
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(BankDetails)
    private bankDetailsRepository: Repository<BankDetails>,
    @InjectRepository(RestaurantSubscription)
    private readonly restaurantSubscriptionRepository: Repository<RestaurantSubscription>,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly s3Service: S3Service,
    private readonly restaurantService: RestaurantService,
  ) { }

  async create(tenantId: string, createOutletDto: CreateOutletDto): Promise<{ message: string; data: Restaurant }> {
    const outlet = this.restaurantRepository.create({
      ...createOutletDto,
      tenantId,
      status: 'active', // Ensure new outlets are created as active
    } as DeepPartial<Restaurant>);
    const savedOutlet = await this.restaurantRepository.save(outlet);

    // Assign trial subscription to the new outlet
    await this.restaurantService['assignTrialSubscription'](savedOutlet.id);

    return {
      message: 'Outlet created successfully.',
      data: savedOutlet,
    };
  }

  async findAll(
    tenantId: string,
    pagination: PaginationDto = { page: 1, limit: 10 },
    status?: 'active' | 'inactive' | 'all'
  ): Promise<PaginationResponse<Restaurant>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause based on status filter
    const whereClause: any = { tenantId };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const [data, total] = await this.restaurantRepository.findAndCount({
      where: whereClause,
      relations: ['menus', 'bankDetails'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<{ message: string; data: Restaurant }> {
    const outlet = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['bankDetails'],
    });

    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    return {
      message: 'Outlet retrieved successfully.',
      data: outlet,
    };
  }

  async update(id: string, updateOutletDto: UpdateOutletDto): Promise<{ message: string; data: Restaurant }> {
    const existing = await this.restaurantRepository.findOne({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Outlet not found');
    }

    // Handle bankDetails separately (stored in its own table)
    const { bankDetails, ...rest } = updateOutletDto as any;
    Object.assign(existing, rest);
    await this.restaurantRepository.save(existing);

    if (bankDetails !== undefined && bankDetails !== null) {
      const existingBd = await this.bankDetailsRepository.findOne({ where: { restaurantId: existing.id } });
      if (existingBd) {
        Object.assign(existingBd, bankDetails);
        await this.bankDetailsRepository.save(existingBd);
      } else {
        const newBd = this.bankDetailsRepository.create({ ...bankDetails, restaurantId: existing.id } as DeepPartial<BankDetails>);
        await this.bankDetailsRepository.save(newBd);
      }
    }

    // Reload the outlet with fresh data and relations
    const refreshedOutlet = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['menus', 'users', 'bankDetails', 'subscriptions', 'subscriptions.plan'],
    });

    if (!refreshedOutlet) {
      throw new NotFoundException('Outlet not found after update');
    }

    // Transform subscriptions array to subscription object (active subscription)
    const activeSubscription = refreshedOutlet.subscriptions?.find((sub: any) => sub.status === 'active');
    const subscription = activeSubscription ? {
      id: activeSubscription.id,
      planId: activeSubscription.planId,
      planName: activeSubscription.plan?.name,
      planCode: activeSubscription.plan?.code,
      billingCycle: activeSubscription.billingCycle,
      startDate: activeSubscription.startDate,
      endDate: activeSubscription.endDate,
      status: activeSubscription.status,
      isAutoRenew: activeSubscription.isAutoRenew,
      priceMonthly: activeSubscription.plan?.priceMonthly,
      priceYearly: activeSubscription.plan?.priceYearly,
      orderLimit: activeSubscription.plan?.orderLimit,
      features: activeSubscription.plan?.features,
    } : null;

    // Prepare response with transformed subscription
    const responseData = {
      ...refreshedOutlet,
      subscription,
    } as any;

    return {
      message: 'Outlet updated successfully.',
      data: responseData,
    };
  }

  async archive(id: string): Promise<{ message: string }> {
    const outlet = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['menus', 'users'],
    });

    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    // Soft delete: set status to inactive AND isActive to false
    outlet.status = 'inactive';
    outlet.isActive = false;
    await this.restaurantRepository.save(outlet);

    return {
      message: 'Outlet archived successfully.',
    };
  }

  async unarchive(id: string): Promise<{ message: string; data: Restaurant }> {
    const outlet = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['menus', 'users'],
    });

    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }

    if (outlet.status !== 'inactive') {
      throw new BadRequestException('Outlet is not archived. Only archived outlets can be unarchived.');
    }

    outlet.status = 'active';
    outlet.isActive = true;
    const savedOutlet = await this.restaurantRepository.save(outlet);

    return {
      message: 'Outlet unarchived successfully.',
      data: savedOutlet,
    };
  }

  async reactivate(id: string): Promise<{ message: string; data: Restaurant }> {
    return this.unarchive(id);
  }

  async getBankDetailsByRestaurantId(restaurantId: string): Promise<{ message: string; data: BankDetails | null }> {
    const bankDetails = await this.bankDetailsRepository.findOne({ where: { restaurantId } });
    if (!bankDetails) {
      return { message: 'No bank details found for this restaurant.', data: null };
    }
    return { message: 'Bank details retrieved successfully.', data: bankDetails };
  }

  async updateBankDetails(restaurantId: string, updateBankDetailsDto: any): Promise<{ message: string; data: BankDetails }> {
    let bankDetails = await this.bankDetailsRepository.findOne({ where: { restaurantId } });
    if (bankDetails) {
      Object.assign(bankDetails, updateBankDetailsDto);
      bankDetails = await this.bankDetailsRepository.save(bankDetails);
      return { message: 'Bank details updated successfully.', data: bankDetails };
    } else {
      const newBankDetails = this.bankDetailsRepository.create({ ...updateBankDetailsDto, restaurantId });
      const saved = await this.bankDetailsRepository.save(newBankDetails);
      return { message: 'Bank details created successfully.', data: saved[0] };
    }
  }

  private formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
