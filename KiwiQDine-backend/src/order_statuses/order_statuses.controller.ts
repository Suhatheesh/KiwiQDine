import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiInternalServerErrorResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { TYPES } from 'src/application';
import { CreateOrderStatusDto } from './dto/create-order_status.dto';
import { IOrderStatusService } from './interface/order-status-service.interface';
import { OrderStatusListResultDoc, OrderStatusResponseDoc, OrderStatusResultDoc } from './dto/order-status-response';

@ApiTags('Order Statuses')
@ApiExtraModels(OrderStatusResponseDoc, OrderStatusResultDoc, OrderStatusListResultDoc)
@Controller('order-statuses')
export class OrderStatusesController {
  constructor(@Inject(TYPES.IOrderStatusService) private readonly orderStatusesService: IOrderStatusService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order status' })
  @ApiBody({ type: CreateOrderStatusDto })
  @ApiCreatedResponse({
    description: 'Order status created successfully.',
    schema: { $ref: getSchemaPath(OrderStatusResultDoc) },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or the status already exists.',
    schema: {
      example: {
        statusCode: 400,
        message: 'order status already exists',
        error: 'Bad Request',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Order status with similar properties is already present.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected error occurred while creating the order status.',
  })
  create(@Body() createOrderStatusDto: CreateOrderStatusDto) {
    return this.orderStatusesService.createOrderStatus(createOrderStatusDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all order statuses' })
  @ApiOkResponse({
    description: 'List of order statuses returned successfully.',
    schema: { $ref: getSchemaPath(OrderStatusListResultDoc) },
  })
  findAll() {
    return this.orderStatusesService.getOrderStatuses();
  }
}
