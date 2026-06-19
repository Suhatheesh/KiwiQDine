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
import { SuperAdminDashboardService } from './super-admin-dashboard.service';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { UserRole } from '../infrastructure/database/entities';

@ApiTags('Super Admin Dashboard')
@ApiBearerAuth()
@Controller('super-admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminDashboardController {
    constructor(private readonly superAdminDashboardService: SuperAdminDashboardService) { }

    @Get('overview')
    @ApiOperation({
        summary: 'Get Super Admin Overview with Growth Metrics',
        description: 'High-level metrics including revenue growth, order growth, customer growth, and user growth',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['today', 'week', 'month', 'year'],
        description: 'Time period for analytics (default: today)',
    })
    @ApiOkResponse({ description: 'Super admin overview retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getOverview(@Query('period') period?: 'today' | 'week' | 'month' | 'year') {
        return this.superAdminDashboardService.getSuperAdminOverview(period || 'today');
    }

    @Get('summary-cards')
    @ApiOperation({
        summary: 'Get 4 Summary Cards with Growth Indicators',
        description: 'Revenue, Orders, Active Customers, and Active Restaurants cards with growth percentages',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['today', 'week', 'month', 'year'],
        description: 'Time period for cards (default: today)',
    })
    @ApiOkResponse({ description: 'Summary cards retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getSummaryCards(@Query('period') period?: 'today' | 'week' | 'month' | 'year') {
        return this.superAdminDashboardService.getSummaryCards(period || 'today');
    }

    @Get('growth-trends')
    @ApiOperation({
        summary: 'Get Growth Trends Graph Data',
        description: 'Multi-metric growth over time: revenue, orders, new customers, new users',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['week', 'month', 'quarter', 'year'],
        description: 'Time period for trends (default: month)',
    })
    @ApiQuery({
        name: 'granularity',
        required: false,
        enum: ['daily', 'weekly', 'monthly'],
        description: 'Data granularity (default: daily)',
    })
    @ApiOkResponse({ description: 'Growth trends retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getGrowthTrends(
        @Query('period') period?: 'week' | 'month' | 'quarter' | 'year',
        @Query('granularity') granularity?: 'daily' | 'weekly' | 'monthly',
    ) {
        return this.superAdminDashboardService.getGrowthTrends(
            period || 'month',
            granularity || 'daily',
        );
    }

    @Get('restaurants-performance')
    @ApiOperation({
        summary: 'Get All Restaurants Performance',
        description: 'Detailed performance metrics for each restaurant with revenue, orders, and growth',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['today', 'week', 'month', 'year'],
        description: 'Time period for analytics (default: today)',
    })
    @ApiOkResponse({ description: 'Restaurants performance retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getRestaurantsPerformance(@Query('period') period?: 'today' | 'week' | 'month' | 'year') {
        return this.superAdminDashboardService.getRestaurantsPerformance(period || 'today');
    }

    @Get('restaurant-status')
    @ApiOperation({
        summary: 'Get Restaurant Status Summary',
        description: 'Get counts of active, inactive, and suspended restaurants',
    })
    @ApiOkResponse({ description: 'Restaurant status summary retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getRestaurantStatus() {
        return this.superAdminDashboardService.getRestaurantStatus();
    }

    @Get('top-selling-items')
    @ApiOperation({
        summary: 'Get Top Selling Items Across All Restaurants',
        description: 'Top performing menu items with revenue and order count',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['today', 'week', 'month', 'year'],
        description: 'Time period for analytics (default: week)',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Number of items to return (default: 10)',
    })
    @ApiOkResponse({ description: 'Top selling items retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getTopSellingItems(
        @Query('period') period?: 'today' | 'week' | 'month' | 'year',
        @Query('limit') limit?: string,
    ) {
        return this.superAdminDashboardService.getTopSellingItems(
            period || 'week',
            limit ? parseInt(limit, 10) : 10,
        );
    }

    @Get('top-items-by-restaurant')
    @ApiOperation({
        summary: 'Get Top Selling Items for Each Restaurant',
        description: 'Top performing menu items grouped by restaurant with revenue and growth metrics',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['today', 'week', 'month', 'year'],
        description: 'Time period for analytics (default: week)',
    })
    @ApiQuery({
        name: 'itemsPerRestaurant',
        required: false,
        type: Number,
        description: 'Number of top items to show per restaurant (default: 5)',
    })
    @ApiOkResponse({ description: 'Top items by restaurant retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getTopItemsByRestaurant(
        @Query('period') period?: 'today' | 'week' | 'month' | 'year',
        @Query('itemsPerRestaurant') itemsPerRestaurant?: string,
    ) {
        return this.superAdminDashboardService.getTopItemsByRestaurant(
            period || 'week',
            itemsPerRestaurant ? parseInt(itemsPerRestaurant, 10) : 5,
        );
    }

    @Get('order-sources')
    @ApiOperation({
        summary: 'Get Order Sources Breakdown',
        description: 'Distribution of orders by source (Dine-in and Takeaway)',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['today', 'week', 'month', 'year'],
        description: 'Time period for analytics (default: today)',
    })
    @ApiOkResponse({ description: 'Order sources retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getOrderSources(@Query('period') period?: 'today' | 'week' | 'month' | 'year') {
        return this.superAdminDashboardService.getOrderSources(period || 'today');
    }

    @Get('subscription-revenue')
    @ApiOperation({
        summary: 'Get Subscription Revenue Analytics',
        description: 'Platform revenue from restaurant subscriptions with breakdown by plan and billing cycle',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['today', 'week', 'month', 'year'],
        description: 'Time period for analytics (default: month)',
    })
    @ApiOkResponse({ description: 'Subscription revenue retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getSubscriptionRevenue(@Query('period') period?: 'today' | 'week' | 'month' | 'year') {
        return this.superAdminDashboardService.getSubscriptionRevenue(period || 'month');
    }

    @Get('subscription-revenue-trends')
    @ApiOperation({
        summary: 'Get Subscription Revenue Trends Over Time',
        description: 'Track subscription revenue trends with breakdown by plan and billing cycle over time',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['week', 'month', 'quarter', 'year'],
        description: 'Time period for trends (default: month)',
    })
    @ApiQuery({
        name: 'granularity',
        required: false,
        enum: ['daily', 'weekly', 'monthly'],
        description: 'Data granularity (default: daily)',
    })
    @ApiOkResponse({ description: 'Subscription revenue trends retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getSubscriptionRevenueTrends(
        @Query('period') period?: 'week' | 'month' | 'quarter' | 'year',
        @Query('granularity') granularity?: 'daily' | 'weekly' | 'monthly',
    ) {
        return this.superAdminDashboardService.getSubscriptionRevenueTrends(
            period || 'month',
            granularity || 'daily',
        );
    }

    @Get('user-growth')
    @ApiOperation({
        summary: 'Get User Growth Metrics Over Time',
        description: 'Track user growth with breakdown by role and time period',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['week', 'month', 'quarter', 'year'],
        description: 'Time period for growth metrics (default: month)',
    })
    @ApiQuery({
        name: 'granularity',
        required: false,
        enum: ['daily', 'weekly', 'monthly'],
        description: 'Data granularity (default: daily)',
    })
    @ApiOkResponse({ description: 'User growth metrics retrieved successfully' })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getUserGrowth(
        @Query('period') period?: 'week' | 'month' | 'quarter' | 'year',
        @Query('granularity') granularity?: 'daily' | 'weekly' | 'monthly',
    ) {
        return this.superAdminDashboardService.getUserGrowth(
            period || 'month',
            granularity || 'daily',
        );
    }

    @Get('restaurants/summary')
    @ApiOperation({
        summary: 'Get Restaurant Summary (4 Cards Only)',
        description: 'Returns 4 summary cards: Total Restaurants, Active, Growth, Total Revenue',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['today', 'week', 'month', 'year'],
        description: 'Time period for metrics (default: month)',
    })
    @ApiOkResponse({
        description: 'Restaurant summary cards retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                totalRestaurants: {
                    type: 'object',
                    properties: {
                        value: { type: 'number' },
                        label: { type: 'string' },
                    },
                },
                activeRestaurants: {
                    type: 'object',
                    properties: {
                        value: { type: 'number' },
                        growth: { type: 'number' },
                        label: { type: 'string' },
                    },
                },
                totalRevenue: {
                    type: 'object',
                    properties: {
                        value: { type: 'number' },
                        growth: { type: 'number' },
                        label: { type: 'string' },
                    },
                },
                overallGrowth: {
                    type: 'object',
                    properties: {
                        value: { type: 'number' },
                        trend: { type: 'string' },
                        label: { type: 'string' },
                    },
                },
            },
        },
    })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getRestaurantSummary(
        @Query('period') period?: 'today' | 'week' | 'month' | 'year',
    ) {
        return this.superAdminDashboardService.getRestaurantSummary(period || 'month');
    }

    @Get('tenants/summary')
    @ApiOperation({
        summary: 'Get Tenant Summary (4 Cards Only)',
        description: 'Returns 4 summary cards: Total Tenants, Active, Growth, Total Restaurants',
    })
    @ApiQuery({
        name: 'period',
        required: false,
        enum: ['today', 'week', 'month', 'year'],
        description: 'Time period for metrics (default: month)',
    })
    @ApiOkResponse({
        description: 'Tenant summary cards retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                totalTenants: {
                    type: 'object',
                    properties: {
                        value: { type: 'number' },
                        label: { type: 'string' },
                    },
                },
                activeTenants: {
                    type: 'object',
                    properties: {
                        value: { type: 'number' },
                        growth: { type: 'number' },
                        label: { type: 'string' },
                    },
                },
                totalRestaurants: {
                    type: 'object',
                    properties: {
                        value: { type: 'number' },
                        label: { type: 'string' },
                    },
                },
                overallGrowth: {
                    type: 'object',
                    properties: {
                        value: { type: 'number' },
                        trend: { type: 'string' },
                        label: { type: 'string' },
                    },
                },
            },
        },
    })
    @ApiUnauthorizedResponse({ description: 'User authentication required' })
    @ApiForbiddenResponse({ description: 'Only super admins can access this endpoint' })
    getTenantSummary(
        @Query('period') period?: 'today' | 'week' | 'month' | 'year',
    ) {
        return this.superAdminDashboardService.getTenantSummary(period || 'month');
    }
}
