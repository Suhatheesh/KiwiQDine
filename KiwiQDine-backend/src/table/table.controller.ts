import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, BadRequestException, ForbiddenException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiForbiddenResponse, ApiUnauthorizedResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { UserRole } from '../infrastructure/database/entities';
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { Table, TableStatus } from '../infrastructure/database/entities';
import { PaginationDto } from '../shared/dto/pagination.dto';

@ApiTags('Tables')
@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TableController {
  constructor(private readonly tableService: TableService) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new table' })
  @ApiBody({ type: CreateTableDto })
  @ApiOkResponse({ description: 'Table created successfully.', type: Table })
  @ApiBadRequestResponse({ description: 'Invalid input or restaurant not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to create tables.' })
  async createTable(
    @Body() createTableDto: CreateTableDto,
    @CurrentUser() user: any,
  ) {
    // Enforce restaurant access control for non-admin users
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.restaurantId) {
        throw new ForbiddenException('User does not have an associated restaurant. Cannot create tables.');
      }
      // Non-admin users can only create tables for their own restaurant
      if (createTableDto.restaurantId && createTableDto.restaurantId !== user.restaurantId) {
        throw new ForbiddenException('You can only create tables for your own restaurant.');
      }
      // Override restaurantId with user's restaurantId
      createTableDto.restaurantId = user.restaurantId;
    } else {
      // SUPER_ADMIN must provide restaurantId
      if (!createTableDto.restaurantId) {
        throw new BadRequestException('restaurantId is required');
      }
    }
    return this.tableService.createTable(createTableDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all tables for a restaurant with order status',
    description: 'Returns paginated list of tables with enriched order status information. Each table includes:\n' +
      '- activeOrdersCount: Total active orders on the table\n' +
      '- pendingOrdersCount: Orders awaiting waiter confirmation (customer-created orders)\n' +
      '- hasPendingOrders: Boolean flag to highlight tables needing attention\n' +
      '- latestOrder: Most recent order details\n' +
      '- activeOrders: List of all active orders for the table\n\n' +
      'This helps waiters quickly identify tables with pending customer orders that need confirmation.'
  })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN, auto-set for other roles)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiOkResponse({
    description: 'Paginated list of tables with order status information.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              tableNumber: { type: 'string' },
              capacity: { type: 'number' },
              status: { type: 'string', enum: ['available', 'occupied', 'reserved', 'maintenance'] },
              orderStatus: {
                type: 'object',
                properties: {
                  activeOrdersCount: { type: 'number', description: 'Total active orders on this table' },
                  pendingOrdersCount: { type: 'number', description: 'Orders awaiting waiter confirmation' },
                  hasPendingOrders: { type: 'boolean', description: 'Flag to highlight tables needing attention' },
                  latestOrder: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'string' },
                      orderNumber: { type: 'string' },
                      status: { type: 'string' },
                      customerName: { type: 'string' },
                      totalAmount: { type: 'number' },
                      itemCount: { type: 'number' },
                      createdAt: { type: 'string', format: 'date-time' },
                      createdByType: { type: 'string', enum: ['customer', 'staff'] }
                    }
                  },
                  activeOrders: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        orderNumber: { type: 'string' },
                        status: { type: 'string' },
                        customerName: { type: 'string' },
                        totalAmount: { type: 'number' },
                        itemCount: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' },
                        createdByType: { type: 'string', enum: ['customer', 'staff'] }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to view tables.' })
  async getTables(
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    const pagination: PaginationDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    return this.tableService.findAll(targetRestaurantId, pagination);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a table by ID' })
  @ApiParam({ name: 'id', description: 'Table identifier', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN, auto-set for other roles)' })
  @ApiOkResponse({ description: 'Table details.', type: Table })
  @ApiNotFoundResponse({ description: 'Table not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to view this table.' })
  async getTable(
    @Param('id') id: string,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.tableService.findOne(id, targetRestaurantId);
  }

  // Specific routes must be defined before general routes to avoid route conflicts
  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update table booking status' })
  @ApiParam({ name: 'id', description: 'Table identifier', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN, auto-set for other roles)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(TableStatus),
          example: TableStatus.AVAILABLE
        }
      },
      required: ['status']
    }
  })
  @ApiOkResponse({ description: 'Table status updated successfully.', type: Table })
  @ApiNotFoundResponse({ description: 'Table not found.' })
  @ApiBadRequestResponse({ description: 'Invalid status value.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to update this table status.' })
  async updateTableStatus(
    @Param('id') id: string,
    @Query('restaurantId') restaurantId: string,
    @Body() body: { status: TableStatus },
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.tableService.updateTable(id, targetRestaurantId, { status: body.status });
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a table' })
  @ApiParam({ name: 'id', description: 'Table identifier', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN, auto-set for other roles)' })
  @ApiBody({ type: UpdateTableDto })
  @ApiOkResponse({ description: 'Table updated successfully.', type: Table })
  @ApiNotFoundResponse({ description: 'Table not found.' })
  @ApiBadRequestResponse({ description: 'Invalid input or table name already exists.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to update this table.' })
  async updateTable(
    @Param('id') id: string,
    @Query('restaurantId') restaurantId: string,
    @Body() updateTableDto: UpdateTableDto,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.tableService.updateTable(id, targetRestaurantId, updateTableDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a table' })
  @ApiParam({ name: 'id', description: 'Table identifier', format: 'uuid' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant ID (required for SUPER_ADMIN, auto-set for other roles)' })
  @ApiOkResponse({ description: 'Table deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Table not found.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to delete this table.' })
  async deleteTable(
    @Param('id') id: string,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    await this.tableService.deleteTable(id, targetRestaurantId);
    return { message: 'Table deleted successfully' };
  }

  /**
   * Get authorized restaurantId based on user role
   * - SUPER_ADMIN: Can access any restaurant (must provide restaurantId)
   * - Other roles: Can only access their own restaurant (user.restaurantId is used, query param is ignored)
   */
  private getAuthorizedRestaurantId(restaurantId: string | undefined, user: any): string {
    // For SUPER_ADMIN, allow them to specify restaurantId, but it's required
    if (user.role === UserRole.SUPER_ADMIN) {
      if (!restaurantId) {
        throw new BadRequestException('restaurantId is required for super admin');
      }
      return restaurantId;
    }

    // For all other roles, enforce that they can only access their own restaurant
    if (!user.restaurantId) {
      throw new ForbiddenException('User does not have an associated restaurant. Cannot access tables.');
    }

    // If user tries to access a different restaurant, deny access
    if (restaurantId && restaurantId !== user.restaurantId) {
      throw new ForbiddenException('You can only access tables for your own restaurant.');
    }

    // Use the user's restaurantId (ignore query param for non-admin users)
    return user.restaurantId;
  }
}

