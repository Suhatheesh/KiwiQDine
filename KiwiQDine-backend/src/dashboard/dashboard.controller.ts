import {
  Controller,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { UserRole } from '../infrastructure/database/entities';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get complete dashboard data',
    description: 'Returns all dashboard data including summary cards, charts, and recent orders. Admin only.',
  })
  @ApiQuery({
    name: 'restaurantId',
    required: false,
    description: 'Restaurant ID to filter data (required for non-super-admin users)',
  })
  @ApiQuery({
    name: 'salesPeriod',
    required: false,
    enum: ['today', 'week', 'month', 'year'],
    description: 'Period for sales overview chart (default: today)',
  })
  @ApiQuery({
    name: 'recentOrdersLimit',
    required: false,
    type: Number,
    description: 'Number of recent orders to return (default: 10)',
  })
  @ApiOkResponse({ description: 'Dashboard data retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User authentication required' })
  @ApiForbiddenResponse({ description: 'Only admins can access dashboard data' })
  getDashboard(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('salesPeriod') salesPeriod?: 'today' | 'week' | 'month' | 'year',
    @Query('recentOrdersLimit') recentOrdersLimit?: string,
  ) {
    return this.dashboardService.getDashboardData(
      restaurantId || undefined,
      user,
      {
        salesPeriod: salesPeriod || 'today',
        recentOrdersLimit: recentOrdersLimit
          ? parseInt(recentOrdersLimit, 10)
          : 10,
      },
    );
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get dashboard summary cards',
    description: 'Returns the 4 summary cards: Today\'s Sales, Total Orders, Active Tables, Top Selling Item. Admin only.',
  })
  @ApiQuery({
    name: 'restaurantId',
    required: false,
    description: 'Restaurant ID to filter data (required for non-super-admin users)',
  })
  @ApiOkResponse({ description: 'Dashboard summary retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User authentication required' })
  @ApiForbiddenResponse({ description: 'Only admins can access dashboard data' })
  getSummary(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
  ) {
    return this.dashboardService.getDashboardSummary(
      restaurantId || undefined,
      user,
    );
  }

  @Get('sales-overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get sales overview chart data',
    description: 'Returns hourly or daily sales trend data. Admin only.',
  })
  @ApiQuery({
    name: 'restaurantId',
    required: false,
    description: 'Restaurant ID to filter data (required for non-super-admin users)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'month', 'year'],
    description: 'Period for sales overview - today (hourly), others (daily/monthly)',
  })
  @ApiOkResponse({ description: 'Sales overview data retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User authentication required' })
  @ApiForbiddenResponse({ description: 'Only admins can access dashboard data' })
  getSalesOverview(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year',
  ) {
    return this.dashboardService.getSalesOverview(
      restaurantId || undefined,
      user,
      period || 'today',
    );
  }

  @Get('orders-by-category')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get orders by category chart data',
    description: 'Returns order counts grouped by menu category. Admin only.',
  })
  @ApiQuery({
    name: 'restaurantId',
    required: false,
    description: 'Restaurant ID to filter data (required for non-super-admin users)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'month', 'year'],
    description: 'Time period for data (default: today)',
  })
  @ApiOkResponse({ description: 'Orders by category data retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User authentication required' })
  @ApiForbiddenResponse({ description: 'Only admins can access dashboard data' })
  getOrdersByCategory(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year',
  ) {
    return this.dashboardService.getOrdersByCategory(
      restaurantId || undefined,
      user,
      period || 'today',
    );
  }

  @Get('payment-methods')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get payment methods distribution',
    description: 'Returns payment method distribution for pie chart. Admin only.',
  })
  @ApiQuery({
    name: 'restaurantId',
    required: false,
    description: 'Restaurant ID to filter data (required for non-super-admin users)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'month', 'year'],
    description: 'Time period for data (default: today)',
  })
  @ApiOkResponse({ description: 'Payment methods data retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User authentication required' })
  @ApiForbiddenResponse({ description: 'Only admins can access dashboard data' })
  getPaymentMethods(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year',
  ) {
    return this.dashboardService.getPaymentMethods(
      restaurantId || undefined,
      user,
      period || 'today',
    );
  }

  @Get('table-occupancy')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get table occupancy trend',
    description: 'Returns table occupancy data throughout the day. Admin only.',
  })
  @ApiQuery({
    name: 'restaurantId',
    required: false,
    description: 'Restaurant ID to filter data (required for non-super-admin users)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'month', 'year'],
    description: 'Time period for data (default: today)',
  })
  @ApiOkResponse({ description: 'Table occupancy data retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User authentication required' })
  @ApiForbiddenResponse({ description: 'Only admins can access dashboard data' })
  getTableOccupancy(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year',
  ) {
    return this.dashboardService.getTableOccupancyTrend(
      restaurantId || undefined,
      user,
      period || 'today',
    );
  }

  @Get('recent-orders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get recent orders table',
    description: 'Returns recent orders with order details. Admin only.',
  })
  @ApiQuery({
    name: 'restaurantId',
    required: false,
    description: 'Restaurant ID to filter data (required for non-super-admin users)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of recent orders to return (default: 10)',
  })
  @ApiOkResponse({ description: 'Recent orders retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User authentication required' })
  @ApiForbiddenResponse({ description: 'Only admins can access dashboard data' })
  getRecentOrders(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getRecentOrders(
      restaurantId || undefined,
      user,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('restaurant-analytics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get restaurant analytics (Top 6 Analytics)',
    description:
      'Returns comprehensive restaurant analytics including sales overview, top selling items, orders by category, table occupancy, payment methods, and peak hours. Accessible by manager, tenant admin and super admin only.',
  })
  @ApiQuery({
    name: 'restaurantId',
    required: false,
    description:
      'Restaurant ID to filter data (required for non-super-admin users)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'month', 'year'],
    description: 'Period for analytics - today (default), week, month, year',
  })
  @ApiOkResponse({
    description: 'Restaurant analytics retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required' })
  @ApiForbiddenResponse({
    description: 'Only managers, admins and tenant admins can access restaurant analytics',
  })
  getRestaurantAnalytics(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year',
  ) {
    return this.dashboardService.getRestaurantAnalytics(
      restaurantId || undefined,
      user,
      period || 'today',
    );
  }

  @Get('top-10-foods')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get top 10 most popular foods',
    description: 'Returns top 10 most popular food items with images, categories, and sales data. Admin only.',
  })
  @ApiQuery({
    name: 'restaurantId',
    required: false,
    description: 'Restaurant ID to filter data (required for non-super-admin users)',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'month', 'year'],
    description: 'Time period for data (default: today)',
  })
  @ApiOkResponse({ description: 'Top 10 foods data retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'User authentication required' })
  @ApiForbiddenResponse({ description: 'Only admins can access dashboard data' })
  getTop10Foods(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('period') period?: 'today' | 'week' | 'month' | 'year',
  ) {
    return this.dashboardService.getTop10Foods(
      restaurantId || undefined,
      user,
      period || 'today',
    );
  }
}
