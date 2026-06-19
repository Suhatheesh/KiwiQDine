import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiCreatedResponse, getSchemaPath, ApiExtraModels, ApiBearerAuth, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { OrderManagementService } from './order-management.service';
import { CreateOrderDto } from './dto/order-management.dto';
import { Order } from '../infrastructure/database/entities';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { UserRole } from '../infrastructure/database/entities';

@ApiTags('Orders')
@ApiExtraModels(Order)
@Controller('order')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrderAliasController {
    constructor(private readonly orderManagementService: OrderManagementService) { }

    @Post()
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER)
    @ApiOperation({ summary: 'Create a new order (Alias for /orders)' })
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
}
