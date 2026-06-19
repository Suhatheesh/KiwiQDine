import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { CustomerManagementService } from './customer-management.service';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { UserRole } from '../infrastructure/database/entities';
import { GetCustomersQueryDto } from './dto/get-customers-query.dto';
import { CreateOrFindCustomerDto } from './dto/create-or-find-customer.dto';

@ApiTags('Customer Management')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomerManagementController {
  constructor(private readonly customerManagementService: CustomerManagementService) { }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  @ApiOperation({ summary: 'Get all customers with role-based filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'tenantId', required: false, type: String, description: 'Filter by tenant ID (SUPER_ADMIN only)' })
  @ApiQuery({ name: 'restaurantId', required: false, type: String, description: 'Filter by restaurant ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by phone number' })
  @ApiOkResponse({ description: 'List of customers with tenant and restaurant information' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async findAll(
    @CurrentUser() user: any,
    @Query() query: GetCustomersQueryDto,
  ) {
    const { tenantId, restaurantId, search, ...pagination } = query;
    const filters: any = {};
    if (tenantId) filters.tenantId = tenantId;
    if (restaurantId) filters.restaurantId = restaurantId;
    if (search) filters.search = search;

    return this.customerManagementService.findAll(user, pagination, filters);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  @ApiOperation({
    summary: 'Create or find customer by phone number',
    description: 'If a customer with the provided phone number exists, returns the existing customer. Otherwise, creates a new customer with the provided phone and name. Updates the name if it has changed.'
  })
  @ApiOkResponse({
    description: 'Customer found or created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        phone: { type: 'string' },
        name: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async createOrFind(@Body() createOrFindDto: CreateOrFindCustomerDto) {
    const customer = await this.customerManagementService.createOrFind(createOrFindDto);
    return {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  @Get('phone/:phone')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  @ApiOperation({
    summary: 'Get customer details by phone number',
    description: 'Retrieves customer details including orders, restaurants, and tenants based on phone number. Access is controlled based on user role and restaurant/tenant associations.'
  })
  @ApiParam({
    name: 'phone',
    description: 'Customer phone number',
    example: '+1234567890'
  })
  @ApiOkResponse({
    description: 'Customer details with orders, restaurants, and tenants',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        phone: { type: 'string' },
        restaurants: { type: 'array' },
        tenants: { type: 'array' },
        totalOrders: { type: 'number' },
        orders: { type: 'array' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions or customer not accessible' })
  async findByPhone(@CurrentUser() user: any, @Param('phone') phone: string) {
    return this.customerManagementService.findByPhone(phone, user);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  @ApiOperation({ summary: 'Get customer details by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID', format: 'uuid' })
  @ApiOkResponse({ description: 'Customer details with orders, restaurants, and tenants' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions or customer not accessible' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customerManagementService.findOne(id, user);
  }
}

