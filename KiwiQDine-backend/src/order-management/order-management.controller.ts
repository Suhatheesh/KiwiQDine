import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';
import { OrderManagementService } from './order-management.service';
import { CreateOrderDto, UpdateOrderDto, ProcessPaymentDto, UpdateOrderItemStatusDto } from './dto/order-management.dto';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { UserRole, Order, OrderItem, Restaurant, Customer, Payment, OrderAction } from '../infrastructure/database/entities';
import { OrderActivityLogService } from '../order-status/order-activity-log.service';
import { ForbiddenException } from '@nestjs/common';

class OrderAnalyticsSummaryDoc {
  @ApiProperty({ description: 'Total number of orders within the requested window', example: 152 })
  totalOrders: number;

  @ApiProperty({ description: 'Total revenue generated within the requested window', example: 4352.75 })
  totalRevenue: number;

  @ApiProperty({ description: 'Average order value computed across the selected orders', example: 28.64 })
  averageOrderValue: number;

  @ApiProperty({
    description: 'Breakdown of orders grouped by status',
    example: { pending: 45, confirmed: 60, completed: 30, cancelled: 17 },
    additionalProperties: { type: 'number' },
    type: 'object',
  })
  ordersByStatus: Record<string, number>;

  @ApiProperty({
    description: 'Date range applied to the analytics calculation (ISO 8601 strings)',
    example: { startDate: '2024-05-01', endDate: '2024-05-31' },
    type: 'object',
  })
  dateRange: { startDate?: string; endDate?: string };
}

