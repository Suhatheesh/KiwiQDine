import { CreateSpecializedSubscriptionPlanDto } from './dto/create-specialized-subscription-plan.dto';
import { SubscriptionRenewalCronService } from './subscription-renewal-cron.service';
import { GracePeriodService } from './grace-period.service';
import { MasterCronService } from '../shared/services/master-cron.service';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, ForbiddenException, BadRequestException, Delete, Headers, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  SubscriptionPlanEntity,
  SubscriptionPlanStatus,
  RestaurantSubscription,
  OrderUsage,
  SubscriptionChangeLog,
  SubscriptionChangeInitiator,
  UserRole,
} from '../infrastructure/database/entities';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { AssignRestaurantSubscriptionDto } from './dto/assign-restaurant-subscription.dto';
import { ChangeSubscriptionPlanDto } from './dto/change-subscription-plan.dto';
import { RecordOrderUsageDto } from './dto/record-order-usage.dto';
import { Result } from '@/domain';
import { GetSubscriptionPlanDto } from './dto/get-subscription-plan.dto';
import { UsageSummaryCardDto } from './dto/usage-summary-card.dto';
import { AdjustGracePeriodDto } from './dto/adjust-grace-period.dto';
import { GracePeriodCronService } from './grace-period-cron.service';

@ApiTags('Subscription')
@Controller('subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly subscriptionRenewalCronService: SubscriptionRenewalCronService,
    private readonly gracePeriodService: GracePeriodService,
    private readonly gracePeriodCronService: GracePeriodCronService,
    private readonly masterCronService: MasterCronService,
  ) { }

  @Post('trigger-cron')
  @ApiOperation({ summary: 'Trigger master cron job manually' })
  @ApiResponse({ status: 200, description: 'Master cron job triggered successfully' })
  async triggerMasterCron() {
    await this.masterCronService.handleMasterCron();
    return { message: 'Master cron job triggered successfully' };
  }

  @Post('plans')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create a new subscription plan',
    description: `Create a subscription plan with order limits.
      Examples:
      - Basic Free: orderLimit: 50 (50 orders/month)
      - Premium: orderLimit: 10000 (10,000 orders/month)
      - Enterprise: orderLimit: null (unlimited orders)
      The system will automatically block order creation when restaurants reach their plan's monthly limit.`
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription plan created successfully.',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Basic Free Plan',
        code: 'basic-free',
        description: 'Free tier with 50 orders per month',
        priceMonthly: '0.00',
        priceYearly: null,
        orderLimit: 50,
        billingCycle: 'monthly',
        status: 'active',
        features: ['Up to 50 orders/month', 'Basic QR codes', 'Email support'],
        createdAt: '2025-12-04T10:00:00Z',
        updatedAt: '2025-12-04T10:00:00Z'
      }
    }
  })
  @ApiBody({
    type: CreateSubscriptionPlanDto,
    examples: {
      'Basic Free Plan': {
        value: {
          name: 'Basic Free Plan',
          code: 'basic-free',
          description: 'Free tier with 50 orders per month',
          priceMonthly: 0,
          orderLimit: 50,
          billingCycle: 'monthly',
          features: ['Up to 50 orders/month', 'Basic QR codes', 'Email support']
        }
      },
      'Premium Plan': {
        value: {
          name: 'Premium Plan',
          code: 'premium',
          description: 'Premium tier with 10,000 orders per month',
          priceMonthly: 299.99,
          priceYearly: 2999.99,
          orderLimit: 10000,
          billingCycle: 'monthly',
          features: ['Up to 10,000 orders/month', 'Advanced analytics', 'Priority support', 'Custom branding']
        }
      },
      'Enterprise Plan': {
        value: {
          name: 'Enterprise Plan',
          code: 'enterprise',
          description: 'Unlimited orders for large enterprises',
          priceMonthly: 999.99,
          priceYearly: 9999.99,
          orderLimit: null,
          billingCycle: 'monthly',
          features: ['Unlimited orders', 'Dedicated account manager', 'Custom integrations', '24/7 support']
        }
      }
    }
  })
  createPlan(@Body() dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanEntity> {
    return this.subscriptionService.createPlan(dto);
  }

  @Get('plans')
  @ApiOperation({
    summary: 'Retrieve subscription plans',
    description: 'Get all subscription plans. If tenantId is provided in headers and specialized plans exist, only those are returned. Otherwise, returns all active, non-archived plans.'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SubscriptionPlanStatus,
    description: 'Filter plans by their status',
  })
  @ApiQuery({
    name: 'includeArchived',
    required: false,
    type: Boolean,
    description: 'Include archived plans in the results (default: false)',
  })
  @ApiOkResponse({ description: 'List of subscription plans.' })
  async getPlans(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('includeArchived') includeArchived?: string | boolean,
    @Query('tenantId') tenantId?: string,
  ): Promise<SubscriptionPlanEntity[]> {
    tenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;

    const sanitized = status?.toLowerCase() as SubscriptionPlanStatus | undefined;
    const normalizedStatus =
      sanitized && Object.values(SubscriptionPlanStatus).includes(sanitized)
        ? sanitized
        : undefined;

    // Explicitly handle boolean conversion for query param
    const isIncludeArchived = includeArchived === true || includeArchived === 'true';

    if (tenantId) {
      const tenantPlans = await this.subscriptionService.getPlansByTenantId(tenantId);
      if (tenantPlans.length > 0) {
        return tenantPlans;
      }
    }
    // fallback to default
    return this.subscriptionService.getPlans(normalizedStatus, isIncludeArchived);
  }

  @Get('plans/all')
  @ApiOperation({ summary: 'Get all subscription plans with filters (Super Admin only)' })
  @ApiOkResponse({ description: 'Paginated list of subscription plans.' })
  async getAllPlansWithFilters(@Query() filters: any): Promise<Result<{
    data: GetSubscriptionPlanDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    const result = await this.subscriptionService.getAllPlansWithFilters(filters);
    return Result.ok(result);
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Retrieve a subscription plan by id' })
  @ApiParam({ name: 'planId', description: 'Unique plan identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Subscription plan details.' })
  getPlan(@Param('planId') planId: string): Promise<SubscriptionPlanEntity> {
    return this.subscriptionService.getPlan(planId);
  }

  @Patch('plans/:planId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an existing subscription plan' })
  @ApiParam({ name: 'planId', description: 'Unique plan identifier', format: 'uuid' })
  @ApiBody({ type: UpdateSubscriptionPlanDto })
  @ApiOkResponse({ description: 'Updated subscription plan.' })
  updatePlan(
    @Param('planId') planId: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanEntity> {
    return this.subscriptionService.updatePlan(planId, dto);
  }

  @Post('plans/:planId/archive')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Archive a subscription plan',
    description: `Archives a subscription plan, preventing it from being assigned to new restaurants.
      - Only plans WITHOUT active subscriptions can be archived
      - Archived plans are hidden from the main plan list
      - Use unarchive endpoint to restore archived plans`
  })
  @ApiParam({ name: 'planId', description: 'Unique plan identifier', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Plan archived successfully.',
    type: SubscriptionPlanEntity
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot archive plan with active subscriptions'
  })
  archivePlan(@Param('planId') planId: string): Promise<SubscriptionPlanEntity> {
    return this.subscriptionService.archivePlan(planId);
  }

  @Post('plans/:planId/unarchive')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Unarchive a subscription plan',
    description: 'Restores an archived plan, making it available for assignment again'
  })
  @ApiParam({ name: 'planId', description: 'Unique plan identifier', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Plan unarchived successfully.',
    type: SubscriptionPlanEntity
  })
  @ApiResponse({
    status: 400,
    description: 'Plan is not archived'
  })
  unarchivePlan(@Param('planId') planId: string): Promise<SubscriptionPlanEntity> {
    return this.subscriptionService.unarchivePlan(planId);
  }

  @Delete('plans/:planId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Permanently delete a subscription plan',
    description: `Permanently deletes a subscription plan from the database.
      - Only SUPER_ADMIN can perform this action
      - Plan must have NO active or historical subscriptions
      - Plan must be archived first
      - This action is IRREVERSIBLE`
  })
  @ApiParam({ name: 'planId', description: 'Unique plan identifier', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Plan permanently deleted successfully.'
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete plan with existing subscriptions or plan is not archived'
  })
  @ApiResponse({
    status: 403,
    description: 'Only Super Admin can delete plans'
  })
  async deletePlan(@Param('planId') planId: string): Promise<Result<{ message: string }>> {
    await this.subscriptionService.deletePlan(planId);
    return Result.ok({ message: 'Subscription plan permanently deleted' });
  }

  @Get('restaurants/:restaurantId/subscriptions')
  @ApiOperation({ summary: 'List subscription history for a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({ type: RestaurantSubscription, description: 'History of subscriptions for the specified restaurant.' })
  async getRestaurantSubscriptions(@Param('restaurantId') restaurantId: string): Promise<Result<RestaurantSubscription[]>> {
    const subscription = await this.subscriptionService.getRestaurantSubscriptions(restaurantId);
    return Result.ok(subscription);
  }

  @Get('restaurants/:restaurantId/active-subscription')
  @ApiOperation({ summary: 'Get active subscription for a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({ type: RestaurantSubscription, description: 'Active subscription for the specified restaurant.' })
  async getActiveSubscription(@Param('restaurantId') restaurantId: string): Promise<Result<RestaurantSubscription | null>> {
    const subscription = await this.subscriptionService.getActiveSubscription(restaurantId);
    return Result.ok(subscription);
  }

  @Post('restaurants/:restaurantId/assign')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign a subscription plan to a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiBody({ type: AssignRestaurantSubscriptionDto })
  @ApiResponse({ status: 201, description: 'Subscription assigned successfully.' })
  assignRestaurantPlan(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: AssignRestaurantSubscriptionDto,
  ): Promise<RestaurantSubscription> {
    return this.subscriptionService.assignRestaurantToPlan({ ...dto, restaurantId });
  }

  @Post('restaurants/:restaurantId/change-plan')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Change restaurant subscription plan',
    description: `Change a restaurant's active subscription plan with full audit logging.
      - Super admins can change any restaurant's plan
      - Tenant admins can change their own restaurant's plan
      - Automatically determines upgrade/downgrade/change based on pricing
      - Logs all changes with initiator, reason, and metadata`
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiBody({ type: ChangeSubscriptionPlanDto })
  @ApiResponse({
    status: 201,
    description: 'Subscription plan changed successfully with audit log created',
    type: RestaurantSubscription
  })
  async changeRestaurantPlan(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: ChangeSubscriptionPlanDto,
    @CurrentUser() user: any,
  ): Promise<RestaurantSubscription> {
    // Enforce restaurant access control
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);

    const initiatedBy = user.role === UserRole.SUPER_ADMIN
      ? SubscriptionChangeInitiator.SUPER_ADMIN
      : SubscriptionChangeInitiator.TENANT_ADMIN;

    return this.subscriptionService.changeSubscriptionPlan(
      targetRestaurantId,
      dto,
      initiatedBy,
      user.id
    );
  }

  @Get('restaurants/:restaurantId/change-logs')
  @ApiOperation({
    summary: 'Get subscription change history for a restaurant',
    description: `Retrieve audit log of all subscription plan changes including:
      - Plan assignments, upgrades, downgrades
      - Who initiated the change (super admin, restaurant admin, system)
      - Reason for change
      - Old and new plan details with pricing
      - Timestamp of each change`
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of log entries to retrieve (default: 50, max: 200)'
  })
  @ApiOkResponse({
    description: 'Subscription change history with full audit trail',
    type: [SubscriptionChangeLog]
  })
  async getSubscriptionChangeLogs(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ): Promise<Result<SubscriptionChangeLog[]>> {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    const maxLimit = Math.min(limit || 50, 200);
    const logs = await this.subscriptionService.getSubscriptionChangeLogs(targetRestaurantId, maxLimit);
    return Result.ok(logs);
  }

  @Get('restaurants/:restaurantId/usage')
  @ApiOperation({ summary: 'Retrieve order usage for a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Target month in YYYY-MM format',
  })
  @ApiOkResponse({ description: 'Order usage records for the restaurant.' })
  getUsage(
    @Param('restaurantId') restaurantId: string,
    @Query('month') month?: string,
  ): Promise<OrderUsage[]> {
    return this.subscriptionService.getOrderUsage(restaurantId, month);
  }

  @Post('restaurants/:restaurantId/usage')
  @ApiOperation({ summary: 'Record order usage for a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiBody({ type: RecordOrderUsageDto })
  @ApiResponse({ status: 201, description: 'Order usage recorded successfully.' })
  recordUsage(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: RecordOrderUsageDto,
  ): Promise<OrderUsage> {
    const date = dto.date ? new Date(dto.date) : new Date();
    return this.subscriptionService.recordOrderUsage(restaurantId, date, dto.count);
  }

  @Post('restaurants/:restaurantId/evaluate')
  @ApiOperation({ summary: 'Evaluate plan assignment based on usage' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Target month in YYYY-MM format; defaults to the current month',
  })
  @ApiOkResponse({ description: 'Evaluation result including usage, applied plan, and subscription state.' })
  evaluateSubscription(
    @Param('restaurantId') restaurantId: string,
    @Query('month') month?: string,
  ) {
    return this.subscriptionService.evaluateRestaurantSubscription(restaurantId, month);
  }

  @Get('restaurants/:restaurantId/can-create-order')
  @ApiOperation({ summary: 'Check if restaurant can create a new order based on subscription limits' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order creation eligibility status including current usage and limits.',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean', example: true },
        reason: { type: 'string', example: 'Monthly order limit reached' },
        currentOrders: { type: 'number', example: 45 },
        orderLimit: { type: 'number', example: 50 },
        plan: { type: 'object' },
      },
    },
  })
  checkCanCreateOrder(@Param('restaurantId') restaurantId: string) {
    return this.subscriptionService.canRestaurantCreateOrder(restaurantId);
  }

  @Get('restaurants/:restaurantId/can-create-table')
  @ApiOperation({
    summary: 'Check if restaurant can create a new table based on subscription limits',
    description: 'Validates if the restaurant has reached their plan\'s table limit. Unlike orders, tables are hard-limited based on the subscription plan.'
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Table creation eligibility status including current usage and limits.',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean', example: true },
        reason: { type: 'string', example: 'Table limit of 10 reached' },
        currentTables: { type: 'number', example: 8 },
        tableLimit: { type: 'number', example: 10 },
        plan: { type: 'object' },
      },
    },
  })
  checkCanCreateTable(@Param('restaurantId') restaurantId: string) {
    return this.subscriptionService.canCreateTable(restaurantId);
  }

  @Get('restaurants/:restaurantId/can-create-user')
  @ApiOperation({
    summary: 'Check if restaurant can create a new user based on subscription limits',
    description: 'Validates if the restaurant has reached their plan\'s user limit.'
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'User creation eligibility status including current usage and limits.',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean', example: true },
        reason: { type: 'string', example: 'User limit of 5 reached' },
        currentUsers: { type: 'number', example: 3 },
        userLimit: { type: 'number', example: 5 },
        plan: { type: 'object' },
      },
    },
  })
  checkCanCreateUser(@Param('restaurantId') restaurantId: string) {
    return this.subscriptionService.canCreateUser(restaurantId);
  }

  @Get('restaurants/:restaurantId/can-create-qr')
  @ApiOperation({
    summary: 'Check if restaurant can create a new QR code based on subscription limits',
    description: 'Validates if the restaurant has reached their plan\'s QR code limit.'
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'QR code creation eligibility status including current usage and limits.',
    schema: {
      type: 'object',
      properties: {
        allowed: { type: 'boolean', example: true },
        reason: { type: 'string', example: 'QR code limit of 10 reached' },
        currentQRCodes: { type: 'number', example: 8 },
        qrLimit: { type: 'number', example: 10 },
        plan: { type: 'object' },
      },
    },
  })
  checkCanCreateQRCode(@Param('restaurantId') restaurantId: string) {
    return this.subscriptionService.canCreateQRCode(restaurantId);
  }

  @Get('restaurants/:restaurantId/subscription-usage')
  @ApiOperation({
    summary: 'Get real-time subscription usage with billing details',
    description: `Returns comprehensive subscription usage information for a restaurant including:
    - Current subscription plan details
    - Billing information (prices, invoice total, next billing date)
    - Real-time completed order count for current month
    - Usage statistics (remaining orders, usage percentage, overage)
    - Upgrade recommendations based on usage patterns

    This endpoint calculates usage based on COMPLETED orders only (excludes cancelled and abandoned orders).`
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Subscription usage details with billing and recommendations',
    schema: {
      example: {
        restaurant: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'My Restaurant'
        },
        subscription: {
          id: 'sub-123',
          planId: 'plan-456',
          planName: 'Pro Plan',
          planCode: 'pro',
          billingCycle: 'monthly',
          startDate: '2025-01-01',
          endDate: null,
          status: 'active',
          isAutoRenew: true,
          features: ['Up to 5000 orders/month', 'Advanced analytics', 'Priority support']
        },
        billing: {
          currentPeriodStart: '2025-01-01',
          currentPeriodEnd: '2025-02-01',
          priceMonthly: 299.99,
          priceYearly: 2999.99,
          currentPrice: 299.99,
          nextBillingDate: '2025-02-01',
          invoiceTotal: 299.99
        },
        usage: {
          currentMonth: '2025-01',
          completedOrders: 4250,
          orderLimit: 5000,
          remainingOrders: 750,
          usagePercentage: 85,
          isUnlimited: false,
          isOverLimit: false,
          overageCount: 0
        },
        recommendations: {
          shouldUpgrade: true,
          suggestedPlan: {
            id: 'plan-789',
            name: 'Enterprise Plan',
            code: 'enterprise',
            priceMonthly: 999.99,
            priceYearly: 9999.99,
            orderLimit: null
          },
          reason: "You've used 85% of your order limit. Consider upgrading to Enterprise Plan."
        }
      }
    }
  })
  async getSubscriptionUsage(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.subscriptionService.getRestaurantSubscriptionUsage(targetRestaurantId);
  }

  /**
   * Endpoint to manually trigger the subscription renewal cron job (for testing)
   */
  @Post('test-renewal-cron')
  async testRenewalCron() {
    await this.subscriptionRenewalCronService.handleSubscriptionRenewalCron();
    return { message: 'Subscription renewal cron job executed.' };
  }

  /**
   * Endpoint to manually trigger the grace period start cron job (for testing)
   */
  @                                                                                                                                                                                                                                                                        Post('test-grace-period-cron')
  async testGracePeriodCron() {
    await this.gracePeriodCronService.handleGracePeriodStart();
    return { message: 'Grace period start cron job executed.' };
  }

  /**
   * Endpoint to manually trigger the grace period expiration cron job (for testing)
   */
  @Post('test-grace-period-expiration-cron')
  async testGracePeriodExpirationCron() {
    await this.gracePeriodCronService.handleGracePeriodExpiration();
    return { message: 'Grace period expiration cron job executed.' };
  }

  @Patch('restaurant-subscription/:restaurantId/dates')
  @ApiOperation({ summary: 'Update startDate and endDate for a restaurant subscription' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID' })
  @ApiBody({ schema: { properties: { startDate: { type: 'string', example: '2026-01-01' }, endDate: { type: 'string', example: '2026-12-31' } } } })
  async updateSubscriptionDates(
    @Param('restaurantId') restaurantId: string,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string
  ): Promise<{ success: boolean; updatedCount: number }> {
    const result = await this.subscriptionService.updateSubscriptionDatesByRestaurantId(restaurantId, startDate, endDate);
    return { success: true, updatedCount: result };
  }

  @Post('plans/specialized')
  @ApiOperation({
    summary: 'Create specialized subscription plans for multiple tenants',
    description: 'Creates a specialized subscription plan for each tenantId provided.'
  })
  @ApiBody({ type: CreateSpecializedSubscriptionPlanDto })
  async createSpecializedPlans(
    @Body() dto: CreateSpecializedSubscriptionPlanDto
  ): Promise<SubscriptionPlanEntity[]> {
    return this.subscriptionService.createSpecializedPlans(dto);
  }

  /**
 * Get order usage for the current subscription cycle
 */
  @Get('restaurants/:restaurantId/order-usage')
  @ApiOperation({ summary: 'Retrieve order usage for the current subscription cycle' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Order usage for the current subscription cycle.' })
  async getCurrentCycleOrderUsage(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ): Promise<UsageSummaryCardDto | null> {
    //const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    const targetRestaurantId = restaurantId;
    // Get active subscription
    const activeSubscription = await this.subscriptionService.getActiveSubscription(targetRestaurantId);
    if (!activeSubscription || !activeSubscription.usageId) {
      return null;
    }
    // Get current active order usage for this subscription
    return this.subscriptionService.getOrderUsageForCurrentCycle(targetRestaurantId, activeSubscription.usageId);
  }

  /**
   * Get authorized restaurantId based on user role
   */
  private getAuthorizedRestaurantId(restaurantId: string | undefined, user: any): string {
    if (user.role === UserRole.SUPER_ADMIN) {
      if (!restaurantId) {
        throw new BadRequestException('restaurantId is required for super admin');
      }
      return restaurantId;
    }

    if (!user.restaurantId) {
      throw new ForbiddenException('User does not have an associated restaurant.');
    }

    if (restaurantId && restaurantId !== user.restaurantId) {
      throw new ForbiddenException('You can only access your own restaurant.');
    }

    return user.restaurantId;
  }

  /**
   * Manually adjust grace period end date for a restaurant (Super Admin only)
   */
  @Patch('restaurants/:restaurantId/grace-period')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Manually adjust grace period for a restaurant',
    description: 'Super Admin can manually extend or shorten the grace period for a restaurant'
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiBody({ type: AdjustGracePeriodDto })
  async adjustGracePeriod(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: AdjustGracePeriodDto
  ): Promise<Result<{ message: string; restaurant: any }>> {
    const restaurant = await this.gracePeriodService.adjustGracePeriod(restaurantId, dto.gracePeriodEndDate);
    return Result.ok({
      message: 'Grace period adjusted successfully',
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        gracePeriodEndDate: restaurant.gracePeriodEndDate,
        status: restaurant.status
      }
    });
  }

  /**
   * Reactivate an inactive restaurant (Super Admin only)
   */
  @Post('restaurants/:restaurantId/reactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Reactivate an inactive restaurant',
    description: `Reactivates an inactive (archived) restaurant by:
      - Setting status to active
      - Clearing grace period dates
      - Assigning a trial subscription plan
      - Allowing the restaurant to operate again`
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Restaurant reactivated successfully with trial plan'
  })
  @ApiResponse({
    status: 400,
    description: 'Restaurant is not inactive or trial plan not found'
  })
  async reactivateRestaurant(
    @Param('restaurantId') restaurantId: string
  ): Promise<Result<{ message: string; restaurant: any; subscription: any }>> {
    const result = await this.subscriptionService.reactivateRestaurant(restaurantId);
    return Result.ok({
      message: 'Restaurant reactivated successfully with trial plan',
      restaurant: result.restaurant,
      subscription: result.subscription
    });
  }
}


