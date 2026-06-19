import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiResponse,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';
import { OrderStatusService } from './order-status.service';
import { CreateOrderStatusDto, UpdateOrderItemStatusDto, CancelOrderDto, HoldOrderDto } from './dto/order-status.dto';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { UserRole, Order, OrderItem } from '../infrastructure/database/entities';
import { OrderStatus as OrderStatusEnum } from '../infrastructure/database/entities/order.entity';

class OrderStatusChangeResponseDoc {
  @ApiProperty({ description: 'Order identifier affected by the status update', format: 'uuid', example: '5f6b0a7c-9b0a-4ece-9e02-4b836f5ba705' })
  orderId: string;

  @ApiProperty({ description: 'Newly applied order status', enum: OrderStatusEnum, example: OrderStatusEnum.CONFIRMED })
  status: OrderStatusEnum;

  @ApiProperty({ description: 'Timestamp indicating when the status change occurred', example: '2024-05-10T14:25:00.000Z' })
  updatedAt: string;
}

class OrderStatusHistoryEntryDoc {
  @ApiProperty({ description: 'Status associated with the historical record', enum: OrderStatusEnum, example: OrderStatusEnum.PREPARING })
  status: OrderStatusEnum;

  @ApiProperty({ description: 'Timestamp for when the order was in this status', example: '2024-05-10T14:25:00.000Z' })
  updatedAt: string;
}

@ApiTags('Order Status')
@ApiExtraModels(Order, OrderItem, OrderStatusChangeResponseDoc, OrderStatusHistoryEntryDoc)
@ApiBearerAuth()
@Controller('order-status')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderStatusController {
  constructor(private readonly orderStatusService: OrderStatusService) { }

  @Get('order/:orderId/history')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Retrieve the status history for a specific order' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Collection of historical status entries.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(OrderStatusHistoryEntryDoc) },
    },
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to view this order history.' })
  getOrderStatusHistory(@Param('orderId') orderId: string) {
    return this.orderStatusService.getOrderStatusHistory(orderId);
  }

  @Get('active-orders')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Retrieve active orders awaiting processing' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Filter by restaurant identifier', example: 'restaurant-uuid' })
  @ApiQuery({ name: 'foodCourtId', required: false, description: 'Filter by food court identifier', example: 'foodcourt-uuid' })
  @ApiOkResponse({
    description: 'List of active orders.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(Order) },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to view active orders.' })
  getActiveOrders(
    @Query('restaurantId') restaurantId?: string,
    @Query('foodCourtId') foodCourtId?: string,
  ) {
    return this.orderStatusService.getActiveOrders(restaurantId, foodCourtId);
  }

  @Get('order/:orderId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Retrieve a specific order with its details' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order details including items and customer information.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to view this order.' })
  getOrderById(@Param('orderId') orderId: string) {
    return this.orderStatusService.getOrderById(orderId);
  }

  @Patch('order-item/:orderItemId/status')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Update the status of an order item' })
  @ApiParam({ name: 'orderItemId', description: 'Order item identifier', format: 'uuid' })
  @ApiBody({ type: UpdateOrderItemStatusDto })
  @ApiOkResponse({
    description: 'Order item updated successfully.',
    schema: { $ref: getSchemaPath(OrderItem) },
  })
  @ApiNotFoundResponse({ description: 'Order item not found.' })
  @ApiBadRequestResponse({ description: 'Invalid order item status payload.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to update this order item.' })
  updateOrderItemStatus(
    @Param('orderItemId') orderItemId: string,
    @Body() updateOrderItemStatusDto: UpdateOrderItemStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.orderStatusService.updateOrderItemStatus(
      orderItemId,
      updateOrderItemStatusDto.status,
      user.id,
      updateOrderItemStatusDto.additionalPreparationTime,
    );
  }

  @Post('order/:orderId/estimate-ready-time')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Estimate the time when the order will be ready' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Estimated ready time in ISO 8601 format.',
    schema: { type: 'string', format: 'date-time', example: '2024-05-10T15:00:00.000Z' },
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to estimate this order.' })
  estimateOrderReadyTime(@Param('orderId') orderId: string) {
    return this.orderStatusService.estimateOrderReadyTime(orderId);
  }

  @Post('order/:orderId/mark-ready')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Mark an order as ready' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order marked as ready successfully.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to mark this order as ready.' })
  markOrderAsReady(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.orderStatusService.markOrderAsReady(orderId, user.id);
  }

  @Post('order/:orderId/mark-completed')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
  )
  @ApiOperation({ summary: 'Mark an order as completed' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order marked as completed successfully.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to mark this order as completed.' })
  markOrderAsCompleted(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.orderStatusService.markOrderAsCompleted(orderId, user.id);
  }

  @Post('order/:orderId/cancel')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
  )
  @ApiOperation({ summary: 'Cancel an order (Staff)' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiBody({ type: CancelOrderDto })
  @ApiOkResponse({
    description: 'Order cancelled successfully.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiBadRequestResponse({ description: 'Invalid cancellation payload supplied.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to cancel this order.' })
  cancelOrder(
    @Param('orderId') orderId: string,
    @Body() cancelOrderDto: CancelOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.orderStatusService.cancelOrder(
      orderId,
      cancelOrderDto.reason,
      user.id,
    );
  }

  @Post('order/:orderId/hold')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
  )
  @ApiOperation({ summary: 'Put an order on hold (Staff)' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiBody({ type: HoldOrderDto })
  @ApiOkResponse({
    description: 'Order put on hold successfully.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiBadRequestResponse({ description: 'Invalid hold request or order cannot be put on hold.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to hold this order.' })
  holdOrder(
    @Param('orderId') orderId: string,
    @Body() holdOrderDto: HoldOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.orderStatusService.holdOrder(
      orderId,
      holdOrderDto.reason,
      user.id,
    );
  }

  @Post('order/:orderId/release')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
  )
  @ApiOperation({ summary: 'Release an order from hold (Staff)' })
  @ApiParam({ name: 'orderId', description: 'Order identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Order released from hold successfully.',
    schema: { $ref: getSchemaPath(Order) },
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiBadRequestResponse({ description: 'Order is not on hold.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to release this order.' })
  releaseOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.orderStatusService.releaseOrder(orderId, user.id);
  }

  // General POST route must be last to avoid intercepting specific routes
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Update an order status' })
  @ApiBody({ type: CreateOrderStatusDto })
  @ApiCreatedResponse({
    description: 'Order status updated successfully.',
    schema: { $ref: getSchemaPath(OrderStatusChangeResponseDoc) },
  })
  @ApiNotFoundResponse({ description: 'Order not found.' })
  @ApiBadRequestResponse({ description: 'Validation failed while updating the order status.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to update the order status.' })
  create(
    @Body() createOrderStatusDto: CreateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.orderStatusService.createOrderStatus(createOrderStatusDto, user.id);
  }
}
