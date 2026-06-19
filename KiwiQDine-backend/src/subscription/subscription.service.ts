import { CreateSpecializedSubscriptionPlanDto } from './dto/create-specialized-subscription-plan.dto';
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { S3Service } from '../shared/services/s3.service';
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import {
  SubscriptionPlanEntity,
  SubscriptionPlanStatus,
  PlanBillingCycle,
  RestaurantSubscription,
  RestaurantSubscriptionStatus,
  BillingCycle,
  OrderUsage,
  OrderUsageStatus,
  Restaurant,
  Order,
  SubscriptionChangeLog,
  SubscriptionChangeType,
  SubscriptionChangeInitiator,
  Table,
  Invoice,
  InvoiceStatus,
  User,
  QRCode,
  TableStatus,
  QRCodeStatus,
  UserStatus,
} from '../infrastructure/database/entities';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { AssignRestaurantSubscriptionDto } from './dto/assign-restaurant-subscription.dto';
import { ChangeSubscriptionPlanDto } from './dto/change-subscription-plan.dto';
import { ISubscriptionService } from './subscription-service.interface';
import { InvoiceType } from '@/infrastructure/database/entities/invoice.entity';
import { GetSubscriptionPlanDto } from './dto/get-subscription-plan.dto';
import { UsageSummaryCardDto } from './dto/usage-summary-card.dto';

