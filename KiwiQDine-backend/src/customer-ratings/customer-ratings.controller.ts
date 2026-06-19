import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CustomerRatingsService } from './customer-ratings.service';
import { CreateCustomerRatingDto } from './dto/create-customer-rating.dto';
import { GetCustomerRatingsQueryDto } from './dto/get-customer-ratings-query.dto';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { UserRole } from '../infrastructure/database/entities';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { Public } from '../infrastructure/auth/decorators/public.decorator';
import { CustomerRating } from '../infrastructure/database/entities';

@ApiTags('Customer Ratings & Comments')
@Controller('customer-ratings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerRatingsController {
  constructor(private readonly customerRatingsService: CustomerRatingsService) { }

  @Post()
  @Public() // Allow customers to rate without authentication (or use customer role)
  @ApiOperation({ summary: 'Create a new customer rating and comment' })
  @ApiCreatedResponse({
    description: 'Rating created successfully.',
    type: CustomerRating,
  })
  @ApiBadRequestResponse({ description: 'Invalid input or order validation failed' })
  @ApiNotFoundResponse({ description: 'Customer or restaurant not found' })
  async create(@Body() createRatingDto: CreateCustomerRatingDto): Promise<CustomerRating> {
    return this.customerRatingsService.create(createRatingDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER)
  @ApiOperation({ summary: 'Get all customer ratings with filters' })
  @ApiOkResponse({ description: 'List of customer ratings retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async findAll(@Query() query: GetCustomerRatingsQueryDto) {
    // Build pagination object
    const pagination: PaginationDto = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    // Build filters object
    const filters: any = {};
    if (query.customerId) filters.customerId = query.customerId;
    if (query.restaurantId) filters.restaurantId = query.restaurantId;
    if (query.orderId) filters.orderId = query.orderId;
    if (query.minRating !== undefined) filters.minRating = query.minRating;
    if (query.maxRating !== undefined) filters.maxRating = query.maxRating;

    return this.customerRatingsService.findAll(filters, pagination);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER)
  @ApiOperation({ summary: 'Get customer rating by ID' })
  @ApiParam({ name: 'id', description: 'Rating ID', format: 'uuid' })
  @ApiOkResponse({ description: 'Customer rating retrieved successfully', type: CustomerRating })
  @ApiNotFoundResponse({ description: 'Rating not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async findOne(@Param('id') id: string): Promise<CustomerRating> {
    return this.customerRatingsService.findOne(id);
  }

  @Get('restaurant/:restaurantId/average')
  @Public() // Public endpoint for displaying restaurant ratings
  @ApiOperation({ summary: 'Get average rating and statistics for a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant ID', format: 'uuid' })
  @ApiOkResponse({
    description: 'Restaurant rating statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        averageRating: { type: 'number', example: 4.5 },
        totalRatings: { type: 'number', example: 150 },
        ratingDistribution: {
          type: 'object',
          example: { 1: 5, 2: 10, 3: 20, 4: 50, 5: 65 },
        },
      },
    },
  })
  async getRestaurantAverageRating(@Param('restaurantId') restaurantId: string) {
    return this.customerRatingsService.getRestaurantAverageRating(restaurantId);
  }
}

