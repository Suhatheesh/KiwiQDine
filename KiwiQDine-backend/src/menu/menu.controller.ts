import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Query, Req, BadRequestException, ForbiddenException, UploadedFile, UseInterceptors, Res, StreamableFile } from '@nestjs/common';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiParam, ApiQuery, ApiOkResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { Roles } from '../infrastructure/auth/decorators/roles.decorator';
import { Public } from '../infrastructure/auth/decorators/public.decorator';
import { CurrentUser } from '../infrastructure/auth/decorators/current-user.decorator';
import { UserRole } from '../infrastructure/database/entities';
import { MenuService } from './menu.service';
import { MenuExcelService } from './menu-excel.service';
import { CreateMenuDTO } from './create-menu.schema';
import { UpdateMenuDTO } from './update-menu.schema';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { EnhancedPaginationDto } from '../shared/dto/enhanced-pagination.dto';

@Controller('menus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly menuExcelService: MenuExcelService,
  ) { }

  @Get('export/excel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Export menus to Excel' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant identifier (UUID)' })
  @ApiOkResponse({ description: 'Excel file downloaded' })
  async exportMenusToExcel(
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    const buffer = await this.menuExcelService.exportMenusToExcel(targetRestaurantId);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="menus-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('export/categories/excel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Export categories to Excel' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant identifier (UUID)' })
  @ApiOkResponse({ description: 'Excel file downloaded' })
  async exportCategoriesToExcel(
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    const buffer = await this.menuExcelService.exportCategoriesToExcel(targetRestaurantId);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="categories-${Date.now()}.xlsx"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Post('import/excel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import menus from Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        restaurantId: {
          type: 'string',
          format: 'uuid',
        },
      },
      required: ['file', 'restaurantId'],
    },
  })
  @ApiOkResponse({ description: 'Import completed with results' })
  async importMenusFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.menuExcelService.importMenusFromExcel(targetRestaurantId, file.buffer, user.id);
  }

  @Post('import/categories/excel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import categories from Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        restaurantId: {
          type: 'string',
          format: 'uuid',
        },
      },
      required: ['file', 'restaurantId'],
    },
  })
  @ApiOkResponse({ description: 'Import completed with results' })
  async importCategoriesFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.menuExcelService.importCategoriesFromExcel(targetRestaurantId, file.buffer);
  }

  @Get('template/menu')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Download menu import template' })
  @ApiOkResponse({ description: 'Template Excel file downloaded' })
  async downloadMenuTemplate(@Res() res: Response) {
    const buffer = await this.menuExcelService.generateMenuTemplate();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="menu-import-template.xlsx"',
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('template/category')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Download category import template' })
  @ApiOkResponse({ description: 'Template Excel file downloaded' })
  async downloadCategoryTemplate(@Res() res: Response) {
    const buffer = await this.menuExcelService.generateCategoryTemplate();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="category-import-template.xlsx"',
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }


  @Get('search/lightweight')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  async searchMenusLightweight(
    @Query('restaurantId') restaurantId: string,
    @Query('search') search: string,
    @CurrentUser() user: any,
  ) {
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.menuService.searchLightweight(targetRestaurantId, search);
  }

  @Get('food-court')
  @Public()
  async getMenusByFoodCourt(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
  ) {
    // Get tenantId from middleware (set by TenantMiddleware) or query param (for backward compatibility)
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;

    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required. Provide it via X-Tenant-ID header, subdomain, or tenantId query parameter.');
    }

    return this.menuService.getMenusByFoodCourt(targetTenantId);
  }

  @Get('tenant')
  @Public()
  async getMenusByTenant(
    @Req() req: Request,
    @Query('tenantId') tenantId?: string,
    @Query('restaurantId') restaurantId?: string,
  ) {
    // Get tenantId from middleware (set by TenantMiddleware) or query param (for backward compatibility)
    const targetTenantId = (req['tenant']?.id) || req.headers['x-tenant-id'] as string || tenantId;

    if (!targetTenantId) {
      throw new BadRequestException('Tenant ID is required. Provide it via X-Tenant-ID header, subdomain, or tenantId query parameter.');
    }

    return this.menuService.getMenusByTenant(targetTenantId, restaurantId);
  }

  @Get('items')
  @Public()
  async getMenuItems(
    @Query('restaurantId') restaurantId: string,
    @Query('category') category?: string,
  ) {
    if (!restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }

    // If category is 'all' or not provided, return all items
    // Otherwise, filter by specific category ID
    if (!category || category === 'all') {
      return this.menuService.findByRestaurantId(restaurantId);
    }

    return this.menuService.findByRestaurantAndCategory(restaurantId, category);
  }

  @Get('filter/:restaurantId')
  @Public()
  @ApiOperation({ summary: 'Get filtered and sorted menu items (public endpoint for customer portal)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID (or "all" for all categories)' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by item name or description' })
  @ApiQuery({ name: 'hasDiscount', required: false, type: Boolean, description: 'Filter items with discounts only (true/false)' })
  @ApiQuery({ name: 'isTopSelling', required: false, type: Boolean, description: 'Filter top selling items only (true/false)' })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean, description: 'Filter featured items only (true/false)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'best_match', 'discount_desc'], description: 'Sort order (default: best_match)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({ description: 'Filtered and sorted menu items with pagination' })
  async getFilteredMenus(
    @Param('restaurantId') restaurantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
    @Query('hasDiscount') hasDiscount?: string,
    @Query('isTopSelling') isTopSelling?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('sortBy') sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'best_match' | 'discount_desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.menuService.getMenusWithFilters(restaurantId, {
      categoryId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
      hasDiscount: hasDiscount === 'true' || hasDiscount === '1',
      isTopSelling: isTopSelling === 'true' || isTopSelling === '1',
      isFeatured: isFeatured === 'true' || isFeatured === '1',
      sortBy: sortBy || 'best_match',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('customer-portal/:restaurantId')
  @Public()
  async getMenusForCustomerPortal(@Param('restaurantId') restaurantId: string) {
    return this.menuService.getMenusForCustomerPortal(restaurantId);
  }

  @Get('restaurant/:restaurantId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  @ApiOperation({ summary: 'Get menus by restaurant ID with filtering and pagination' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field (name, price, discount, createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async getMenusByRestaurantId(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Query() filters?: EnhancedPaginationDto | PaginationDto,
  ) {
    // Enforce restaurant access control
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);

    // Check if pagination or enhanced filters are provided
    const hasPagination = filters && ((filters as any).page || (filters as any).limit);
    const hasEnhancedFilters = filters && ((filters as EnhancedPaginationDto).search !== undefined || (filters as EnhancedPaginationDto).sortBy || (filters as EnhancedPaginationDto).sortOrder || (filters as EnhancedPaginationDto).categoryId);

    // If enhanced filters (search, sortBy, sortOrder) are provided, use enhanced endpoint
    if (hasEnhancedFilters) {
      return this.menuService.findAllWithFilters(targetRestaurantId, filters as EnhancedPaginationDto);
    }

    // If pagination is provided (page or limit), use paginated endpoint
    if (hasPagination) {
      return this.menuService.findAll(targetRestaurantId, filters as PaginationDto);
    }

    // If no pagination is provided, return all menus (backward compatibility)
    return this.menuService.findByRestaurantId(targetRestaurantId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  async createMenu(
    @Body() request: CreateMenuDTO,
    @CurrentUser() user: any,
  ) {
    // Enforce restaurant access control for non-admin users
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.restaurantId) {
        throw new ForbiddenException('User does not have an associated restaurant. Cannot create menus.');
      }
      // Non-admin users can only create menus for their own restaurant
      if (request.restaurantId && request.restaurantId !== user.restaurantId) {
        throw new ForbiddenException('You can only create menus for your own restaurant.');
      }
      // Override restaurantId with user's restaurantId
      request.restaurantId = user.restaurantId;
    } else {
      // SUPER_ADMIN must provide restaurantId
      if (!request.restaurantId) {
        throw new BadRequestException('restaurantId is required');
      }
    }
    return this.menuService.createMenu(request, user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  @ApiOperation({ summary: 'Get menus with filtering and pagination' })
  @ApiQuery({ name: 'restaurantId', required: true, description: 'Restaurant identifier' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field (name, price, discount, createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async getMenus(
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Query() filters?: EnhancedPaginationDto | PaginationDto,
  ) {
    // Enforce restaurant access control
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);

    // If any enhanced filter parameters are provided, use the enhanced endpoint
    if (filters && ((filters as EnhancedPaginationDto).search !== undefined || (filters as EnhancedPaginationDto).categoryId || (filters as EnhancedPaginationDto).sortBy || (filters as EnhancedPaginationDto).sortOrder || (filters as EnhancedPaginationDto).page || (filters as EnhancedPaginationDto).limit)) {
      return this.menuService.findAllWithFilters(targetRestaurantId, filters as EnhancedPaginationDto);
    }
    // Otherwise, use the simple endpoint for backward compatibility
    return this.menuService.findAll(targetRestaurantId, filters as PaginationDto);
  }

  @Patch(':id/availability')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  async updateMenuAvailability(
    @Param('id') menuId: string,
    @Body() body: { isAvailable: boolean },
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    // Enforce restaurant access control
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.menuService.updateMenu(menuId, { isAvailable: body.isAvailable }, targetRestaurantId, user.id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF)
  async getMenu(
    @Param('id') menuId: string,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    // Enforce restaurant access control
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    return this.menuService.findOne(menuId, targetRestaurantId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  async updateMenuById(
    @Param('id') menuId: string,
    @Body() req: UpdateMenuDTO,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    // Determine restaurantId from query, body, or user
    const providedRestaurantId = restaurantId || req.restaurantId;

    // Enforce restaurant access control
    const targetRestaurantId = this.getAuthorizedRestaurantId(providedRestaurantId, user);

    // Ensure the menu update request uses the authorized restaurantId
    req.restaurantId = targetRestaurantId;

    return this.menuService.updateMenu(menuId, req, targetRestaurantId, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  async deleteMenu(
    @Param('id') menuId: string,
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    // Enforce restaurant access control
    const targetRestaurantId = this.getAuthorizedRestaurantId(restaurantId, user);
    await this.menuService.deleteMenu(menuId, targetRestaurantId, user.id);
    return { message: 'Menu deleted successfully' };
  }

  // ==================== FEATURED & TOP SELLING ENDPOINTS ====================

  @Get('featured/:restaurantId')
  @Public()
  @ApiOperation({ summary: 'Get featured menu items for a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum items to return (default: 10)' })
  @ApiOkResponse({ description: 'List of featured menu items with badges' })
  async getFeaturedItems(
    @Param('restaurantId') restaurantId: string,
    @Query('limit') limit?: string,
  ) {
    return this.menuService.getFeaturedItems(restaurantId, limit ? parseInt(limit, 10) : 10);
  }

  @Get('top-selling/:restaurantId')
  @Public()
  @ApiOperation({ summary: 'Get top selling menu items based on order history (last 30 days)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum items to return (default: 10)' })
  @ApiOkResponse({ description: 'List of top selling menu items with sales count' })
  async getTopSellingItems(
    @Param('restaurantId') restaurantId: string,
    @Query('limit') limit?: string,
  ) {
    return this.menuService.getTopSellingItems(restaurantId, limit ? parseInt(limit, 10) : 10);
  }

  @Get('showcase/:restaurantId')
  @Public()
  @ApiOperation({ summary: 'Get showcase/featured categories with their items' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'List of showcase categories with their menu items' })
  async getShowcaseCategories(@Param('restaurantId') restaurantId: string) {
    return this.menuService.getShowcaseCategories(restaurantId);
  }

  @Get('enhanced/:restaurantId')
  @Public()
  @ApiOperation({ summary: 'Get enhanced menu for customer portal with featured items, top selling, and showcase categories' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant identifier', format: 'uuid' })
  @ApiOkResponse({ description: 'Complete menu with special sections (featured, top selling, showcase)' })
  async getEnhancedMenu(@Param('restaurantId') restaurantId: string) {
    return this.menuService.getEnhancedMenuForCustomerPortal(restaurantId);
  }

  @Patch(':id/featured')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update menu item featured status and badges' })
  @ApiParam({ name: 'id', description: 'Menu item identifier', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isFeatured: { type: 'boolean', description: 'Mark item as featured' },
        featuredOrder: { type: 'number', description: 'Display order for featured items (lower = higher priority)' },
        badges: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of badges: new, bestseller, chef_special, spicy, vegetarian, vegan, gluten_free, popular, limited'
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Updated menu item' })
  async updateMenuFeaturedStatus(
    @Param('id') menuId: string,
    @Body() body: { isFeatured?: boolean; featuredOrder?: number; badges?: string[] },
  ) {
    return this.menuService.updateMenuFeaturedStatus(menuId, body);
  }

  @Patch('category/:id/showcase')
  @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update category showcase status' })
  @ApiParam({ name: 'id', description: 'Category identifier', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isShowcase: { type: 'boolean', description: 'Mark category as showcase/featured' },
        displayOrder: { type: 'number', description: 'Display order for categories (lower = higher priority)' },
        isActive: { type: 'boolean', description: 'Whether category is visible to customers' },
      },
    },
  })
  @ApiOkResponse({ description: 'Updated category' })
  async updateCategoryShowcaseStatus(
    @Param('id') categoryId: string,
    @Body() body: { isShowcase?: boolean; displayOrder?: number; isActive?: boolean },
  ) {
    return this.menuService.updateCategoryShowcaseStatus(categoryId, body);
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
      throw new ForbiddenException('User does not have an associated restaurant. Cannot access menus.');
    }

    // If user tries to access a different restaurant, deny access
    if (restaurantId && restaurantId !== user.restaurantId) {
      throw new ForbiddenException('You can only access menus for your own restaurant.');
    }

    // Use the user's restaurantId (ignore query param for non-admin users)
    return user.restaurantId;
  }

}