@Injectable()
export class SubscriptionService implements ISubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepository: Repository<SubscriptionPlanEntity>,
    @InjectRepository(RestaurantSubscription)
    private readonly restaurantSubscriptionRepository: Repository<RestaurantSubscription>,
    @InjectRepository(OrderUsage)
    private readonly orderUsageRepository: Repository<OrderUsage>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(SubscriptionChangeLog)
    private readonly changeLogRepository: Repository<SubscriptionChangeLog>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(QRCode)
    private readonly qrCodeRepository: Repository<QRCode>,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) { }

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanEntity> {
    const code = dto.code.toLowerCase();

    const existingByCode = await this.planRepository.findOne({ where: { code } });
    if (existingByCode) {
      throw new BadRequestException(`Subscription plan with code '${code}' already exists`);
    }

    const existingByName = await this.planRepository.findOne({ where: { name: dto.name } });
    if (existingByName) {
      throw new BadRequestException(`Subscription plan with name '${dto.name}' already exists`);
    }

    const plan = this.planRepository.create({
      name: dto.name,
      code,
      description: dto.description,
      priceMonthly: this.toMoney(dto.priceMonthly),
      priceYearly: this.toMoney(dto.priceYearly),
      status: dto.status ?? SubscriptionPlanStatus.ACTIVE,
      features: dto.features ?? [],
      billingCycle: dto.billingCycle ?? PlanBillingCycle.MONTHLY,
      yearlySavingsPercent:
        dto.yearlySavingsPercent !== undefined ? dto.yearlySavingsPercent : this.deriveSavings(dto),
      orderLimit: dto.orderLimit !== undefined && dto.orderLimit > 0 ? dto.orderLimit : null,
      qrLimit: dto.qrLimit !== undefined && dto.qrLimit > 0 ? dto.qrLimit : null,
      userLimit: dto.userLimit !== undefined && dto.userLimit > 0 ? dto.userLimit : null,
      tableLimit: dto.tableLimit !== undefined && dto.tableLimit > 0 ? dto.tableLimit : null,
      overageChargePerInvoice: this.toMoney(dto.overageChargePerInvoice),
      overageChargePerUser: this.toMoney(dto.overageChargePerUser),
    });

    return this.planRepository.save(plan);
  }

  async getPlans(status?: SubscriptionPlanStatus, includeArchived?: boolean): Promise<SubscriptionPlanEntity[]> {
    const queryBuilder = this.planRepository.createQueryBuilder('plan');

    if (status) {
      queryBuilder.andWhere('plan.status = :status', { status });
    }

    // By default, exclude archived plans unless explicitly requested
    if (!includeArchived) {
      queryBuilder.andWhere('plan.isArchived = :isArchived', { isArchived: false });
    }

    // Exclude specialized plans by default
    queryBuilder.andWhere('plan.isSpecializedPlan = :isSpecializedPlan', { isSpecializedPlan: false });

    // Exclude trial plan
    queryBuilder.andWhere('plan.code != :trialCode', { trialCode: 'trial' });

    return queryBuilder
      .orderBy('plan.order', 'ASC')
      .addOrderBy('plan.priceMonthly', 'ASC', 'NULLS FIRST')
      .getMany();
  }

  async getPlan(planId: string): Promise<SubscriptionPlanEntity> {
    const plan = await this.planRepository.findOne({ where: { id: planId, isArchived: false } });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }
    return plan;
  }

  async getAllPlans(): Promise<GetSubscriptionPlanDto[]> {
    // For backward compatibility, if no filters, return all
    const result = await this.getAllPlansWithFilters({});
    return result.data;
  }

  async getAllPlansWithFilters(filters: {
    isSpecializedPlan?: boolean;
    isArchived?: boolean;
    status?: SubscriptionPlanStatus;
    tenantId?: string;
    planName?: string;
    tenantName?: string;
    fromDate?: string;
    toDate?: string;
    minPriceMonthly?: number;
    maxPriceMonthly?: number;
    minPriceYearly?: number;
    maxPriceYearly?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }): Promise<{
    data: GetSubscriptionPlanDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.planRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.tenant', 'tenant')
      .addSelect(['tenant.name']);

    // isSpecializedPlan filter
    if (filters.isSpecializedPlan) {
      queryBuilder.andWhere('plan.isSpecializedPlan = :isSpecializedPlan', { isSpecializedPlan: filters.isSpecializedPlan });
    }

    // isArchived filter
    if (filters.isArchived) {
      queryBuilder.andWhere('plan.isArchived = :isArchived', { isArchived: filters.isArchived });
    }

    // status filter
    if (filters.status) {
      queryBuilder.andWhere('plan.status = :status', { status: filters.status });
    }

    // tenantId filter
    if (filters.tenantId) {
      queryBuilder.andWhere('plan.tenantId = :tenantId', { tenantId: filters.tenantId });
    }

    // planName filter
    if (filters.planName) {
      queryBuilder.andWhere('plan.name ILIKE :planName', { planName: `%${filters.planName}%` });
    }

    // tenantName filter
    if (filters.tenantName) {
      queryBuilder.andWhere('tenant.name ILIKE :tenantName', { tenantName: `%${filters.tenantName}%` });
    }

    // Date range filters (createdAt)
    if (filters.fromDate && filters.toDate) {
      queryBuilder.andWhere('plan.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      });
    } else if (filters.fromDate) {
      queryBuilder.andWhere('plan.createdAt >= :fromDate', { fromDate: filters.fromDate });
    } else if (filters.toDate) {
      queryBuilder.andWhere('plan.createdAt <= :toDate', { toDate: filters.toDate });
    }

    // Amount range filters for priceMonthly
    if (filters.minPriceMonthly !== undefined && filters.maxPriceMonthly !== undefined) {
      queryBuilder.andWhere('plan.priceMonthly BETWEEN :minPriceMonthly AND :maxPriceMonthly', {
        minPriceMonthly: filters.minPriceMonthly,
        maxPriceMonthly: filters.maxPriceMonthly,
      });
    } else if (filters.minPriceMonthly !== undefined) {
      queryBuilder.andWhere('plan.priceMonthly >= :minPriceMonthly', { minPriceMonthly: filters.minPriceMonthly });
    } else if (filters.maxPriceMonthly !== undefined) {
      queryBuilder.andWhere('plan.priceMonthly <= :maxPriceMonthly', { maxPriceMonthly: filters.maxPriceMonthly });
    }

    // Amount range filters for priceYearly
    if (filters.minPriceYearly !== undefined && filters.maxPriceYearly !== undefined) {
      queryBuilder.andWhere('plan.priceYearly BETWEEN :minPriceYearly AND :maxPriceYearly', {
        minPriceYearly: filters.minPriceYearly,
        maxPriceYearly: filters.maxPriceYearly,
      });
    } else if (filters.minPriceYearly !== undefined) {
      queryBuilder.andWhere('plan.priceYearly >= :minPriceYearly', { minPriceYearly: filters.minPriceYearly });
    } else if (filters.maxPriceYearly !== undefined) {
      queryBuilder.andWhere('plan.priceYearly <= :maxPriceYearly', { maxPriceYearly: filters.maxPriceYearly });
    }

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`plan.${sortBy}`, sortOrder);

    // Get all plans
    const allPlans = await queryBuilder.getMany();

    // Group plans by specializedPlanId (or id if not specialized) to aggregate tenantIds
    const planMap = new Map<string, SubscriptionPlanEntity[]>();
    for (const plan of allPlans) {
      // Use specializedPlanId if present, else use plan id as group key
      const groupKey = plan.specializedPlanId || plan.id;
      if (!planMap.has(groupKey)) {
        planMap.set(groupKey, []);
      }
      planMap.get(groupKey)!.push(plan);
    }

    // For each group, pick the first plan as the base, and aggregate tenantIds
    const dedupedDtos: GetSubscriptionPlanDto[] = [];
    for (const plans of planMap.values()) {
      const base = plans[0];
      // Aggregate all tenantIds for this group (filter out null/undefined)
      const tenantIds = plans.map(p => p.tenantId).filter(tid => !!tid);
      const tenantNames = plans.map(p => (p as any).tenant?.name).filter(tn => !!tn);
      dedupedDtos.push({
        id: base.id,
        name: base.name,
        code: base.code,
        description: base.description,
        priceMonthly: base.priceMonthly,
        priceYearly: base.priceYearly,
        status: base.status,
        order: base.order,
        features: base.features,
        billingCycle: base.billingCycle,
        yearlySavingsPercent: base.yearlySavingsPercent,
        orderLimit: base.orderLimit,
        qrLimit: base.qrLimit,
        userLimit: base.userLimit,
        tableLimit: base.tableLimit,
        overageChargePerInvoice: base.overageChargePerInvoice,
        overageChargePerUser: base.overageChargePerUser,
        overageChargePerQR: base.overageChargePerQR,
        overageChargePerTable: base.overageChargePerTable,
        isArchived: base.isArchived,
        isSpecializedPlan: base.isSpecializedPlan,
        specializedPlanId: base.specializedPlanId,
        tenantIds: tenantIds.length > 0 ? tenantIds : null,
        tenantNames: tenantNames.length > 0 ? tenantNames : null,
        createdAt: base.createdAt,
        updatedAt: base.updatedAt,
      });
    }

    // Update total to reflect deduplicated count
    const total = dedupedDtos.length;

    // Apply pagination manually on deduplicated results
    const paginatedDtos = dedupedDtos.slice(skip, skip + limit);

    return {
      data: paginatedDtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  async getPlanByCode(code: string): Promise<SubscriptionPlanEntity | null> {
    return this.planRepository.findOne({ where: { code: code.toLowerCase() } });
  }

  async updatePlan(planId: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanEntity> {
    const plan = await this.getPlan(planId);

    // Archive the current plan
    plan.isArchived = true;
    await this.planRepository.save(plan);

    // Create a new plan with updated settings
    const newPlan = this.planRepository.create({
      ...plan,
      ...dto,
      id: undefined, // Ensure a new record is created
      isArchived: false,
      code: dto.code ? dto.code.toLowerCase() : plan.code + '-v2',
      priceMonthly: dto.priceMonthly !== undefined ? this.toMoney(dto.priceMonthly) : plan.priceMonthly,
      priceYearly: dto.priceYearly !== undefined ? this.toMoney(dto.priceYearly) : plan.priceYearly,
      overageChargePerInvoice: dto.overageChargePerInvoice !== undefined ? this.toMoney(dto.overageChargePerInvoice) : plan.overageChargePerInvoice,
      overageChargePerUser: dto.overageChargePerUser !== undefined ? this.toMoney(dto.overageChargePerUser) : plan.overageChargePerUser,
      overageChargePerQR: dto.overageChargePerQR !== undefined ? this.toMoney(dto.overageChargePerQR) : plan.overageChargePerQR,
      overageChargePerTable: dto.overageChargePerTable !== undefined ? this.toMoney(dto.overageChargePerTable) : plan.overageChargePerTable,
      yearlySavingsPercent: dto.yearlySavingsPercent !== undefined ? dto.yearlySavingsPercent : plan.yearlySavingsPercent,
      orderLimit: dto.orderLimit !== undefined ? (dto.orderLimit > 0 ? dto.orderLimit : null) : plan.orderLimit,
      qrLimit: dto.qrLimit !== undefined ? (dto.qrLimit > 0 ? dto.qrLimit : null) : plan.qrLimit,
      userLimit: dto.userLimit !== undefined ? (dto.userLimit > 0 ? dto.userLimit : null) : plan.userLimit,
      tableLimit: dto.tableLimit !== undefined ? (dto.tableLimit > 0 ? dto.tableLimit : null) : plan.tableLimit,
      features: dto.features !== undefined ? dto.features : plan.features,
      status: dto.status ?? plan.status,
      billingCycle: dto.billingCycle ?? plan.billingCycle,
      name: dto.name ?? plan.name,
      description: dto.description ?? plan.description,
      order: dto.order ?? plan.order,
    });
    return this.planRepository.save(newPlan);
  }

  async archivePlan(planId: string): Promise<SubscriptionPlanEntity> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (plan.isArchived) {
      throw new BadRequestException('Plan is already archived');
    }

    // Check if plan has active subscriptions
    const activeSubscriptionsCount = await this.restaurantSubscriptionRepository.count({
      where: {
        planId: plan.id,
        status: RestaurantSubscriptionStatus.ACTIVE
      }
    });

    let warning: string | undefined = undefined;
    if (activeSubscriptionsCount > 0) {
      warning = `This plan has ${activeSubscriptionsCount} active subscription(s). Please wait until all subscriptions expire or migrate restaurants to a different plan.`;
    }

    plan.isArchived = true;
    const archivedPlan = await this.planRepository.save(plan);
    // Attach warning to the result (if needed)
    if (warning) {
      // @ts-ignore
      archivedPlan._archiveWarning = warning;
    }
    return archivedPlan;
  }

  async unarchivePlan(planId: string): Promise<SubscriptionPlanEntity> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (!plan.isArchived) {
      throw new BadRequestException('Plan is not archived');
    }

    plan.isArchived = false;
    return this.planRepository.save(plan);
  }

  async deletePlan(planId: string): Promise<void> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Safety check 1: Plan must be archived first
    if (!plan.isArchived) {
      throw new BadRequestException(
        'Cannot delete plan. Plan must be archived first. Use the archive endpoint before attempting deletion.'
      );
    }

    // Safety check 2: No active subscriptions
    const activeSubscriptionsCount = await this.restaurantSubscriptionRepository.count({
      where: {
        planId: plan.id,
        status: RestaurantSubscriptionStatus.ACTIVE
      }
    });

    if (activeSubscriptionsCount > 0) {
      throw new BadRequestException(
        `Cannot delete plan. This plan has ${activeSubscriptionsCount} active subscription(s). ` +
        `All subscriptions must be migrated or expired before deletion.`
      );
    }

    // Safety check 3: No historical subscriptions (to preserve audit trail)
    const totalSubscriptionsCount = await this.restaurantSubscriptionRepository.count({
      where: { planId: plan.id }
    });

    if (totalSubscriptionsCount > 0) {
      throw new BadRequestException(
        `Cannot delete plan. This plan has ${totalSubscriptionsCount} subscription record(s) in history. ` +
        `Plans with historical data cannot be deleted to maintain audit integrity.`
      );
    }

    // Safety check 4: No change log entries
    const changeLogCount = await this.changeLogRepository.count({
      where: [
        { oldPlanId: plan.id },
        { newPlanId: plan.id }
      ]
    });

    if (changeLogCount > 0) {
      throw new BadRequestException(
        `Cannot delete plan. This plan is referenced in ${changeLogCount} change log(s). ` +
        `Plans referenced in audit logs cannot be deleted.`
      );
    }

    // All safety checks passed - proceed with deletion
    await this.planRepository.remove(plan);
    this.logger.log(`Subscription plan permanently deleted: ${plan.name} (${plan.code})`);
  }

  async assignRestaurantToPlan(dto: AssignRestaurantSubscriptionDto): Promise<RestaurantSubscription> {
    const restaurant = await this.restaurantRepository.findOne({ where: { id: dto.restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const plan = await this.planRepository.findOne({ where: { id: dto.planId } });
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (plan.status !== SubscriptionPlanStatus.ACTIVE) {
      throw new BadRequestException('Cannot assign an inactive subscription plan');
    }

    const activeSubscription = await this.getActiveSubscription(dto.restaurantId);

    // Determine billing cycle and calculate end date accordingly
    const billingCycle = dto.billingCycle ??
      (plan.billingCycle === PlanBillingCycle.YEARLY ? BillingCycle.YEARLY : BillingCycle.MONTHLY);

    const now = new Date();
    const startDate = this.formatDate(now);
    const endDate = this.formatDate(this.calculateEndDate(now, billingCycle));

    if (activeSubscription) {
      await this.expireSubscription(activeSubscription, startDate);
    }

    // Expire any old active OrderUsage records for this restaurant
    const oldOrderUsages = await this.orderUsageRepository.find({
      where: { restaurantId: dto.restaurantId, status: OrderUsageStatus.ACTIVE }
    });
    for (const oldUsage of oldOrderUsages) {
      oldUsage.status = OrderUsageStatus.EXPIRED;
      await this.orderUsageRepository.save(oldUsage);
      this.logger.log(`Expired old OrderUsage record: ${oldUsage.id}`);
    }

    // Get current counts for tables, QRs, users
    let currentTables = await this.tableRepository.count({ where: { restaurantId: dto.restaurantId } });
    let currentQRs = await this.qrCodeRepository.count({ where: { restaurantId: dto.restaurantId, status: QRCodeStatus.ACTIVE } });
    let currentUsers = await this.userRepository.count({ where: { restaurantId: dto.restaurantId, status: UserStatus.ACTIVE } });

    // Create new OrderUsage record for the new subscription
    const newUsageMonthKey = this.getBillingMonth(new Date(startDate), new Date(endDate));
    const newOrderUsage = this.orderUsageRepository.create({
      restaurantId: dto.restaurantId,
      month: newUsageMonthKey,
      status: OrderUsageStatus.ACTIVE,
      planId: dto.planId,
      totalOrders: 0,
      totalQRCount: currentQRs,
      totalUserCount: currentUsers,
      totalTableCount: currentTables,
      overageCount: 0,
      overageQRCount: currentQRs > plan.qrLimit ? currentQRs - plan.qrLimit : 0,
      overageUserCount: currentUsers > plan.userLimit ? currentUsers - plan.userLimit : 0,
      overageTableCount: currentTables > plan.tableLimit ? currentTables - plan.tableLimit : 0,
    });
    const savedOrderUsage = await this.orderUsageRepository.save(newOrderUsage);

    const newSubscription = this.restaurantSubscriptionRepository.create({
      restaurantId: dto.restaurantId,
      planId: plan.id,
      startDate,
      endDate,
      billingCycle,
      isAutoRenew: dto.isAutoRenew ?? true,
      status: RestaurantSubscriptionStatus.ACTIVE,
      isAutoAssigned: false,
      usageId: savedOrderUsage.id,
    });

    const savedSubscription = await this.restaurantSubscriptionRepository.save(newSubscription);

    // Generate invoice for the new subscription
    try {
      const invoiceStartDate = new Date(savedSubscription.startDate);
      const invoiceEndDate = new Date(savedSubscription.endDate);
      const billingPeriod = this.getBillingPeriodForDates(invoiceStartDate, invoiceEndDate);

      // Check for existing invoice
      const existingInvoice = await this.invoiceRepository.findOne({
        where: {
          restaurantId: savedSubscription.restaurantId,
          billing_period: billingPeriod,
          restaurantSubscriptionId: savedSubscription.id,
          type: InvoiceType.SUBSCRIPTION,
        },
      });

      if (!existingInvoice) {
        let amount = 0, base_amount = 0, fees = 0;
        if (savedSubscription.billingCycle === 'monthly') {
          base_amount = Number(plan.priceMonthly) || 0;
        } else if (savedSubscription.billingCycle === 'yearly') {
          base_amount = Number(plan.priceYearly) || 0;
        }
        amount = base_amount + fees;

        const yearMonth = `${invoiceStartDate.getUTCFullYear()}${String(invoiceStartDate.getUTCMonth() + 1).padStart(2, '0')}`;
        const invoiceName = `INV-${yearMonth}`;

        const invoice = this.invoiceRepository.create({
          invoiceName: invoiceName,
          restaurantId: savedSubscription.restaurantId,
          planId: plan.id,
          billing_period: billingPeriod,
          billing_period_start: `${invoiceStartDate.getUTCFullYear()}-${String(invoiceStartDate.getUTCMonth() + 1).padStart(2, '0')}-${String(invoiceStartDate.getUTCDate()).padStart(2, '0')}`,
          billing_period_end: `${invoiceEndDate.getUTCFullYear()}-${String(invoiceEndDate.getUTCMonth() + 1).padStart(2, '0')}-${String(invoiceEndDate.getUTCDate()).padStart(2, '0')}`,
          amount,
          base_amount,
          fees,
          status: InvoiceStatus.PAID,
          due_date: `${invoiceStartDate.getUTCFullYear()}-${String(invoiceStartDate.getUTCMonth() + 1).padStart(2, '0')}-${String(invoiceStartDate.getUTCDate()).padStart(2, '0')}`,
          paid_date: `${invoiceStartDate.getUTCFullYear()}-${String(invoiceStartDate.getUTCMonth() + 1).padStart(2, '0')}-${String(invoiceStartDate.getUTCDate()).padStart(2, '0')}`,
          restaurantSubscriptionId: savedSubscription.id,
          type: InvoiceType.SUBSCRIPTION,
        });

        const pdfBuffer = await this.generateInvoicePdf(invoice);
        const s3Key = `${invoiceName}.pdf`;
        const s3Url = await this.s3Service.uploadPdf(pdfBuffer, s3Key, invoice.restaurantId);
        invoice.invoiceAttachmentUrl = s3Url.url;
        await this.invoiceRepository.save(invoice);
        this.logger.log(`Invoice generated for subscription change: ${invoiceName}`);
      } else {
        this.logger.warn(`Invoice already exists for period ${billingPeriod}`);
      }
    } catch (invoiceError) {
      this.logger.error('Failed to generate invoice, but subscription change succeeded', invoiceError);
      // Don't fail the transaction if invoice generation fails
    }

    // Log the subscription change
    await this.logSubscriptionChange({
      restaurantId: dto.restaurantId,
      oldPlanId: activeSubscription?.planId || null,
      newPlanId: plan.id,
      changeType: activeSubscription ? SubscriptionChangeType.PLAN_CHANGED : SubscriptionChangeType.PLAN_ASSIGNED,
      initiatedBy: SubscriptionChangeInitiator.SYSTEM,
      userId: null,
      usageId: savedSubscription.usageId ?? null,
      reason: null,
      metadata: {
        oldPlan: activeSubscription ? await this.getPlanMetadata(activeSubscription.planId) : null,
        newPlan: await this.getPlanMetadata(plan.id),
        billingCycle: savedSubscription.billingCycle,
      }
    });

    return savedSubscription;
  }

  async renewSubscription(restaurantId: string, plan: SubscriptionPlanEntity): Promise<RestaurantSubscription> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    const now = new Date();
    const startDate = this.formatDate(now);

    const billingCycle = plan.billingCycle === PlanBillingCycle.YEARLY ? BillingCycle.YEARLY : BillingCycle.MONTHLY;
    const endDate = this.formatDate(this.calculateEndDate(now, billingCycle));

    if (activeSubscription) {
      await this.expireSubscription(activeSubscription, startDate);
    }

    const newSubscription = this.restaurantSubscriptionRepository.create({
      restaurantId,
      planId: plan.id,
      startDate,
      endDate,
      billingCycle,
      isAutoRenew: true,
      status: RestaurantSubscriptionStatus.ACTIVE,
      isAutoAssigned: false,
    });

    const savedSubscription = await this.restaurantSubscriptionRepository.save(newSubscription);

    // Expire order usage count and get previous value for logging
    const monthKey = this.formatMonth(now);
    let previousUsage = 0;
    const usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
    });

    if (usage) {
      previousUsage = usage.totalOrders;
      usage.status = OrderUsageStatus.EXPIRED;
      await this.orderUsageRepository.save(usage);
      this.logger.log(`Order usage expired with ${previousUsage} orders`);
    }

    // Get current counts for tables, QRs, users
    let currentTables = await this.tableRepository.count({ where: { restaurantId } });
    let currentQRs = await this.qrCodeRepository.count({ where: { restaurantId, status: QRCodeStatus.ACTIVE } });
    let currentUsers = await this.userRepository.count({ where: { restaurantId, status: UserStatus.ACTIVE } });
    
    // Create new OrderUsage record for the new subscription
    const newUsageMonthKey = this.getBillingMonth(new Date(startDate), new Date(endDate));
    const newOrderUsage = this.orderUsageRepository.create({
      restaurantId,
      month: newUsageMonthKey,
      status: OrderUsageStatus.ACTIVE,
      planId: plan.id,
      totalOrders: 0,
      totalQRCount: currentQRs,
      totalUserCount: currentUsers,
      totalTableCount: currentTables,
      overageCount: 0,
      overageQRCount: currentQRs > plan.qrLimit ? currentQRs - plan.qrLimit : 0,
      overageUserCount: currentUsers > plan.userLimit ? currentUsers - plan.userLimit : 0,
      overageTableCount: currentTables > plan.tableLimit ? currentTables - plan.tableLimit : 0,
    });
    const savedOrderUsage = await this.orderUsageRepository.save(newOrderUsage);

    // Link new subscription to the new order usage
    savedSubscription.usageId = savedOrderUsage.id;
    await this.restaurantSubscriptionRepository.save(savedSubscription);
    this.logger.log(`New OrderUsage record created: ${savedOrderUsage.id}`);

    // Log renewal
    await this.logSubscriptionChange({
      restaurantId,
      oldPlanId: plan.id,
      newPlanId: plan.id,
      changeType: SubscriptionChangeType.PLAN_CHANGED,
      initiatedBy: SubscriptionChangeInitiator.SYSTEM,
      userId: null,
      usageId: savedSubscription.usageId ?? null,
      reason: 'Automatic renewal',
      metadata: {
        plan: await this.getPlanMetadata(plan.id),
        billingCycle: savedSubscription.billingCycle,
      }
    });

    return savedSubscription;
  }

  async changeSubscriptionPlan(
    restaurantId: string,
    dto: ChangeSubscriptionPlanDto,
    initiatedBy: SubscriptionChangeInitiator,
    userId?: string,
  ): Promise<RestaurantSubscription> {
    try {
      this.logger.log(`Starting plan change for restaurant ${restaurantId} to plan ${dto.newPlanId}`);

      const activeSubscription = await this.getActiveSubscription(restaurantId);
      if (!activeSubscription) {
        throw new BadRequestException('Restaurant has no active subscription to change');
      }

      this.logger.log(`Found active subscription: ${activeSubscription.id}`);

      const newPlan = await this.planRepository.findOne({ where: { id: dto.newPlanId } });
      if (!newPlan) {
        throw new NotFoundException('New subscription plan not found');
      }

      this.logger.log(`Found new plan: ${newPlan.name} (${newPlan.code})`);

      if (newPlan.isArchived) {
        throw new BadRequestException('Cannot assign an archived subscription plan');
      }

      if (newPlan.status !== SubscriptionPlanStatus.ACTIVE) {
        throw new BadRequestException('Cannot assign an inactive subscription plan');
      }

      if (activeSubscription.planId === dto.newPlanId) {
        throw new BadRequestException('Restaurant is already subscribed to this plan');
      }

      const oldPlan = await this.planRepository.findOne({ where: { id: activeSubscription.planId } });
      this.logger.log(`Found old plan: ${oldPlan?.name || 'Unknown'}`);

      const isDowngrade = oldPlan && newPlan.priceMonthly &&
        parseFloat(newPlan.priceMonthly) < parseFloat(oldPlan.priceMonthly || '0');

      // If it's a downgrade, validate usage and payments
      if (isDowngrade) {
        this.logger.log('Validating downgrade requirements...');
        await this.validateDowngrade(restaurantId, oldPlan!, newPlan);
      }

      // Determine change type
      let changeType = SubscriptionChangeType.PLAN_CHANGED;
      if (oldPlan && newPlan.priceMonthly) {
        const oldPrice = parseFloat(oldPlan.priceMonthly || '0');
        const newPrice = parseFloat(newPlan.priceMonthly || '0');
        if (newPrice > oldPrice) {
          changeType = SubscriptionChangeType.PLAN_UPGRADED;
        } else if (newPrice < oldPrice) {
          changeType = SubscriptionChangeType.PLAN_DOWNGRADED;
        }
      }

      this.logger.log(`Change type determined: ${changeType}`);

      return this.restaurantSubscriptionRepository.manager.transaction(async (transactionalEntityManager) => {
        try {
          // Expire old subscription with current date
          const now = new Date();
          const expireDate = this.formatDate(now);
          activeSubscription.status = RestaurantSubscriptionStatus.EXPIRED;
          activeSubscription.endDate = expireDate;
          await transactionalEntityManager.save(activeSubscription);

          this.logger.log('Old subscription expired');

          // Create new subscription starting today
          const startDate = this.formatDate(now);
          const billingCycle = dto.billingCycle ?? activeSubscription.billingCycle;
          const endDate = this.formatDate(this.calculateEndDate(now, billingCycle));

          const newSubscription = this.restaurantSubscriptionRepository.create({
            restaurantId,
            planId: newPlan.id,
            startDate,
            endDate,
            billingCycle,
            isAutoRenew: activeSubscription.isAutoRenew,
            status: RestaurantSubscriptionStatus.ACTIVE,
            isAutoAssigned: false
          });

          const savedSubscription = await transactionalEntityManager.save(newSubscription);
          this.logger.log(`New subscription created: ${savedSubscription.id}`);

          // Expire order usage count and get previous value for logging
          const monthKey = this.formatMonth(now);
          let previousUsage = 0;
          const usage = await this.orderUsageRepository.findOne({
            where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
          });

          if (usage) {
            previousUsage = usage.totalOrders;
            usage.status = OrderUsageStatus.EXPIRED;
            await this.orderUsageRepository.save(usage);
            this.logger.log(`Order usage expired with ${previousUsage} orders`);
          }

          // Get current counts for tables, QRs, users
          let currentTables = await this.tableRepository.count({ where: { restaurantId } });
          let currentQRs = await this.qrCodeRepository.count({ where: { restaurantId, status: QRCodeStatus.ACTIVE } });
          let currentUsers = await this.userRepository.count({ where: { restaurantId, status: UserStatus.ACTIVE } });

          // Create new OrderUsage record for the new subscription
          const newUsageMonthKey = this.getBillingMonth(new Date(startDate), new Date(endDate));
          const newOrderUsage = this.orderUsageRepository.create({
            restaurantId,
            month: newUsageMonthKey,
            status: OrderUsageStatus.ACTIVE,
            planId: newPlan.id,
            totalOrders: 0,
            totalQRCount: currentQRs,
            totalUserCount: currentUsers,
            totalTableCount: currentTables,
            overageCount: 0,
            overageQRCount: currentQRs > activeSubscription.plan.qrLimit ? currentQRs - activeSubscription.plan.qrLimit : 0,
            overageUserCount: currentUsers > activeSubscription.plan.userLimit ? currentUsers - activeSubscription.plan.userLimit : 0,
            overageTableCount: currentTables > activeSubscription.plan.tableLimit ? currentTables - activeSubscription.plan.tableLimit : 0,
          });
          const savedOrderUsage = await transactionalEntityManager.save(newOrderUsage);

          // Link new subscription to the new order usage
          savedSubscription.usageId = savedOrderUsage.id;
          await transactionalEntityManager.save(savedSubscription);
          this.logger.log(`New OrderUsage record created: ${savedOrderUsage.id}`);

          // Generate invoice for the new subscription
          try {
            const invoiceStartDate = new Date(savedSubscription.startDate);
            const invoiceEndDate = new Date(savedSubscription.endDate);
            const billingPeriod = this.getBillingPeriodForDates(invoiceStartDate, invoiceEndDate);

            // Check for existing invoice
            const existingInvoice = await this.invoiceRepository.findOne({
              where: {
                restaurantId: savedSubscription.restaurantId,
                billing_period: billingPeriod,
                restaurantSubscriptionId: savedSubscription.id,
                type: InvoiceType.SUBSCRIPTION
              },
            });

            if (!existingInvoice) {
              let amount = 0, base_amount = 0, fees = 0;
              if (savedSubscription.billingCycle === 'monthly') {
                base_amount = Number(newPlan.priceMonthly) || 0;
              } else if (savedSubscription.billingCycle === 'yearly') {
                base_amount = Number(newPlan.priceYearly) || 0;
              }
              amount = base_amount + fees;

              const yearMonth = `${invoiceStartDate.getUTCFullYear()}${String(invoiceStartDate.getUTCMonth() + 1).padStart(2, '0')}`;
              const invoiceName = `INV-${yearMonth}`;

              const invoice = this.invoiceRepository.create({
                invoiceName: invoiceName,
                restaurantId: savedSubscription.restaurantId,
                planId: newPlan.id,
                billing_period: billingPeriod,
                billing_period_start: `${invoiceStartDate.getUTCFullYear()}-${String(invoiceStartDate.getUTCMonth() + 1).padStart(2, '0')}-${String(invoiceStartDate.getUTCDate()).padStart(2, '0')}`,
                billing_period_end: `${invoiceEndDate.getUTCFullYear()}-${String(invoiceEndDate.getUTCMonth() + 1).padStart(2, '0')}-${String(invoiceEndDate.getUTCDate()).padStart(2, '0')}`,
                amount,
                base_amount,
                fees,
                status: InvoiceStatus.PAID,
                due_date: `${invoiceStartDate.getUTCFullYear()}-${String(invoiceStartDate.getUTCMonth() + 1).padStart(2, '0')}-${String(invoiceStartDate.getUTCDate()).padStart(2, '0')}`,
                paid_date: `${invoiceStartDate.getUTCFullYear()}-${String(invoiceStartDate.getUTCMonth() + 1).padStart(2, '0')}-${String(invoiceStartDate.getUTCDate()).padStart(2, '0')}`,
                restaurantSubscriptionId: savedSubscription.id,
                type: InvoiceType.SUBSCRIPTION
              });

              const pdfBuffer = await this.generateInvoicePdf(invoice);
              const s3Key = `${invoiceName}.pdf`;
              const s3Url = await this.s3Service.uploadPdf(pdfBuffer, s3Key, invoice.restaurantId);
              invoice.invoiceAttachmentUrl = s3Url.url;
              await transactionalEntityManager.save(invoice);
              this.logger.log(`Invoice generated for subscription change: ${invoiceName}`);
            } else {
              this.logger.warn(`Invoice already exists for period ${billingPeriod}`);
            }
          } catch (invoiceError) {
            this.logger.error('Failed to generate invoice, but subscription change succeeded', invoiceError);
            // Don't fail the transaction if invoice generation fails
          }

          // Log the subscription change
          try {
            const log = this.changeLogRepository.create({
              restaurantId,
              oldPlanId: oldPlan?.id || null,
              newPlanId: newPlan.id,
              changeType,
              initiatedBy,
              userId: userId || null,
              reason: dto.reason || null,
              metadata: {
                oldPlan: oldPlan ? {
                  id: oldPlan.id,
                  name: oldPlan.name,
                  code: oldPlan.code,
                  orderLimit: oldPlan.orderLimit,
                  qrLimit: oldPlan.qrLimit,
                  userLimit: oldPlan.userLimit,
                  tableLimit: oldPlan.tableLimit,
                } : null,
                newPlan: {
                  id: newPlan.id,
                  name: newPlan.name,
                  code: newPlan.code,
                  orderLimit: newPlan.orderLimit,
                  qrLimit: newPlan.qrLimit,
                  userLimit: newPlan.userLimit,
                  tableLimit: newPlan.tableLimit,
                },
                billingCycle: savedSubscription.billingCycle,
                previousUsage,
                usageReset: true,
                priceChange: oldPlan && newPlan.priceMonthly ? {
                  old: oldPlan.priceMonthly,
                  new: newPlan.priceMonthly,
                } : null,
              }
            });
            await transactionalEntityManager.save(log);
            this.logger.log('Change log created successfully');
          } catch (logError) {
            this.logger.error('Failed to create change log, but subscription change succeeded', logError);
            // Don't fail the transaction if logging fails
          }

          this.logger.log(
            `Subscription plan changed for restaurant ${restaurantId}: ${oldPlan?.name} → ${newPlan.name} (${changeType}) by ${initiatedBy}. Order count reset from ${previousUsage} to 0.`
          );

          return savedSubscription;
        } catch (transactionError) {
          this.logger.error('Transaction error in changeSubscriptionPlan', transactionError);
          throw transactionError;
        }
      });
    } catch (error) {
      this.logger.error(`Error changing subscription plan for restaurant ${restaurantId}:`, error);

      // Re-throw known errors
      if (error instanceof NotFoundException ||
        error instanceof BadRequestException) {
        throw error;
      }

      // Log and throw generic error for unknown issues
      this.logger.error('Unexpected error in changeSubscriptionPlan', {
        restaurantId,
        newPlanId: dto.newPlanId,
        initiatedBy,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      throw new BadRequestException(
        `Failed to change subscription plan: ${error instanceof Error ? error.message : 'Unknown error'}. Please contact support if this persists.`
      );
    }
  }

  private async logSubscriptionChange(data: {
    restaurantId: string;
    oldPlanId: string | null;
    newPlanId: string | null;
    changeType: SubscriptionChangeType;
    initiatedBy: SubscriptionChangeInitiator;
    userId: string | null;
    usageId: string | null;
    reason: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<void> {
    const log = this.changeLogRepository.create(data);
    await this.changeLogRepository.save(log);
  }

  private async getPlanMetadata(planId: string): Promise<any> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) return null;

    return {
      id: plan.id,
      name: plan.name,
      code: plan.code,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      orderLimit: plan.orderLimit,
      qrLimit: plan.qrLimit,
      userLimit: plan.userLimit,
      tableLimit: plan.tableLimit,
    };
  }

  async getSubscriptionChangeLogs(restaurantId: string, limit: number = 50): Promise<SubscriptionChangeLog[]> {
    return this.changeLogRepository.find({
      where: { restaurantId },
      relations: ['oldPlan', 'newPlan', 'user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRestaurantSubscriptions(restaurantId: string): Promise<RestaurantSubscription[]> {
    return this.restaurantSubscriptionRepository.find({
      where: { restaurantId },
      order: { startDate: 'DESC' },
      relations: ['plan'],
    });
  }

  async getActiveSubscription(restaurantId: string): Promise<RestaurantSubscription | null> {
    return this.restaurantSubscriptionRepository.findOne({
      where: { restaurantId, status: RestaurantSubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
  }

  async recordOrderUsage(restaurantId: string, orderDate?: Date, count?: number): Promise<OrderUsage> {
    orderDate = orderDate ?? new Date();
    count = count ?? 1;

    // Get active subscription with plan details in one query
    const subscription = await this.getActiveSubscription(restaurantId);
    if (!subscription) {
      throw new BadRequestException('Restaurant must have an active subscription to record order usage');
    }

    if (count <= 0) {
      throw new BadRequestException('Order count must be greater than zero');
    }

    // Convert startDate and endDate (string) to Date objects
    const startDateObj = subscription.startDate ? new Date(subscription.startDate) : null;
    const endDateObj = subscription.endDate ? new Date(subscription.endDate) : null;
    if (!startDateObj || !endDateObj) {
      throw new BadRequestException('Invalid subscription dates');
    }
    // Always use the plan from the active subscription
    const plan = subscription.plan;
    const monthKey = this.getBillingMonth(startDateObj, endDateObj);

    let usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: subscription.usageId, status: OrderUsageStatus.ACTIVE }
    });

    if (!usage) {
      usage = this.orderUsageRepository.create({
        restaurantId,
        month: monthKey,
        status: OrderUsageStatus.ACTIVE,
        planId: plan?.id || null,
        totalOrders: 1,
        totalUserCount: 0,
        overageUserCount: 0,
      });
    } else {
      usage.totalOrders = (usage.totalOrders || 0) + 1;
    }
    // if (!usage) {
    //   usage = this.orderUsageRepository.create({
    //     restaurantId,
    //     month: monthKey,
    //     status: OrderUsageStatus.ACTIVE,
    //     totalOrders: count,
    //   });
    // } else {
    //   usage.totalOrders += count;
    // }

    //usage.planId = plan?.id ?? null;
    //usage.overageCount = this.calculateOverage(usage.totalOrders, plan);

    // Check for overage
    if (plan.orderLimit && usage.totalOrders > plan.orderLimit) {
      usage.overageCount = (usage.overageCount || 0) + 1;
    }
    const savedUsage = await this.orderUsageRepository.save(usage);

    // Update activeSubscription's usageId to reference this usage
    if (subscription.usageId !== savedUsage.id) {
      subscription.usageId = savedUsage.id;
      await this.restaurantSubscriptionRepository.save(subscription);
    }

    return savedUsage;
  }

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

  async getOrderUsage(restaurantId: string, month?: string): Promise<OrderUsage[]> {
    const where: FindOptionsWhere<OrderUsage> = { restaurantId };
    if (month) {
      where.month = month;
    }
    return this.orderUsageRepository.find({ where, order: { month: 'DESC' }, relations: ['plan'] });
  }

  async evaluateRestaurantSubscription(restaurantId: string, month?: string): Promise<{
    usage: OrderUsage | null;
    plan: SubscriptionPlanEntity | null;
    subscription: RestaurantSubscription | null;
  }> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) {
      return { usage: null, plan: null, subscription: null };
    }

    // Use billing month from active subscription
    const startDateObj = new Date(activeSubscription.startDate);
    const endDateObj = new Date(activeSubscription.endDate);
    const monthKey = month ?? this.getBillingMonth(startDateObj, endDateObj);

    const usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
    });

    if (!usage) {
      return { usage: null, plan: activeSubscription.plan, subscription: activeSubscription };
    }

    usage.planId = activeSubscription.planId;
    usage.overageCount = this.calculateOverage(usage.totalOrders, activeSubscription.plan);
    const savedUsage = await this.orderUsageRepository.save(usage);

    return { usage: savedUsage, plan: activeSubscription.plan, subscription: activeSubscription };
  }

  async canRestaurantCreateOrder(restaurantId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentOrders?: number;
    orderLimit?: number;
    plan?: SubscriptionPlanEntity;
    isOverage?: boolean;
  }> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);

    if (!activeSubscription) {
      return {
        allowed: false,
        reason: 'Restaurant does not have an active subscription plan. Please choose a plan to continue.',
        currentOrders: 0,
      };
    }

    // Convert startDate and endDate (string) to Date objects
    const startDateObj = activeSubscription.startDate ? new Date(activeSubscription.startDate) : null;
    const endDateObj = activeSubscription.endDate ? new Date(activeSubscription.endDate) : null;
    if (!startDateObj || !endDateObj) {
      throw new BadRequestException('Invalid subscription dates');
    }

    const monthKey = this.getBillingMonth(startDateObj, endDateObj);
    let usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
    });

    const currentOrders = usage?.totalOrders ?? 0;

    // Check their plan limits
    const plan = activeSubscription.plan;

    if (!plan.orderLimit || plan.orderLimit === 0) {
      // Unlimited plan
      return {
        allowed: true,
        currentOrders,
        plan,
      };
    }

    // If plan is trial, block order creation if limit is reached or exceeded
    if (plan.code === 'trial' && currentOrders >= plan.orderLimit) {
      return {
        allowed: false,
        reason: `Trial plan order limit of ${plan.orderLimit} reached. Upgrade to continue placing orders.`,
        currentOrders,
        orderLimit: plan.orderLimit,
        plan,
        isOverage: false,
      };
    }

    // Allow orders even if limit is exceeded - track for excessive usage billing (for non-trial plans)
    if ((currentOrders + 1) > plan.orderLimit) {
      return {
        allowed: true, // Allow all plans for excessive usage tracking and billing
        reason: `Order limit of ${plan.orderLimit} reached for ${plan.name}. Current orders: ${currentOrders}. Additional orders will be charged as per overage policy.`,
        currentOrders,
        orderLimit: plan.orderLimit,
        plan,
        isOverage: true, // Flag for billing system
      };
    }

    return {
      allowed: true,
      currentOrders,
      orderLimit: plan.orderLimit,
      plan,
    };
  }

  async canCreateTable(restaurantId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentTables?: number;
    tableLimit?: number;
    plan?: SubscriptionPlanEntity;
  }> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) {
      return {
        allowed: false,
        reason: 'No active subscription found'
      };
    }

    const plan = activeSubscription.plan;
    // Get currentTables from orderUsage table (totalUserCount for current billing month)
    const startDateObj = activeSubscription.startDate ? new Date(activeSubscription.startDate) : null;
    const endDateObj = activeSubscription.endDate ? new Date(activeSubscription.endDate) : null;
    let currentTables = 0;
    if (startDateObj && endDateObj) {
      const monthKey = this.getBillingMonth(startDateObj, endDateObj);
      const usage = await this.orderUsageRepository.findOne({
        where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
      });
      currentTables = usage?.totalTableCount || 0;
    }

    // If plan has no table limit (null or 0), allow unlimited tables
    if (!plan.tableLimit || plan.tableLimit === 0) {
      return {
        allowed: true,
        currentTables,
        plan
      };
    }

    // If plan is trial, block table creation if limit is reached or exceeded
    if (plan.code === 'trial' && currentTables >= plan.tableLimit) {
      return {
        allowed: false,
        reason: `Trial plan table limit of ${plan.tableLimit} reached. Upgrade to add more tables.`,
        currentTables,
        tableLimit: plan.tableLimit,
        plan
      };
    }

    // Allow table creation even if limit is reached, but notify user (for non-trial plans)
    if (currentTables >= plan.tableLimit) {
      return {
        allowed: true,
        reason: `Table limit of ${plan.tableLimit} reached for ${plan.name}. Current tables: ${currentTables}. Additional tables will be charged as per overage policy.`,
        currentTables,
        tableLimit: plan.tableLimit,
        plan
      };
    }

    return {
      allowed: true,
      currentTables,
      tableLimit: plan.tableLimit,
      plan
    };
  }

  async canCreateUser(restaurantId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsers?: number;
    userLimit?: number;
    plan?: SubscriptionPlanEntity;
  }> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) {
      return { allowed: false, reason: 'No active subscription found' };
    }

    const plan = activeSubscription.plan;
    // Get currentUsers from orderUsage table (totalUserCount for current billing month)
    const startDateObj = activeSubscription.startDate ? new Date(activeSubscription.startDate) : null;
    const endDateObj = activeSubscription.endDate ? new Date(activeSubscription.endDate) : null;
    let currentUsers = 0;
    if (startDateObj && endDateObj) {
      const monthKey = this.getBillingMonth(startDateObj, endDateObj);
      const usage = await this.orderUsageRepository.findOne({
        where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
      });
      currentUsers = usage?.totalUserCount || 0;
    }

    if (!plan.userLimit || plan.userLimit === 0) {
      return { allowed: true, currentUsers, plan };
    }

    // If plan is trial, block user creation if limit is reached or exceeded
    if (plan.code === 'trial' && currentUsers >= plan.userLimit) {
      return {
        allowed: false,
        reason: `Trial plan user limit of ${plan.userLimit} reached. Upgrade to add more users.`,
        currentUsers,
        userLimit: plan.userLimit,
        plan,
      };
    }

    if (currentUsers >= plan.userLimit) {
      return {
        allowed: true,
        reason: `User limit of ${plan.userLimit} reached for ${plan.name}. Current users: ${currentUsers}. Additional users will be charged as per overage policy.`,
        currentUsers,
        userLimit: plan.userLimit,
        plan,
      };
    }

    return { allowed: true, currentUsers, userLimit: plan.userLimit, plan };
  }

  async canCreateQRCode(restaurantId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentQRCodes?: number;
    qrLimit?: number;
    plan?: SubscriptionPlanEntity;
  }> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) {
      return { allowed: false, reason: 'No active subscription found' };
    }

    const plan = activeSubscription.plan;
    // Get currentQRCodes from orderUsage table (totalQRCodeCount for current billing month)
    const startDateObj = activeSubscription.startDate ? new Date(activeSubscription.startDate) : null;
    const endDateObj = activeSubscription.endDate ? new Date(activeSubscription.endDate) : null;
    let currentQRCodes = 0;
    if (startDateObj && endDateObj) {
      const monthKey = this.getBillingMonth(startDateObj, endDateObj);
      const usage = await this.orderUsageRepository.findOne({
        where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
      });
      currentQRCodes = usage?.totalQRCount || 0;
    }

    if (!plan.qrLimit || plan.qrLimit === 0) {
      return { allowed: true, currentQRCodes, plan };
    }

    // If plan is trial, block QR code creation if limit is reached or exceeded
    if (plan.code === 'trial' && currentQRCodes >= plan.qrLimit) {
      return {
        allowed: false,
        reason: `Trial plan QR code limit of ${plan.qrLimit} reached. Upgrade to add more QR codes.`,
        currentQRCodes,
        qrLimit: plan.qrLimit,
        plan,
      };
    }

    if (currentQRCodes >= plan.qrLimit) {
      return {
        allowed: true,
        reason: `QR code limit of ${plan.qrLimit} reached for ${plan.name}. Current QR codes: ${currentQRCodes}. Additional QR codes will be charged as per overage policy.`,
        currentQRCodes,
        qrLimit: plan.qrLimit,
        plan,
      };
    }

    return { allowed: true, currentQRCodes, qrLimit: plan.qrLimit, plan };
  }

  /**
   * Get real-time subscription usage with live order count (completed orders only)
   * @param restaurantId Restaurant ID
   * @returns Subscription usage details with billing information
   */
  async getRestaurantSubscriptionUsage(restaurantId: string): Promise<{
    restaurant: {
      id: string;
      name: string;
    };
    subscription: {
      id: string;
      planId: string;
      planName: string;
      planCode: string;
      billingCycle: string;
      startDate: string;
      endDate: string | null;
      status: string;
      isAutoRenew: boolean;
      features: string[];
    } | null;
    billing: {
      currentPeriodStart: string;
      currentPeriodEnd: string;
      priceMonthly: number | null;
      priceYearly: number | null;
      currentPrice: number | null;
      nextBillingDate: string | null;
      invoiceTotal: number | null;
    };
    usage: {
      currentMonth: string;
      completedOrders: number;
      orderLimit: number | null;
      remainingOrders: number | null;
      usagePercentage: number | null;
      isUnlimited: boolean;
      isOverLimit: boolean;
      overageCount: number;
    };
    recommendations: {
      shouldUpgrade: boolean;
      suggestedPlan: {
        id: string;
        name: string;
        code: string;
        priceMonthly: number | null;
        priceYearly: number | null;
        orderLimit: number | null;
      } | null;
      reason: string | null;
    };
  }> {
    // Get restaurant
    const restaurant = await this.restaurantRepository.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Get active subscription with plan details
    const activeSubscription = await this.getActiveSubscription(restaurantId);

    const currentMonth = this.formatMonth(new Date());

    // Get real-time count of COMPLETED orders for current month
    const monthRange = this.getMonthDateRange(new Date());
    // const completedOrdersCount = await this.orderRepository
    //   .createQueryBuilder('order')
    //   .where('order.restaurantId = :restaurantId', { restaurantId })
    //   .andWhere('order.status = :status', { status: 'completed' })
    //   .andWhere('order.createdAt >= :start', { start: monthRange.start })
    //   .andWhere('order.createdAt <= :end', { end: monthRange.end })
    //   .getCount();

    const orderUsage = await this.orderUsageRepository.findOne({
      where: { restaurantId, status: OrderUsageStatus.ACTIVE }
    });

    const completedOrdersCount = orderUsage ? orderUsage.totalOrders : 0;

    // Prepare subscription details
    let subscriptionDetails = null;
    let billingDetails = null;
    let currentPrice = null;
    let orderLimit = null;

    if (activeSubscription) {
      const plan = activeSubscription.plan;
      const priceMonthly = plan.priceMonthly ? parseFloat(plan.priceMonthly) : null;
      const priceYearly = plan.priceYearly ? parseFloat(plan.priceYearly) : null;

      currentPrice = activeSubscription.billingCycle === BillingCycle.YEARLY ? priceYearly : priceMonthly;
      orderLimit = plan.orderLimit;

      subscriptionDetails = {
        id: activeSubscription.id,
        planId: plan.id,
        planName: plan.name,
        planCode: plan.code,
        billingCycle: activeSubscription.billingCycle,
        startDate: activeSubscription.startDate,
        endDate: activeSubscription.endDate,
        status: activeSubscription.status,
        isAutoRenew: activeSubscription.isAutoRenew,
        features: plan.features || [],
      };

      // Calculate billing period
      const startDate = new Date(activeSubscription.startDate);
      const periodStart = this.formatDate(startDate);

      let periodEnd: Date;
      let nextBillingDate: Date;

      if (activeSubscription.billingCycle === BillingCycle.YEARLY) {
        periodEnd = new Date(startDate);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        nextBillingDate = periodEnd;
      } else {
        periodEnd = new Date(startDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        nextBillingDate = periodEnd;
      }

      billingDetails = {
        currentPeriodStart: periodStart,
        currentPeriodEnd: this.formatDate(periodEnd),
        priceMonthly,
        priceYearly,
        currentPrice,
        nextBillingDate: activeSubscription.isAutoRenew ? this.formatDate(nextBillingDate) : null,
        invoiceTotal: currentPrice,
      };
    } else {
      billingDetails = {
        currentPeriodStart: this.formatDate(new Date()),
        currentPeriodEnd: this.formatDate(this.getMonthEnd(new Date())),
        priceMonthly: null,
        priceYearly: null,
        currentPrice: null,
        nextBillingDate: null,
        invoiceTotal: null,
      };
    }

    // Calculate usage stats
    const isUnlimited = orderLimit === null || orderLimit === 0;
    const remainingOrders = isUnlimited ? null : Math.max(0, (orderLimit || 0) - completedOrdersCount);
    const usagePercentage = isUnlimited
      ? null
      : orderLimit && orderLimit > 0
        ? Math.round((completedOrdersCount / orderLimit) * 100)
        : null;
    const isOverLimit = !isUnlimited && orderLimit !== null && completedOrdersCount > orderLimit;
    const overageCount = isOverLimit ? completedOrdersCount - (orderLimit || 0) : 0;

    const usageDetails = {
      currentMonth,
      completedOrders: completedOrdersCount,
      orderLimit: orderLimit || null,
      remainingOrders,
      usagePercentage,
      isUnlimited,
      isOverLimit,
      overageCount,
    };

    // Get upgrade recommendations
    const recommendations = await this.getUpgradeRecommendation(
      completedOrdersCount,
      activeSubscription,
      usagePercentage,
    );

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
      subscription: subscriptionDetails,
      billing: billingDetails,
      usage: usageDetails,
      recommendations,
    };
  }

  /**
 * Update startDate and endDate for all subscriptions of a restaurant
 */
  async updateSubscriptionDatesByRestaurantId(
    restaurantId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    // Validate dates
    if (!startDate || !endDate) {
      throw new BadRequestException('Both startDate and endDate are required');
    }
    // Optionally, validate date format here
    const updateResult = await this.restaurantSubscriptionRepository.update(
      { restaurantId, status: RestaurantSubscriptionStatus.ACTIVE },
      { startDate, endDate }
    );
    return updateResult.affected || 0;
  }

  /**
 * Increment userCount and overageUserCount in order_usage for the current month
 */
  async incrementOrderUsageUserCount(restaurantId: string): Promise<void> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) return;
    const plan = activeSubscription.plan;
    const startDateObj = activeSubscription.startDate ? new Date(activeSubscription.startDate) : null;
    const endDateObj = activeSubscription.endDate ? new Date(activeSubscription.endDate) : null;
    if (!startDateObj || !endDateObj) return;
    const monthKey = this.getBillingMonth(startDateObj, endDateObj);
    let usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
    });
    if (!usage) {
      usage = this.orderUsageRepository.create({
        restaurantId,
        month: monthKey,
        status: OrderUsageStatus.ACTIVE,
        planId: plan?.id || null,
        totalOrders: 0,
        totalUserCount: 1,
        overageUserCount: 0,
      });
    } else {
      usage.totalUserCount = (usage.totalUserCount || 0) + 1;
    }
    // Check for overage
    if (plan.userLimit && usage.totalUserCount > plan.userLimit) {
      usage.overageUserCount = (usage.overageUserCount || 0) + 1;
    }
    const savedUsage = await this.orderUsageRepository.save(usage);

    // Update activeSubscription's usageId to reference this usage
    if (activeSubscription.usageId !== savedUsage.id) {
      activeSubscription.usageId = savedUsage.id;
      await this.restaurantSubscriptionRepository.save(activeSubscription);
    }
  }

  async decrementOrderUsageUserCount(restaurantId: string): Promise<void> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) return;
    const plan = activeSubscription.plan;
    const startDateObj = activeSubscription.startDate ? new Date(activeSubscription.startDate) : null;
    const endDateObj = activeSubscription.endDate ? new Date(activeSubscription.endDate) : null;
    if (!startDateObj || !endDateObj) return;
    const monthKey = this.getBillingMonth(startDateObj, endDateObj);
    let usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
    });
    if (usage && usage.totalUserCount && usage.totalUserCount > 0) {
      usage.totalUserCount -= 1;
      // Optionally, reduce overageUserCount if needed
      if (plan.userLimit && usage.totalUserCount <= plan.userLimit && usage.overageUserCount > 0) {
        usage.overageUserCount -= 1;
      }
      await this.orderUsageRepository.save(usage);
    }
  }

  /**
 * Increment tableCount and overageTableCount in order_usage for the current month
 */
  async incrementOrderUsageTableCount(restaurantId: string): Promise<void> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) return;
    const plan = activeSubscription.plan;
    const startDateObj = activeSubscription.startDate ? new Date(activeSubscription.startDate) : null;
    const endDateObj = activeSubscription.endDate ? new Date(activeSubscription.endDate) : null;
    if (!startDateObj || !endDateObj) return;
    const monthKey = this.getBillingMonth(startDateObj, endDateObj);
    let usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
    });
    if (!usage) {
      usage = this.orderUsageRepository.create({
        restaurantId,
        month: monthKey,
        status: OrderUsageStatus.ACTIVE,
        planId: plan?.id || null,
        totalOrders: 0,
        totalTableCount: 1,
        totalQRCount: 1,
        overageTableCount: 0,
      });
    } else {
      usage.totalTableCount = (usage.totalTableCount || 0) + 1;
      usage.totalQRCount = (usage.totalQRCount || 0) + 1;
    }
    // Check for overage
    if (plan.tableLimit && usage.totalTableCount > plan.tableLimit) {
      usage.overageTableCount = (usage.overageTableCount || 0) + 1;
    }
    if (plan.qrLimit && usage.totalQRCount > plan.qrLimit) {
      usage.overageQRCount = (usage.overageQRCount || 0) + 1;
    }
    const savedUsage = await this.orderUsageRepository.save(usage);

    // Update activeSubscription's usageId to reference this usage
    if (activeSubscription.usageId !== savedUsage.id) {
      activeSubscription.usageId = savedUsage.id;
      await this.restaurantSubscriptionRepository.save(activeSubscription);
    }
  }

  async decrementOrderUsageTableCount(restaurantId: string): Promise<void> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) return;
    const plan = activeSubscription.plan;
    const startDateObj = activeSubscription.startDate ? new Date(activeSubscription.startDate) : null;
    const endDateObj = activeSubscription.endDate ? new Date(activeSubscription.endDate) : null;
    if (!startDateObj || !endDateObj) return;
    const monthKey = this.getBillingMonth(startDateObj, endDateObj);
    let usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
    });
    if (usage && usage.totalTableCount && usage.totalTableCount > 0) {
      usage.totalTableCount -= 1;
      // Optionally, reduce overageTableCount if needed
      if (plan.tableLimit && usage.totalTableCount <= plan.tableLimit && usage.overageTableCount > 0) {
        usage.overageTableCount -= 1;
      }
    }
    if (usage && usage.totalQRCount && usage.totalQRCount > 0) {
      usage.totalQRCount -= 1;
      // Optionally, reduce overageTableCount if needed
      if (plan.qrLimit && usage.totalQRCount <= plan.qrLimit && usage.overageQRCount > 0) {
        usage.overageQRCount -= 1;
      } 
    }

    await this.orderUsageRepository.save(usage);
  }

  /**
   * Increment qrCount and overageQRCodeCount in order_usage for the current month
   */
  async incrementOrderUsageQRCodeCount(restaurantId: string): Promise<void> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) return;
    const plan = activeSubscription.plan;
    const startDateObj = activeSubscription.startDate ? new Date(activeSubscription.startDate) : null;
    const endDateObj = activeSubscription.endDate ? new Date(activeSubscription.endDate) : null;
    if (!startDateObj || !endDateObj) return;
    const monthKey = this.getBillingMonth(startDateObj, endDateObj);
    let usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
    });
    if (!usage) {
      usage = this.orderUsageRepository.create({
        restaurantId,
        month: monthKey,
        status: OrderUsageStatus.ACTIVE,
        planId: plan?.id || null,
        totalOrders: 0,
        totalQRCount: 1,
        overageQRCount: 0,
      });
    } else {
      usage.totalQRCount = (usage.totalQRCount || 0) + 1;
    }
    // Check for overage
    if (plan.qrLimit && usage.totalQRCount > plan.qrLimit) {
      usage.overageQRCount = (usage.overageQRCount || 0) + 1;
    }
    const savedUsage = await this.orderUsageRepository.save(usage);

    // Update activeSubscription's usageId to reference this usage
    if (activeSubscription.usageId !== savedUsage.id) {
      activeSubscription.usageId = savedUsage.id;
      await this.restaurantSubscriptionRepository.save(activeSubscription);
    }
  }

  async decrementOrderUsageQRCodeCount(restaurantId: string): Promise<void> {
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) return;
    const plan = activeSubscription.plan;
    const startDateObj = activeSubscription.startDate ? new Date(activeSubscription.startDate) : null;
    const endDateObj = activeSubscription.endDate ? new Date(activeSubscription.endDate) : null;
    if (!startDateObj || !endDateObj) return;
    const monthKey = this.getBillingMonth(startDateObj, endDateObj);
    let usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
    });
    if (usage && usage.totalQRCount && usage.totalQRCount > 0) {
      usage.totalQRCount -= 1;
      // Optionally, reduce overageTableCount if needed
      if (plan.qrLimit && usage.totalQRCount <= plan.qrLimit && usage.overageQRCount > 0) {
        usage.overageQRCount -= 1;
      }
      await this.orderUsageRepository.save(usage);
    }
  }

  async createSpecializedPlans(dto: CreateSpecializedSubscriptionPlanDto): Promise<SubscriptionPlanEntity[]> {
    const { plan, tenantIds } = dto;
    const codeBase = plan.code.toLowerCase();
    const createdPlans: SubscriptionPlanEntity[] = [];

    // Helper to convert number/null/undefined to string/null
    const toMoney = (val: any) =>
      val === undefined || val === null ? null : typeof val === 'number' ? val.toFixed(2) : String(val);

    // Create a specializedPlanId for each tenantId
    const specializedPlanId = crypto.randomUUID();

    for (const tenantId of tenantIds) {
      // Ensure unique code per tenant
      const code = `${codeBase}`;
      const exists = await this.planRepository.findOne({ where: { code, tenantId } });
      if (exists) {
        throw new BadRequestException(`Specialized plan for tenantId '${tenantId}' with code '${code}' already exists.`);
      }
      const newPlan = this.planRepository.create({
        ...plan,
        code,
        isSpecializedPlan: true,
        tenantId,
        priceMonthly: toMoney(plan.priceMonthly),
        priceYearly: toMoney(plan.priceYearly),
        overageChargePerInvoice: toMoney(plan.overageChargePerInvoice),
        overageChargePerUser: toMoney(plan.overageChargePerUser),
        overageChargePerQR: toMoney(plan.overageChargePerQR),
        overageChargePerTable: toMoney(plan.overageChargePerTable),
        specializedPlanId,
      });
      createdPlans.push(await this.planRepository.save(newPlan));
    }
    return createdPlans;
  }

  async getPlansByTenantId(tenantId: string): Promise<SubscriptionPlanEntity[]> {
    return this.planRepository.find({
      where: { tenantId, isArchived: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
 * Get order usage for the current subscription cycle by usageId
 */
  async getOrderUsageForCurrentCycle(restaurantId: string, usageId: string): Promise<UsageSummaryCardDto | null> {
    const usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, id: usageId, status: OrderUsageStatus.ACTIVE },
      relations: ['plan'],
    });
    if (!usage) return null;

    // Calculate overage costs using plan's overage charges
    const plan = usage.plan;
    const overageInvoiceCost = plan?.overageChargePerInvoice && usage.overageCount
      ? parseFloat(plan.overageChargePerInvoice) * usage.overageCount
      : 0;
    const overageTableCost = plan?.overageChargePerTable && usage.overageTableCount
      ? parseFloat(plan.overageChargePerTable) * usage.overageTableCount
      : 0;
    const overageQRCost = plan?.overageChargePerQR && usage.overageQRCount
      ? parseFloat(plan.overageChargePerQR) * usage.overageQRCount
      : 0;
    const overageUserCost = plan?.overageChargePerUser && usage.overageUserCount
      ? parseFloat(plan.overageChargePerUser) * usage.overageUserCount
      : 0;
    const totalOverageCost = overageInvoiceCost + overageTableCost + overageQRCost + overageUserCost;

    const RestaurantSubscription = await this.getActiveSubscription(restaurantId);
    if (!RestaurantSubscription) {
      throw new NotFoundException('Active subscription not found for restaurant');
    }

    const billingDate = RestaurantSubscription.endDate;

    return {
      restaurantId: usage.restaurantId,
      orderUsageId: usage.id,
      month: usage.month,
      overageInvoiceCost,
      overageTableCost,
      overageQRCost,
      overageUserCost,
      totalOverageCost,
      billingDate
    };
  }

  private async getUpgradeRecommendation(
    currentOrders: number,
    activeSubscription: RestaurantSubscription | null,
    usagePercentage: number | null,
  ): Promise<{
    shouldUpgrade: boolean;
    suggestedPlan: any | null;
    reason: string | null;
  }> {
    if (!activeSubscription) {
      return {
        shouldUpgrade: false,
        suggestedPlan: null,
        reason: 'No active subscription',
      };
    }

    const currentPlan = activeSubscription.plan;

    // Check if they're over 80% usage or exceeded limit
    const shouldConsiderUpgrade =
      (usagePercentage !== null && usagePercentage >= 80) ||
      (currentPlan.orderLimit !== null && currentOrders > currentPlan.orderLimit);

    if (!shouldConsiderUpgrade) {
      return {
        shouldUpgrade: false,
        suggestedPlan: null,
        reason: null,
      };
    }

    // Find next higher plan
    const allPlans = await this.planRepository.find({
      where: { status: SubscriptionPlanStatus.ACTIVE },
      order: { orderLimit: 'ASC' },
    });

    const currentOrderLimit = currentPlan.orderLimit || 0;

    // Find plans with higher limits
    const higherPlans = allPlans.filter(plan => {
      const planLimit = plan.orderLimit || Number.MAX_SAFE_INTEGER;
      return planLimit > currentOrderLimit && planLimit > currentOrders;
    });

    if (higherPlans.length === 0) {
      // Check for unlimited plans
      const unlimitedPlans = allPlans.filter(plan => plan.orderLimit === null || plan.orderLimit === 0);
      if (unlimitedPlans.length > 0) {
        const suggestedPlan = unlimitedPlans[0];
        return {
          shouldUpgrade: true,
          suggestedPlan: {
            id: suggestedPlan.id,
            name: suggestedPlan.name,
            code: suggestedPlan.code,
            priceMonthly: suggestedPlan.priceMonthly ? parseFloat(suggestedPlan.priceMonthly) : null,
            priceYearly: suggestedPlan.priceYearly ? parseFloat(suggestedPlan.priceYearly) : null,
            orderLimit: null,
          },
          reason: `You've ${usagePercentage}% of your order limit. Upgrade to ${suggestedPlan.name} for unlimited orders.`,
        };
      }

      return {
        shouldUpgrade: false,
        suggestedPlan: null,
        reason: 'No higher plans available',
      };
    }

    const suggestedPlan = higherPlans[0];
    const reason = currentOrders > currentOrderLimit
      ? `You've exceeded your order limit. Upgrade to ${suggestedPlan.name} for ${suggestedPlan.orderLimit} orders/month.`
      : `You've used ${usagePercentage}% of your order limit. Consider upgrading to ${suggestedPlan.name}.`;

    return {
      shouldUpgrade: true,
      suggestedPlan: {
        id: suggestedPlan.id,
        name: suggestedPlan.name,
        code: suggestedPlan.code,
        priceMonthly: suggestedPlan.priceMonthly ? parseFloat(suggestedPlan.priceMonthly) : null,
        priceYearly: suggestedPlan.priceYearly ? parseFloat(suggestedPlan.priceYearly) : null,
        orderLimit: suggestedPlan.orderLimit,
      },
      reason,
    };
  }

  private getMonthDateRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  private calculateOverage(totalOrders: number, plan: SubscriptionPlanEntity | null): number {
    if (!plan || plan.orderLimit === null || plan.orderLimit === 0) {
      // No limit or no plan means no overage
      return 0;
    }

    const overage = totalOrders - plan.orderLimit;
    return overage > 0 ? overage : 0;
  }

  private async expireSubscription(subscription: RestaurantSubscription, endDate: string): Promise<void> {
    subscription.status = RestaurantSubscriptionStatus.EXPIRED;
    subscription.endDate = endDate;
    await this.restaurantSubscriptionRepository.save(subscription);
  }

  private toMoney(value?: number): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    return value.toFixed(2);
  }

  private calculateEndDate(startDate: Date, billingCycle: BillingCycle): Date {
    const endDate = new Date(startDate);

    // Check if test duration is configured in environment
    const testDurationDaysStr = this.configService.get<string>('SUBSCRIPTION_TEST_DURATION_DAYS');
    const testDurationDays = testDurationDaysStr ? parseInt(testDurationDaysStr, 10) : null;

    if (testDurationDays && testDurationDays > 0 && !isNaN(testDurationDays)) {
      endDate.setDate(endDate.getDate() + testDurationDays);
      return endDate;
    }

    // Production logic based on billing cycle
    if (billingCycle === BillingCycle.YEARLY) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
  }

  private ensureDate(date: string): string {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date value');
    }
    return this.formatDate(parsed);
  }

  private formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatMonth(date: Date): string {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    return `${year}-${month}`;
  }

  private deriveSavings(
    dto: CreateSubscriptionPlanDto | UpdateSubscriptionPlanDto,
    existingPlan?: SubscriptionPlanEntity,
  ): number | null {
    const monthly =
      dto.priceMonthly !== undefined
        ? dto.priceMonthly
        : existingPlan?.priceMonthly !== null && existingPlan?.priceMonthly !== undefined
          ? Number(existingPlan.priceMonthly)
          : undefined;

    const yearly =
      dto.priceYearly !== undefined
        ? dto.priceYearly
        : existingPlan?.priceYearly !== null && existingPlan?.priceYearly !== undefined
          ? Number(existingPlan.priceYearly)
          : undefined;

    if (
      monthly === undefined || monthly === null ||
      yearly === undefined || yearly === null ||
      monthly <= 0
    ) {
      return existingPlan?.yearlySavingsPercent ?? null;
    }

    const yearlyFromMonthly = monthly * 12;
    const percentSaved = ((yearlyFromMonthly - yearly) / yearlyFromMonthly) * 100;
    return Number(percentSaved.toFixed(2));
  }

  private async validateDowngrade(
    restaurantId: string,
    oldPlan: SubscriptionPlanEntity,
    newPlan: SubscriptionPlanEntity,
  ): Promise<void> {
    // 1. Check outstanding payments - this is a single query
    await this.checkOutstandingPayments(restaurantId);

    // 2. Perform usage checks in parallel for maximum efficiency
    const activeSubscription = await this.getActiveSubscription(restaurantId);
    if (!activeSubscription) return;

    const startDateObj = new Date(activeSubscription.startDate);
    const endDateObj = new Date(activeSubscription.endDate);
    const monthKey = this.getBillingMonth(startDateObj, endDateObj);

    const usage = await this.orderUsageRepository.findOne({
      where: { restaurantId: restaurantId, id: activeSubscription.usageId, status: OrderUsageStatus.ACTIVE }
    });
    const currentOrders = usage?.totalOrders || 0;
    const currentUsers = usage?.totalUserCount || 0;
    const currentQRCodes = usage?.totalQRCount || 0;
    const currentTables = usage?.totalTableCount || 0;

    // Check Order Limit
    if (newPlan.orderLimit !== null && currentOrders > newPlan.orderLimit) {
      throw new BadRequestException(
        `Cannot downgrade. Current usage (${currentOrders} orders) exceeds new plan limit (${newPlan.orderLimit} orders). ` +
        `Please wait until the next billing cycle or choose a higher plan.`
      );
    }

    // Check User Limit
    if (newPlan.userLimit !== null && currentUsers > newPlan.userLimit) {
      throw new BadRequestException(
        `Cannot downgrade. Restaurant has ${currentUsers} users, which exceeds new plan limit (${newPlan.userLimit} users). ` +
        `Please remove users before downgrading or choose a higher plan.`
      );
    }

    // Check QR Limit
    if (newPlan.qrLimit !== null && currentQRCodes > newPlan.qrLimit) {
      throw new BadRequestException(
        `Cannot downgrade. Restaurant has ${currentQRCodes} QR codes, which exceeds new plan limit (${newPlan.qrLimit} QR codes). ` +
        `Please remove QR codes before downgrading or choose a higher plan.`
      );
    }

    // Check Table Limit
    if (newPlan.tableLimit !== null && currentTables > newPlan.tableLimit) {
      throw new BadRequestException(
        `Cannot downgrade. Restaurant has ${currentTables} tables, which exceeds new plan limit (${newPlan.tableLimit} tables). ` +
        `Please remove tables before downgrading or choose a higher plan.`
      );
    }
  }

  private async checkOutstandingPayments(restaurantId: string): Promise<void> {
    // Find any unpaid or overdue invoices
    const outstandingInvoices = await this.invoiceRepository.find({
      where: [
        { restaurantId, status: InvoiceStatus.OVERDUE },
        { restaurantId, status: InvoiceStatus.PENDING },
      ],
    });

    if (outstandingInvoices.length > 0) {
      const totalAmount = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      throw new BadRequestException(
        `Cannot downgrade. Please clear outstanding payment of $${totalAmount.toFixed(2)} before downgrading.`
      );
    }
  }

  private async resetOrderUsage(restaurantId: string, startDate: string): Promise<number> {
    const dateObj = new Date(startDate);
    // We want to reset the usage for the calendar month that the new subscription starts in
    // However, the month Key depends on the subscription dates.
    // For now, let's just find the most recent usage record and reset it if it matches the current year/month
    const monthKey = this.formatMonth(dateObj); // YYYY-MM

    const usage = await this.orderUsageRepository.findOne({
      where: { restaurantId, month: monthKey }
    });

    if (usage) {
      const previousTotal = usage.totalOrders;
      usage.totalOrders = 0;
      usage.overageCount = 0;
      await this.orderUsageRepository.save(usage);
      return previousTotal;
    }

    return 0;
  }

  private generateInvoicePdf(invoiceData: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers: Uint8Array[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      doc.fontSize(20).text('Invoice', { align: 'center' });
      doc.text(`Restaurant: ${invoiceData.restaurantId}`);
      doc.text(`Period: ${invoiceData.billing_period}`);
      doc.text(`Amount: $${invoiceData.amount}`);
      // ...add more invoice details as needed...

      doc.end();
    });
  }

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
   * Reactivate an inactive (archived) restaurant by assigning trial plan
   * Used when restaurant pays their outstanding invoices after grace period
   */
  async reactivateRestaurant(restaurantId: string): Promise<{ restaurant: Restaurant; subscription: RestaurantSubscription }> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.status !== 'inactive') {
      throw new BadRequestException('Restaurant is not inactive. Only inactive restaurants can be reactivated.');
    }

    // Find trial plan
    const trialPlan = await this.getPlanByCode('trial');
    if (!trialPlan) {
      throw new NotFoundException('Trial plan not found. Please create a trial plan first.');
    }

    // Reactivate restaurant
    restaurant.status = 'active';
    restaurant.isActive = true;
    restaurant.gracePeriodStartDate = null;
    restaurant.gracePeriodEndDate = null;

    await this.restaurantRepository.save(restaurant);

    // Assign trial subscription
    const subscription = await this.assignRestaurantToPlan({
      restaurantId,
      planId: trialPlan.id,
      isAutoRenew: false, // Trial should not auto-renew
    });

    // Log the reactivation
    await this.logSubscriptionChange({
      restaurantId,
      oldPlanId: null,
      newPlanId: trialPlan.id,
      changeType: SubscriptionChangeType.PLAN_ASSIGNED,
      initiatedBy: SubscriptionChangeInitiator.SUPER_ADMIN,
      userId: null,
      usageId: subscription.usageId ?? null,
      reason: 'Restaurant reactivated after payment',
      metadata: {
        previousStatus: 'inactive',
        newStatus: 'active',
        plan: await this.getPlanMetadata(trialPlan.id),
      },
    });

    this.logger.log(`Restaurant ${restaurantId} reactivated with trial plan`);

    return { restaurant, subscription };
  }
}

