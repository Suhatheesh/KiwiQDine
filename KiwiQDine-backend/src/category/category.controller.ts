import { Body, Controller, Delete, Get, Inject, Param, Post, Patch, UseGuards, Query, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
  getSchemaPath,
  ApiBearerAuth
} from '@nestjs/swagger';

import { Result } from './../domain/result/result';
import { TYPES } from './../application/constants/types';
import { CreateCategoryDTO } from './create-category.schema';
import { UpdateCategoryDTO } from './update-category.dto';
import { ReorderCategoryDTO } from './reorder-category.dto';
import { ICategoryService } from './category-service.interface';
import { ICategoryResponseDTO, CategoryBooleanResultDoc, CategoryListResultDoc, CategoryResponseDoc, CategoryResultDoc } from './category-response.dto';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { UserRole } from '../infrastructure/database/entities';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';

@ApiTags('Categories')
@ApiExtraModels(CategoryResponseDoc, CategoryResultDoc, CategoryListResultDoc, CategoryBooleanResultDoc)
@Controller('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
  constructor(@Inject(TYPES.ICategoryService) private readonly categoryService: ICategoryService) { }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDTO })
  @ApiCreatedResponse({
    description: 'Category created successfully.',
    schema: { $ref: getSchemaPath(CategoryResultDoc) },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or category already exists.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Item Starters already exists',
        error: 'Bad Request',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflict while creating category due to duplicate records.',
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to create categories.' })
  async createCategory(
    @Body() request: CreateCategoryDTO,
    @CurrentUser() user: any,
  ): Promise<Result<ICategoryResponseDTO>> {
    // Enforce restaurant access control for non-admin users
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.restaurantId) {
        throw new ForbiddenException('User does not have an associated restaurant. Cannot create categories.');
      }
      // Non-admin users can only create categories for their own restaurant
      if (request.restaurantId && request.restaurantId !== user.restaurantId) {
        throw new ForbiddenException('You can only create categories for your own restaurant.');
      }
      // Override restaurantId with user's restaurantId
      request.restaurantId = user.restaurantId;
    } else {
      // SUPER_ADMIN must provide restaurantId
      if (!request.restaurantId) {
        throw new BadRequestException('restaurantId is required');
      }
    }
    return await this.categoryService.createCategory(request);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Retrieve all categories' })
  @ApiOkResponse({
    description: 'List of categories retrieved successfully.',
    schema: { $ref: getSchemaPath(CategoryListResultDoc) },
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to access categories.' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant identifier (UUID). For non-admin users, this is automatically set to their restaurant.', type: String })
  async getCategories(
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ): Promise<Result<ICategoryResponseDTO[]>> {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return await this.categoryService.getCategories(targetRestaurantId);
  }

  @Get('restaurants')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Get restaurants that have menu items in a specific category' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Category identifier (UUID). Either categoryId or categoryName must be provided.', type: String })
  @ApiQuery({ name: 'categoryName', required: false, description: 'Category name (case-insensitive). Either categoryId or categoryName must be provided.', type: String })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Optional tenant ID to filter restaurants within a specific tenant.', type: String })
  @ApiOkResponse({
    description: 'List of restaurants that have menu items in the specified category.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          logo: { type: 'string', nullable: true },
          address: { type: 'object', nullable: true },
          contactEmail: { type: 'string', nullable: true },
          contactPhoneNumber: { type: 'string', nullable: true },
          openTime: { type: 'string', nullable: true },
          closeTime: { type: 'string', nullable: true },
          openHours: { type: 'object', nullable: true },
          status: { type: 'string' },
          isActive: { type: 'boolean' },
          paymentTiming: { type: 'string', nullable: true },
          tenantId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Either categoryId or categoryName must be provided.' })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to access this resource.' })
  async getRestaurantsByCategory(
    @Query('categoryId') categoryId?: string,
    @Query('categoryName') categoryName?: string,
    @Query('tenantId') tenantId?: string,
    @CurrentUser() user?: any,
  ): Promise<Result<any[]>> {
    // For non-admin users, optionally filter by tenant if they have one
    let finalTenantId = tenantId;
    if (user && user.role !== UserRole.SUPER_ADMIN && user.tenantId) {
      // Non-admin users can only see restaurants in their tenant
      finalTenantId = user.tenantId;
    }

    return await this.categoryService.getRestaurantsByCategory(categoryId, categoryName, finalTenantId);
  }

  @Get('/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.WAITER,
    UserRole.KITCHEN_STAFF,
  )
  @ApiOperation({ summary: 'Retrieve a category by identifier' })
  @ApiParam({ name: 'id', description: 'Category identifier', format: 'uuid' })
  @ApiOkResponse({
    description: 'Category details retrieved successfully.',
    schema: { $ref: getSchemaPath(CategoryResultDoc) },
  })
  @ApiNotFoundResponse({
    description: 'Category not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Category not found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to access this category.' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant identifier (UUID). For non-admin users, this is automatically set to their restaurant.', type: String })
  async getCategory(
    @Param('id') categoryId: string,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ): Promise<Result<ICategoryResponseDTO>> {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return await this.categoryService.getCategoryById(categoryId, targetRestaurantId);
  }

  @Patch('reorder')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update categories display order' })
  @ApiBody({ type: ReorderCategoryDTO })
  @ApiOkResponse({ description: 'Categories reordered successfully' })
  async reorderCategories(
    @Body() request: ReorderCategoryDTO,
    @CurrentUser() user: any,
  ): Promise<Result<boolean>> {
    const targetRestaurantId = this.getAuthorizedRestaurantId(request.restaurantId, user);
    return await this.categoryService.reorderCategories(targetRestaurantId, request.orders);
  }

  @Patch('/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category identifier', format: 'uuid' })
  @ApiBody({ type: UpdateCategoryDTO })
  @ApiOkResponse({
    description: 'Category updated successfully.',
    schema: { $ref: getSchemaPath(CategoryResultDoc) },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or category name already exists.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Category with name Starters already exists',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Category not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Category not found for this restaurant',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to update categories.' })
  @ApiQuery({ name: 'restaurantId', required: false, description: 'Restaurant identifier (UUID). For non-admin users, this is automatically set to their restaurant.', type: String })
  async updateCategory(
    @Param('id') categoryId: string,
    @Body() request: UpdateCategoryDTO,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ): Promise<Result<ICategoryResponseDTO>> {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return await this.categoryService.updateCategory(categoryId, request, targetRestaurantId);
  }

  @Delete()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete categories in bulk' })
  @ApiOkResponse({
    description: 'Categories deleted successfully.',
    schema: { $ref: getSchemaPath(CategoryBooleanResultDoc) },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request payload.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid category identifiers supplied',
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User authentication required.' })
  @ApiForbiddenResponse({ description: 'User does not have permission to delete categories.' })
  @ApiBody({
    description: 'Collection of category identifiers to delete',
    schema: {
      type: 'object',
      properties: {
        restaurantId: {
          type: 'string',
          format: 'uuid',
          example: 'restaurant-uuid',
        },
        ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          example: ['category-uuid-1', 'category-uuid-2'],
        },
      },
      required: ['restaurantId', 'ids'],
    },
  })
  async deleteCategories(
    @Body() request: { ids: string[]; restaurantId?: string },
    @CurrentUser() user: any,
  ): Promise<Result<boolean>> {
    const targetRestaurantId = this.getAuthorizedRestaurantId(request.restaurantId, user);
    return await this.categoryService.deleteCategories(request.ids, targetRestaurantId);
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
      throw new ForbiddenException('User does not have an associated restaurant. Cannot access categories.');
    }

    // If user tries to access a different restaurant, deny access
    if (restaurantId && restaurantId !== user.restaurantId) {
      throw new ForbiddenException('You can only access categories for your own restaurant.');
    }

    // Use the user's restaurantId (ignore query param for non-admin users)
    return user.restaurantId;
  }
}
