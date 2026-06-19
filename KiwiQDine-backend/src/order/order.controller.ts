import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { TYPES } from 'src/application';
import { Result } from 'src/domain';

import { CreateOrderDTO, CreateCartItemsDTO, CreateSelectedItemsDTO } from './dto/create-order.dto';
import { IOrderResponseDTO, OrderResponseDoc, OrderResultDoc } from './order-response.dto';
import { IOrderService } from './interface/order-service.interface';

@ApiTags('Orders')
@ApiExtraModels(CreateOrderDTO, CreateCartItemsDTO, CreateSelectedItemsDTO, OrderResponseDoc, OrderResultDoc)
@Controller('legacy-orders')
export class OrderController {
  constructor(@Inject(TYPES.IOrderService) private readonly orderService: IOrderService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({
    description: 'Order payload including selected items grouped into cart items',
    type: CreateOrderDTO,
  })
  @ApiCreatedResponse({
    description: 'Order created successfully.',
    schema: {
      $ref: getSchemaPath(OrderResultDoc),
    },
  })
  async create(@Body() request: CreateOrderDTO): Promise<Result<IOrderResponseDTO>> {
    return this.orderService.createOrder(request);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of orders' })
  @ApiOkResponse({
    description: 'Array of order summaries.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(OrderResponseDoc) },
    },
  })
  async get(): Promise<IOrderResponseDTO[]> {
    return this.orderService.getOrdersBasic();
  }
}