@ApiTags('Order Management')
@ApiExtraModels(Order, OrderItem, Restaurant, Customer, Payment, OrderAnalyticsSummaryDoc)
@Controller(['orders', 'order-management'])
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrderManagementController {
  constructor(
    private readonly orderManagementService: OrderManagementService,
    private readonly orderActivityLogService: OrderActivityLogService,
  ) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({
    description: 'Order created successfully.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed while creating the order or referenced entities are missing.',
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to create orders.' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while creating the order.' })
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: any) {
    return this.orderManagementService.createOrder(createOrderDto, user);
  }

  @Get('cashier/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WAITER, UserRole.MANAGER, UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending orders for cashier (awaiting payment confirmation)' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant ID' })
  @ApiQuery({ name: 'orderType', required: false, description: 'Filter by order type (takeaway, parking, dine_in)' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'customerName', required: false, description: 'Filter by customer name (partial match)' })
  @ApiQuery({ name: 'tableNo', required: false, description: 'Filter by table number' })
  @ApiQuery({ name: 'orderNumber', required: false, description: 'Filter by order number (partial match)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiOkResponse({
    description: 'Paginated list of pending orders awaiting payment confirmation',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Order) },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async getCashierPendingOrders(
    @Query('restaurantId') restaurantId: string,
    @Query('orderType') orderType?: string,
    @Query('date') date?: string,
    @Query('customerName') customerName?: string,
    @Query('tableNo') tableNo?: string,
    @Query('orderNumber') orderNumber?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    if (!restaurantId) {
      throw new BadRequestException('Restaurant ID is required');
    }

    // Verify user has access to this restaurant
    // WAITER role: restricted to their assigned restaurant
    // MANAGER/TENANT_ADMIN/SUPER_ADMIN: can access any restaurant
    if (user?.role === UserRole.WAITER && user?.restaurantId !== restaurantId) {
      throw new ForbiddenException('You can only view orders from your assigned restaurant');
    }

    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };

    return this.orderManagementService.getCashierPendingOrders(
      restaurantId,
      orderType,
      date,
      customerName,
      tableNo,
      orderNumber,
      pagination
    );
  }

  @Get('customer/my-orders')
  @ApiOperation({ summary: 'Customer view their orders by phone number (Public - No Auth)' })
  @ApiQuery({ name: 'phone', required: true, description: 'Customer phone number' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Filter by specific restaurant (optional)' })
  @ApiOkResponse({
    description: 'List of customer orders.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(Order) },
    },
  })
  @ApiBadRequestResponse({ description: 'Phone number is required.' })
  async findCustomerOrders(
    @Query('phone') phone: string,
    @Query('restaurantId') restaurantId?: string,
  ) {
    // Public endpoint - no authentication required
    // Customers can view their orders by providing phone number
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }
    return this.orderManagementService.findOrdersByCustomerPhone(phone, restaurantId);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Retrieve orders with optional filters' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Filter by restaurant identifier' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiQuery({ name: 'orderType', required: false, description: 'Filter by order type', enum: ['dine_in', 'takeaway', 'parking'] })
  @ApiQuery({ name: 'paymentStatus', required: false, description: 'Filter by payment status' })
  @ApiQuery({ name: 'paymentMethod', required: false, description: 'Filter by payment method', enum: ['cash', 'card', 'qr', 'cashier'] })
  @ApiQuery({ name: 'isHold', required: false, type: Boolean, description: 'Filter by hold status (true for on-hold orders, false for non-hold orders)' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by order creation date (ISO string, YYYY-MM-DD)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO string, YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO string, YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiOkResponse({
    description: 'Paginated list of orders matching the filters.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(Order) },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to view these orders.' })
  findAll(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: string,
    @Query('orderType') orderType?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('isHold') isHold?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    return this.orderManagementService.findAll(
      {
        restaurantId,
        status,
        orderType,
        paymentStatus,
        paymentMethod,
        isHold: isHold !== undefined ? isHold === 'true' : undefined,
        date,
        startDate,
        endDate,
      },
      user,
      pagination,
    );
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Retrieve a single order' })
  @ApiParam({ name: 'id', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order details.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to view this order.' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orderManagementService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
  )
  @ApiOperation({ summary: 'Update order details' })
  @ApiParam({ name: 'id', description: 'Order identifier', format: 'uuid' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiOkResponse({
    description: 'Updated order.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiBadRequestResponse({ description: 'Invalid update payload supplied.' })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to update this order.' })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.orderManagementService.update(id, updateOrderDto, user);
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
  )
  @ApiOperation({ summary: 'Delete an order' })
  @ApiParam({ name: 'id', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order deleted successfully.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Order deleted successfully.',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Order cannot be deleted in its current status.' })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to delete this order.' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orderManagementService.remove(id, user);
  }

  @Post(':id/confirm')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
  )
  @ApiOperation({ summary: 'Confirm an order' })
  @ApiParam({ name: 'id', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order confirmed successfully.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiBadRequestResponse({ description: 'Order cannot be confirmed in its current status.' })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to confirm this order.' })
  confirmOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orderManagementService.confirmOrder(id, user);
  }

  @Get('tables/:tableId/pending-orders')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
  )
  @ApiOperation({
    summary: 'Get all pending orders for a specific table (Waiter Verification)',
    description: 'Retrieve all orders for a table that are pending waiter confirmation. Used by waiters to verify customer orders before sending to kitchen. Only shows orders in PENDING status for pay-last restaurants with waiter confirmation enabled.'
  })
  @ApiParam({ name: 'tableId', description: 'Table identifier', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant identifier (optional, will use user restaurant if not provided)' })
  @ApiOkResponse({
    description: 'List of pending orders for the table with full customer and item details.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(Order) },
    },
  })
  @ApiNotFoundResponse({ description: 'Table not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to view these orders.' })
  getTablePendingOrders(
    @Param('tableId') tableId: string,
    @Query('restaurantId') restaurantId: string | undefined,
    @CurrentUser() user: any
  ) {
    return this.orderManagementService.getTablePendingOrders(tableId, restaurantId, user);
  }

  @Post(':id/waiter-confirm')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
  )
  @ApiOperation({
    summary: 'Waiter confirms order and sends to kitchen',
    description: 'Waiter verifies the order details with customer and confirms it. Order status changes from PENDING to CONFIRMED and is sent to kitchen. Only applicable for pay-last restaurants with waiter confirmation enabled.'
  })
  @ApiParam({ name: 'id', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order confirmed by waiter and sent to kitchen successfully.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiBadRequestResponse({ description: 'Order cannot be confirmed (wrong status, restaurant settings, etc.).' })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to confirm this order.' })
  waiterConfirmOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orderManagementService.waiterConfirmOrder(id, user);
  }


  @Patch(':id/items/:itemId/status')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Update an order item status' })
  @ApiParam({ name: 'id', description: 'Order identifier', format: 'uuid' })
  @ApiParam({ name: 'itemId', description: 'Order item identifier', format: 'uuid' })
  @ApiBody({ type: UpdateOrderItemStatusDto })
  @ApiOkResponse({
    description: 'Order item status updated successfully.',
    schema: { $ref: getSchemaPath(OrderItem) },
  })
  @ApiNotFoundResponse({ description: 'Order or order item not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to update item status.' })
  updateOrderItemStatus(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateOrderItemStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.orderManagementService.updateOrderItemStatus(id, itemId, updateDto, user);
  }

  @Post(':id/process-payment')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
  )
  @ApiOperation({ summary: 'Record payment information for an order' })
  @ApiParam({ name: 'id', description: 'Order identifier', format: 'uuid' })
  @ApiBody({ type: ProcessPaymentDto })
  @ApiOkResponse({
    description: 'Payment processed successfully.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiBadRequestResponse({ description: 'Payment data is invalid.' })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to process payments on this order.' })
  processPayment(
    @Param('id') id: string,
    @Body() paymentData: ProcessPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.orderManagementService.processPayment(id, paymentData, user);
  }

  @Post(':id/mark-done')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
  )
  @ApiOperation({ summary: 'Mark order as done (completed) - Cashier endpoint' })
  @ApiParam({ name: 'id', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order marked as done successfully.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiBadRequestResponse({ description: 'Order cannot be marked as done in its current status.' })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to mark this order as done.' })
  markOrderAsDone(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orderManagementService.markOrderAsDone(id, user);
  }

  @Get('analytics/summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Retrieve summary analytics for orders with comprehensive filters' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Filter by restaurant identifier' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Time period filter',
    enum: ['today', 'last7days', 'last30days', 'total'],
    example: 'last7days'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for custom analytics window (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for custom analytics window (YYYY-MM-DD)' })
  @ApiQuery({
    name: 'orderType',
    required: false,
    description: 'Filter by order type',
    enum: ['dine_in', 'takeaway']
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by order status',
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']
  })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    description: 'Filter by payment method',
    enum: ['cash', 'card', 'qr', 'cashier']
  })
  @ApiOkResponse({
    description: 'Aggregated analytics data with category performance, payment methods, and peak hours.',
    schema: { $ref: getSchemaPath(OrderAnalyticsSummaryDoc) },
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to view analytics.' })
  getOrderAnalytics(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('orderType') orderType?: string,
    @Query('status') status?: string,
    @Query('paymentMethod') paymentMethod?: string,
  ) {
    return this.orderManagementService.getOrderAnalytics(
      {
        restaurantId,
        period,
        startDate,
        endDate,
        orderType,
        status,
        paymentMethod,
      },
      user,
    );
  }

  @Get('kot/summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Get KOT (Kitchen Order Ticket) summary - order counts by status' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant identifier' })
  @ApiOkResponse({
    description: 'Order counts grouped by status (pending, preparing, ready, completed)',
  })
  getKOTSummary(
    @CurrentUser() user: any,
    @Query('restaurantId') restaurantId: string,
  ) {
    if (!restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }
    return this.orderManagementService.getKOTSummary(restaurantId, user);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get activity logs for a specific order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiOkResponse({ description: 'List of activity logs' })
  getOrderLogs(@Param('id') id: string, @CurrentUser() user: any) {
    return this.orderManagementService.getOrderLogs(id, user);
  }

  @Get('logs/recent')
  @ApiOperation({ summary: 'Get recent activity logs for a restaurant' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant ID' })
  @ApiOkResponse({ description: 'List of recent activity logs' })
  getRecentLogs(
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    if (!restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }
    return this.orderManagementService.getRecentLogs(restaurantId, user);
  }

  @Get('logs/staff/:staffId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
  )
  @ApiOperation({ summary: 'Get activity logs for a specific staff member' })
  @ApiParam({ name: 'staffId', description: 'Staff member user ID', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Filter by restaurant ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering (ISO 8601)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering (ISO 8601)', example: '2025-01-31' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by specific action type', enum: OrderAction })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of logs to return' })
  @ApiOkResponse({ description: 'Staff activity logs retrieved successfully' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async getStaffLogs(
    @Param('staffId') staffId: string,
    @Query('restaurantId') restaurantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('action') action?: OrderAction,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    // Permission check: Only allow access to staff in same restaurant (unless SUPER_ADMIN)
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!restaurantId) {
        restaurantId = user.restaurantId;
      }
      if (restaurantId !== user.restaurantId) {
        throw new ForbiddenException('Access denied: You can only view logs for your own restaurant');
      }
    }

    const options: any = {};
    if (restaurantId) options.restaurantId = restaurantId;
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);
    if (action) options.action = action;
    if (limit) options.limit = parseInt(limit, 10);

    return this.orderActivityLogService.getStaffLogs(staffId, options);
  }

  @Get('logs/staff/:staffId/performance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
  )
  @ApiOperation({ summary: 'Get performance statistics for a specific staff member' })
  @ApiParam({ name: 'staffId', description: 'Staff member user ID', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Filter by restaurant ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for analysis (ISO 8601)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for analysis (ISO 8601)', example: '2025-01-31' })
  @ApiOkResponse({ description: 'Staff performance statistics retrieved successfully' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async getStaffPerformance(
    @Param('staffId') staffId: string,
    @Query('restaurantId') restaurantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    // Permission check: Only allow access to staff in same restaurant (unless SUPER_ADMIN)
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!restaurantId) {
        restaurantId = user.restaurantId;
      }
      if (restaurantId !== user.restaurantId) {
        throw new ForbiddenException('Access denied: You can only view performance for your own restaurant');
      }
    }

    return this.orderActivityLogService.getStaffPerformanceStats(
      staffId,
      restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('analytics/performance-review')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
  )
  @ApiOperation({ summary: 'Get monthly performance review for all staff' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant ID' })
  @ApiQuery({ name: 'year', required: true, type: Number, description: 'Year (e.g., 2025)' })
  @ApiQuery({ name: 'month', required: true, type: Number, description: 'Month (1-12)' })
  @ApiOkResponse({ description: 'Monthly performance review data' })
  async getMonthlyPerformanceReview(
    @Query('restaurantId') restaurantId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @CurrentUser() user?: any,
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Access denied: You can only view analytics for your own restaurant');
    }

    return this.orderActivityLogService.getMonthlyPerformanceReview(
      restaurantId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get('analytics/efficiency-comparison')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
  )
  @ApiOperation({ summary: 'Compare efficiency between staff members' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiOkResponse({ description: 'Staff efficiency comparison data' })
  async getStaffEfficiencyComparison(
    @Query('restaurantId') restaurantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Access denied: You can only view analytics for your own restaurant');
    }

    return this.orderActivityLogService.getStaffEfficiencyComparison(
      restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('analytics/attendance')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
  )
  @ApiOperation({ summary: 'Get attendance tracking for all staff' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO 8601)' })
  @ApiOkResponse({ description: 'Staff attendance data' })
  async getAttendanceTracking(
    @Query('restaurantId') restaurantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user?: any,
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Access denied: You can only view analytics for your own restaurant');
    }

    if (!startDate || !endDate) {
      throw new BadRequestException('Both startDate and endDate are required');
    }

    return this.orderActivityLogService.getAttendanceTracking(
      restaurantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('analytics/peak-hours')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
  )
  @ApiOperation({ summary: 'Get peak hour analysis for staffing optimization' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO 8601)' })
  @ApiOkResponse({ description: 'Peak hour analysis data' })
  async getPeakHourAnalysis(
    @Query('restaurantId') restaurantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any,
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Access denied: You can only view analytics for your own restaurant');
    }

    return this.orderActivityLogService.getPeakHourAnalysis(
      restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
