import { Controller, Get, Param, UseGuards, Query, Post, Body, BadRequestException, Patch, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiQuery } from '@nestjs/swagger';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CustomerPortalService } from './customer-portal.service';
import { Public } from '../infrastructure/auth/decorators/public.decorator';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { CreateCustomerPortalOrderDto } from './dto/create-customer-portal-order.dto';
import { UpdateRestaurantWalletDto } from './dto/update-restaurant-wallet.dto';
import { CustomerVerificationDto } from './dto/customer-verification.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@ApiTags('Customer Portal')
@Controller('customer-portal')
export class CustomerPortalController {
  constructor(private readonly customerPortalService: CustomerPortalService) { }

  @Public()
  @Get('qr/:code')
  @ApiOperation({ summary: 'Retrieve information for a QR code' })
  @ApiParam({ name: 'code', description: 'QR code identifier' })
  @ApiOkResponse({ description: 'Details about the QR code and associated restaurant.' })
  async getQRCodeInfo(@Param('code') code: string) {
    return this.customerPortalService.getQRCodeInfo(code);
  }

  @Public()
  @Get('qr/:code/menu')
  @ApiOperation({ summary: 'Retrieve menu items associated with a QR code' })
  @ApiParam({ name: 'code', description: 'QR code identifier' })
  @ApiOkResponse({ description: 'Restaurant menu linked to the QR code.' })
  @ApiQuery({ name: 'badges', required: false, description: 'Filter by badges (comma separated codes)' })
  async getQRCodeMenu(
    @Param('code') code: string,
    @Query('badges') badges?: string,
  ) {
    return this.customerPortalService.getQRCodeMenu(code, badges);
  }

  @Public()
  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Fetch public information about a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Restaurant details.' })
  async getRestaurantInfo(@Param('restaurantId') restaurantId: string) {
    return this.customerPortalService.getRestaurantInfo(restaurantId);
  }

  @Public()
  @Get('restaurant/:restaurantId/menu')
  @ApiOperation({ summary: 'Fetch menu for a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Menu items for the restaurant.' })
  @ApiQuery({ name: 'badges', required: false, description: 'Filter by badges (comma separated codes)' })
  async getRestaurantMenu(
    @Param('restaurantId') restaurantId: string,
    @Query('badges') badges?: string,
  ) {
    return this.customerPortalService.getRestaurantMenu(restaurantId, badges);
  }

