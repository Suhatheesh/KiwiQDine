import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FoodCourtCartService } from './food-court-cart.service';
import { AddCartItemDto, UpdateCartItemDto, RemoveCartItemDto, CreateOrderFromCartDto } from './dto/food-court-cart.dto';
import { Public } from '../infrastructure/auth/decorators/public.decorator';

@ApiTags('Food Court Cart')
@Controller('customer-portal/cart')
export class FoodCourtCartController {
  constructor(private readonly cartService: FoodCourtCartService) { }

  /**
   * Get or generate session ID from request
   */
  private getSessionId(req: Request): string {
    // Try to get session ID from header or generate one
    let sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      // Generate a simple session ID (in production, use proper session management)
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return sessionId;
  }

  /**
   * Get customer ID from request (if authenticated)
   */
  private getCustomerId(req: Request): string | undefined {
    const user = (req as any).user;
    if (user && typeof user === 'object' && 'id' in user) {
      return user.id;
    }
    return (req as any).customerId;
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get cart contents' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Food court tenant ID (can also use X-Tenant-ID header)' })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Session ID (can also use X-Session-ID header)' })
  @ApiOkResponse({ description: 'Cart contents retrieved successfully' })
  async getCart(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;
    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required. Provide it via X-Tenant-ID header, subdomain, or tenantId query parameter.');
    }

    const session = sessionId || this.getSessionId(req);
    const customerId = this.getCustomerId(req);

    return this.cartService.getCart(targetTenantId, session, customerId);
  }

  @Public()
  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Food court tenant ID' })
  @ApiBody({ type: AddCartItemDto })
  @ApiOkResponse({ description: 'Item added to cart successfully' })
  async addItem(
    @Req() req: Request,
    @Body() addItemDto: AddCartItemDto,
    @Query('tenantId') tenantId?: string,
  ) {
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;
    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    const session = this.getSessionId(req);
    const customerId = this.getCustomerId(req);

    const cart = await this.cartService.addItem(targetTenantId, addItemDto, session, customerId);

    return {
      ...cart,
      sessionId: session, // Return session ID so client can store it
    };
  }

  @Public()
  @Patch('items')
  @ApiOperation({ summary: 'Update item quantity in cart' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Food court tenant ID' })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiOkResponse({ description: 'Item updated successfully' })
  async updateItem(
    @Req() req: Request,
    @Body() updateItemDto: UpdateCartItemDto,
    @Query('tenantId') tenantId?: string,
  ) {
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;
    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    const session = this.getSessionId(req);
    const customerId = this.getCustomerId(req);

    return this.cartService.updateItem(targetTenantId, updateItemDto, session, customerId);
  }

  @Public()
  @Delete('items')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Food court tenant ID' })
  @ApiBody({ type: RemoveCartItemDto })
  @ApiOkResponse({ description: 'Item removed successfully' })
  async removeItem(
    @Req() req: Request,
    @Body() removeItemDto: RemoveCartItemDto,
    @Query('tenantId') tenantId?: string,
  ) {
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;
    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    const session = this.getSessionId(req);
    const customerId = this.getCustomerId(req);

    return this.cartService.removeItem(targetTenantId, removeItemDto, session, customerId);
  }

  @Public()
  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Food court tenant ID' })
  @ApiOkResponse({ description: 'Cart cleared successfully' })
  async clearCart(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;
    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    const session = this.getSessionId(req);
    const customerId = this.getCustomerId(req);

    return this.cartService.clearCart(targetTenantId, session, customerId);
  }

  @Public()
  @Get('total')
  @ApiOperation({ summary: 'Calculate cart total with breakdown by restaurant' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Food court tenant ID' })
  @ApiOkResponse({ description: 'Cart total calculated successfully' })
  async calculateTotal(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;
    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    const session = this.getSessionId(req);
    const customerId = this.getCustomerId(req);

    return this.cartService.calculateCartTotal(targetTenantId, session, customerId);
  }

  @Public()
  @Get('payment-model')
  @ApiOperation({ summary: 'Get food court payment model information' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Food court tenant ID' })
  @ApiOkResponse({ description: 'Payment model information retrieved successfully' })
  async getPaymentModelInfo(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;
    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    return this.cartService.getFoodCourtPaymentModelInfo(targetTenantId);
  }

  @Public()
  @Post('checkout')
  @ApiOperation({ summary: 'Create orders from cart (one order per restaurant). Supports pay_first (consolidated payment) and pay_at_counter models.' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Food court tenant ID' })
  @ApiBody({ type: CreateOrderFromCartDto })
  @ApiOkResponse({ description: 'Orders created successfully' })
  async checkout(
    @Req() req: Request,
    @Body() createOrderDto: CreateOrderFromCartDto,
    @Query('tenantId') tenantId?: string,
  ) {
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;
    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    const session = this.getSessionId(req);
    const customerId = this.getCustomerId(req);

    return this.cartService.createOrdersFromCart(targetTenantId, createOrderDto, session, customerId);
  }

  @Public()
  @Get('orders/dashboard')
  @ApiOperation({ summary: 'Get order status dashboard grouped by restaurant for a customer' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Food court tenant ID' })
  @ApiQuery({ name: 'phone', required: true, description: 'Customer phone number' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean, description: 'Show only active orders (default: true)' })
  @ApiOkResponse({ description: 'Order status dashboard retrieved successfully' })
  async getOrderStatusDashboard(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
    @Query('phone') phone?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;
    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    const activeOnlyFlag = activeOnly === 'false' ? false : true; // Default to true

    return this.cartService.getOrderStatusDashboard(targetTenantId, phone, activeOnlyFlag);
  }

  @Public()
  @Post('orders/:orderId/payment-at-counter')
  @ApiOperation({ summary: 'Process payment at counter for a specific order (pay_at_counter model)' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethod: { type: 'string', enum: ['cash', 'card', 'qr'], description: 'Payment method' },
        amount: { type: 'number', description: 'Payment amount (must match order total)' },
      },
      required: ['paymentMethod', 'amount'],
    },
  })
  @ApiOkResponse({ description: 'Payment processed and order confirmed successfully' })
  async processPaymentAtCounter(
    @Param('orderId') orderId: string,
    @Body() paymentData: { paymentMethod: string; amount: number },
  ) {
    if (!paymentData.paymentMethod || !paymentData.amount) {
      throw new BadRequestException('Payment method and amount are required');
    }

    return this.cartService.processPaymentAtCounter(
      orderId,
      paymentData.paymentMethod as any,
      paymentData.amount,
    );
  }
}