  @Public()
  @Get('restaurant/:restaurantId/menu/filter')
  @ApiOperation({ summary: 'Filter menu items with advanced options (price, category, search, badges, sorting)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term (name or description)' })
  @ApiQuery({ name: 'hasDiscount', required: false, type: Boolean, description: 'Show only discounted items' })
  @ApiQuery({ name: 'badges', required: false, description: 'Filter by badges (comma separated codes)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'discount_desc', 'best_match'], description: 'Sort options' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({ description: 'Filtered menu items with metadata.' })
  async getRestaurantMenuWithFilters(
    @Param('restaurantId') restaurantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('search') search?: string,
    @Query('hasDiscount') hasDiscount?: boolean,
    @Query('badges') badges?: string,
    @Query('sortBy') sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'discount_desc' | 'best_match',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customerPortalService.getRestaurantMenuWithFilters(restaurantId, {
      categoryId,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search,
      hasDiscount: hasDiscount === true || String(hasDiscount) === 'true',
      badges,
      sortBy,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Public()
  @Get('restaurant/:restaurantId/badges')
  @ApiOperation({ summary: 'Fetch active badges for a restaurant (for filter UI)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'List of active badges for the restaurant.' })
  async getRestaurantBadges(@Param('restaurantId') restaurantId: string) {
    return this.customerPortalService.getRestaurantBadges(restaurantId);
  }

  @Public()
  @Get('restaurant/:restaurantId/categories')
  @ApiOperation({ summary: 'Fetch categories for a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Categories for the restaurant.' })
  async getRestaurantCategories(@Param('restaurantId') restaurantId: string) {
    // Returns unique categories that have menu items for this restaurant
    return this.customerPortalService.getRestaurantCategories(restaurantId);
  }

  @Public()
  @Get('food-court/:tenantId/restaurants')
  @ApiOperation({ summary: 'Get list of restaurants (vendors) for a food court tenant' })
  @ApiParam({ name: 'tenantId', description: 'Food court tenant identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'List of restaurants in the food court.' })
  async getFoodCourtRestaurantsByPath(@Param('tenantId') tenantId: string) {
    return this.customerPortalService.getFoodCourtRestaurants(tenantId);
  }

  @Public()
  @Get('restaurants')
  @ApiOperation({ summary: 'Get list of restaurants for a food court tenant (public endpoint)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Food court tenant identifier (UUID). Can also be provided via X-Tenant-ID header or subdomain.' })
  @ApiOkResponse({ description: 'List of restaurants in the food court.' })
  async getFoodCourtRestaurantsByQuery(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    // Get tenantId from middleware (set by TenantMiddleware) or query param (for backward compatibility)
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;

    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required. Provide it via X-Tenant-ID header, subdomain, or tenantId query parameter.');
    }

    return this.customerPortalService.getFoodCourtRestaurants(targetTenantId);
  }

  @Public()
  @Get('table/:tableId/availability')
  @ApiOperation({ summary: 'Check if a table is available for ordering' })
  @ApiParam({ name: 'tableId', description: 'Table identifier', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant identifier (UUID)' })
  @ApiOkResponse({ description: 'Table availability status.' })
  async checkTableAvailability(
    @Param('tableId') tableId: string,
    @Query('restaurantId') restaurantId: string,
  ) {
    if (!restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }
    return this.customerPortalService.checkTableAvailability(tableId, restaurantId);
  }

  @Public()
  @Post('order')
  @ApiOperation({ summary: 'Create an order from the customer portal (no authentication required)' })
  @ApiBody({ type: CreateCustomerPortalOrderDto })
  @ApiOkResponse({ description: 'Order created successfully.' })
  async createOrder(@Body() createOrderDto: CreateCustomerPortalOrderDto) {
    return this.customerPortalService.createOrder(createOrderDto);
  }

  @Public()
  @Post('customer/verify')
  @ApiOperation({ summary: 'Verify and store customer details (name + phone) - called from verification page' })
  @ApiBody({ type: CustomerVerificationDto })
  @ApiOkResponse({ description: 'Customer details verified and stored successfully.' })
  async verifyCustomer(@Body() customerVerificationDto: CustomerVerificationDto) {
    return this.customerPortalService.verifyCustomer(customerVerificationDto);
  }

  @Public()
  @Post('order/calculate-total')
  @ApiOperation({ summary: 'Calculate order total and show final order breakdown (after customer verification)' })
  @ApiBody({ type: CreateCustomerPortalOrderDto })
  @ApiOkResponse({ description: 'Order total calculated successfully with full order breakdown.' })
  async calculateOrderTotal(@Body() createOrderDto: CreateCustomerPortalOrderDto) {
    return this.customerPortalService.calculateOrderTotal(createOrderDto);
  }

  @Public()
  @Get('orders')
  @ApiOperation({ summary: 'Retrieve orders by phone number (no authentication required)' })
  @ApiQuery({ name: 'phone', required: true, description: 'Customer phone number' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Filter by restaurant ID (UUID)' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant/food court ID (UUID)' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Show only active orders (pending, confirmed, preparing, ready, served). Default: false' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiOkResponse({
    description: 'Paginated list of orders for the customer.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { type: 'object' },
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  async getOrdersByPhone(
    @Query('phone') phone: string,
    @Query('restaurantId') restaurantId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }
    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    const filters = {
      restaurantId,
      tenantId,
      activeOnly: activeOnly === 'true' || activeOnly === '1',
    };
    return this.customerPortalService.getUserOrders(phone, pagination, filters);
  }

  @Public()
  @Get('order/:orderId')
  @ApiOperation({ summary: 'Retrieve order details by order ID and phone number' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiQuery({ name: 'phone', required: true, description: 'Customer phone number for verification' })
  @ApiOkResponse({ description: 'Detailed information about the order.' })
  async getOrderDetails(
    @Param('orderId') orderId: string,
    @Query('phone') phone: string,
  ) {
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }
    return this.customerPortalService.getOrderDetails(phone, orderId);
  }

  @Public()
  @Post('order/:orderId/payment')
  @ApiOperation({ summary: 'Process payment for an order (no authentication required)' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiQuery({ name: 'phone', required: true, description: 'Customer phone number for verification' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethod: { type: 'string', enum: ['cash', 'card', 'mobile'], description: 'Payment method' },
        amount: { type: 'number', description: 'Payment amount' },
      },
      required: ['paymentMethod', 'amount'],
    },
  })
  @ApiOkResponse({ description: 'Payment processed successfully.' })
  async processPayment(
    @Param('orderId') orderId: string,
    @Query('phone') phone: string,
    @Body() paymentData: { paymentMethod: string; amount: number },
  ) {
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }
    return this.customerPortalService.processPayment(phone, orderId, paymentData);
  }

  @Public()
  @Patch('order/:orderId/cancel')
  @ApiOperation({ summary: 'Cancel an order (Customer) - requires phone verification' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiQuery({ name: 'phone', required: true, description: 'Customer phone number for verification' })
  @ApiBody({ type: CancelOrderDto })
  @ApiOkResponse({ description: 'Order cancelled successfully.' })
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Query('phone') phone: string,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }
    return this.customerPortalService.cancelOrder(phone, orderId, cancelOrderDto.reason);
  }

  @Public()
  @Patch('order/:restaurantId/wallet')
  @ApiOperation({ summary: 'Update restaurant wallet balance (public)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        totalBalance: { type: 'number', description: 'Amount to add to restaurant wallet' },
      },
      required: ['totalBalance'],
    },
  })
  @ApiOkResponse({ description: 'Wallet updated successfully.' })
  async updateRestaurantWallet(
    @Param('restaurantId') restaurantId: string,
    @Body() body: { totalBalance: number },
  ) {
    if (body.totalBalance === undefined || body.totalBalance === null || isNaN(Number(body.totalBalance))) {
      throw new BadRequestException('totalBalance is required and must be a number');
    }

    const dto: UpdateRestaurantWalletDto = {
      restaurantId,
      totalBalance: Number(body.totalBalance),
    } as UpdateRestaurantWalletDto;

    return this.customerPortalService.updateRestaurantWallet(dto);
  }
}
