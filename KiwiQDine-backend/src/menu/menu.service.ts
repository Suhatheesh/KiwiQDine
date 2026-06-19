import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Menu, Restaurant, Category, Tenant, TenantType, OrderItem, OrderAction } from '../infrastructure/database/entities';
import { OrderActivityLogService } from '../order-status/order-activity-log.service';
import { BadgeService } from '../badge/badge.service';
import { PaginationDto, PaginationResponse } from '../shared/dto/pagination.dto';
import { EnhancedPaginationDto } from '../shared/dto/enhanced-pagination.dto';
import { CreateMenuDTO } from './create-menu.schema';
import { UpdateMenuDTO } from './update-menu.schema';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private readonly orderActivityLogService: OrderActivityLogService,
    private readonly badgeService: BadgeService,
  ) { }

  async createMenu(createMenuDto: CreateMenuDTO, userId?: string): Promise<Menu> {
    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: createMenuDto.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Validate category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createMenuDto.categoryId, restaurantId: createMenuDto.restaurantId },
    });
    if (!category) {
      throw new NotFoundException('Category not found for this restaurant');
    }

    // Check if menu with same name already exists
    const existingMenu = await this.menuRepository.findOne({
      where: { name: createMenuDto.name, restaurantId: createMenuDto.restaurantId },
    });
    if (existingMenu) {
      throw new ConflictException('Menu item with this name already exists in this restaurant');
    }

    // Normalize variant options: map priceModifier to price if needed
    const normalizedVariantOptions = createMenuDto.variantOptions?.map(option => ({
      ...option,
      options: option.options.map(item => ({
        ...item,
        price: item.price ?? item.priceModifier ?? 0,
      })),
    }));

    // Create menu - map both old (imageUrl, basePrice) and new (image, price) field names for compatibility
    const menu = this.menuRepository.create({
      restaurantId: createMenuDto.restaurantId,
      categoryId: createMenuDto.categoryId,
      name: createMenuDto.name,
      description: createMenuDto.description || null,
      note: createMenuDto.note || null,
      price: createMenuDto.price || createMenuDto.basePrice,
      image: createMenuDto.image || createMenuDto.imageUrl || null,
      discount: createMenuDto.discount || 0,
      quantityAvailable: createMenuDto.quantityAvailable || null,
      preparationTime: createMenuDto.preparationTime || null,
      variantOptions: normalizedVariantOptions || null,
      isAvailable: createMenuDto.isAvailable ?? true,
      availableFrom: createMenuDto.availableFrom || null,
      availableTo: createMenuDto.availableTo || null,
    });

    const savedMenu = await this.menuRepository.save(menu);

    // Audit Log
    await this.orderActivityLogService.logAction(null, OrderAction.MENU_MODIFIED, userId, `Created new menu item: ${savedMenu.name}`, null, {
      restaurantId: savedMenu.restaurantId,
      entityId: savedMenu.id,
    });

    return this.menuRepository.findOne({
      where: { id: savedMenu.id },
      relations: ['restaurant', 'category', 'menuAddons', 'menuAddons.addon'],
    });
  }

  async findAll(restaurantId: string, pagination: PaginationDto = { page: 1, limit: 10 }): Promise<PaginationResponse<Menu>> {
    if (!restaurantId) {
      throw new BadRequestException('Restaurant ID is required');
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { restaurantId };

    const [data, total] = await this.menuRepository.findAndCount({
      where,
      relations: ['restaurant', 'category', 'menuAddons', 'menuAddons.addon'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Enhance with badge details
    const activeBadges = await this.badgeService.findActive(restaurantId);
    const enhancedData = data.map(menu => this.formatMenuItemWithBadges(menu, activeBadges));

    return {
      data: enhancedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllWithFilters(restaurantId: string, filters: EnhancedPaginationDto = {}): Promise<PaginationResponse<Menu>> {
    if (!restaurantId) {
      throw new BadRequestException('Restaurant ID is required');
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build query builder
    const queryBuilder = this.menuRepository.createQueryBuilder('menu')
      .leftJoinAndSelect('menu.restaurant', 'restaurant')
      .leftJoinAndSelect('menu.category', 'category')
      .leftJoinAndSelect('menu.menuAddons', 'menuAddons')
      .leftJoinAndSelect('menuAddons.addon', 'addon');

    // Apply restaurant filter - always required
    queryBuilder.andWhere('menu.restaurantId = :restaurantId', { restaurantId });

    // Apply search - search in name, description
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      queryBuilder.andWhere(
        '(menu.name ILIKE :search OR menu.description ILIKE :search)',
        { search: searchTerm }
      );
    }

    // Apply category filter if provided
    if (filters.categoryId && filters.categoryId !== 'all') {
      queryBuilder.andWhere('menu.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.isAvailable !== undefined) {
      const normalizedAvailability =
        typeof filters.isAvailable === 'string'
          ? filters.isAvailable.toLowerCase() === 'true'
          : Boolean(filters.isAvailable);
      queryBuilder.andWhere('menu.isAvailable = :isAvailable', { isAvailable: normalizedAvailability });
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    const allowedSortFields = ['name', 'price', 'discount', 'createdAt', 'updatedAt'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`menu.${finalSortBy}`, sortOrder as 'ASC' | 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const data = await queryBuilder.getMany();

    // Enhance with badge details
    const activeBadges = await this.badgeService.findActive(restaurantId);
    const enhancedData = data.map(menu => this.formatMenuItemWithBadges(menu, activeBadges));

    return {
      data: enhancedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, restaurantId?: string): Promise<Menu> {
    const where: any = { id };
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const menu = await this.menuRepository.findOne({
      where,
      relations: ['restaurant', 'category', 'menuAddons', 'menuAddons.addon'],
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    const activeBadges = await this.badgeService.findActive(menu.restaurantId);
    return this.formatMenuItemWithBadges(menu, activeBadges);
  }

  async findByRestaurantId(restaurantId: string): Promise<Menu[]> {
    const menus = await this.menuRepository.find({
      where: { restaurantId },
      relations: ['restaurant', 'category', 'menuAddons', 'menuAddons.addon'],
      order: { createdAt: 'DESC' },
    });

    const activeBadges = await this.badgeService.findActive(restaurantId);
    return menus.map(menu => this.formatMenuItemWithBadges(menu, activeBadges));
  }

  async findByRestaurantAndCategory(restaurantId: string, categoryId: string): Promise<Menu[]> {
    this.logger.log(`Fetching menus for restaurant ${restaurantId} and category ${categoryId}`);

    const menus = await this.menuRepository.find({
      where: {
        restaurantId,
        categoryId,
      },
      relations: ['restaurant', 'category', 'menuAddons', 'menuAddons.addon'],
      order: { createdAt: 'DESC' },
    });

    const activeBadges = await this.badgeService.findActive(restaurantId);
    const formattedMenus = menus.map(menu => this.formatMenuItemWithBadges(menu, activeBadges));

    this.logger.log(`Found ${formattedMenus.length} menu items for category ${categoryId}`);
    return formattedMenus;
  }

  async updateMenu(id: string, updateMenuDto: UpdateMenuDTO, restaurantId?: string, userId?: string): Promise<Menu> {
    // If restaurantId is provided, validate the menu belongs to that restaurant
    const menu = await this.findOne(id, restaurantId || updateMenuDto.restaurantId);

    // If updating restaurant, validate it exists
    if (updateMenuDto.restaurantId && updateMenuDto.restaurantId !== menu.restaurantId) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: updateMenuDto.restaurantId },
      });
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }
    }

    // Validate category if categoryId is being updated
    if (updateMenuDto.categoryId && updateMenuDto.categoryId !== menu.categoryId) {
      const targetRestaurantId = updateMenuDto.restaurantId || menu.restaurantId;
      const category = await this.categoryRepository.findOne({
        where: { id: updateMenuDto.categoryId, restaurantId: targetRestaurantId },
      });
      if (!category) {
        throw new BadRequestException('Category does not belong to the specified restaurant');
      }
      // Explicitly handle categoryId - this is critical for category updates
      menu.categoryId = updateMenuDto.categoryId;
      menu.category = category;
    }

    // If restaurant is being changed, validate the category still belongs to the new restaurant
    if (updateMenuDto.restaurantId && updateMenuDto.restaurantId !== menu.restaurantId) {
      const targetCategoryId = updateMenuDto.categoryId || menu.categoryId;
      const category = await this.categoryRepository.findOne({
        where: { id: targetCategoryId, restaurantId: updateMenuDto.restaurantId },
      });
      if (!category) {
        throw new BadRequestException('Category does not belong to the specified restaurant');
      }
    }

    // Check for name conflict if updating name
    if (updateMenuDto.name && updateMenuDto.name !== menu.name) {
      const existingMenu = await this.menuRepository.findOne({
        where: { name: updateMenuDto.name, restaurantId: menu.restaurantId },
      });
      if (existingMenu && existingMenu.id !== id) {
        throw new ConflictException('Menu item with this name already exists in this restaurant');
      }
    }

    // Update menu fields - only update fields that are provided
    if (updateMenuDto.name !== undefined) {
      menu.name = updateMenuDto.name;
    }
    if (updateMenuDto.description !== undefined) {
      menu.description = updateMenuDto.description;
    }
    if (updateMenuDto.note !== undefined) {
      menu.note = updateMenuDto.note;
    }
    if (updateMenuDto.price !== undefined) {
      menu.price = updateMenuDto.price;
    }
    if (updateMenuDto.image !== undefined) {
      menu.image = updateMenuDto.image;
    }
    if (updateMenuDto.discount !== undefined) {
      menu.discount = updateMenuDto.discount;
    }
    if (updateMenuDto.quantityAvailable !== undefined) {
      menu.quantityAvailable = updateMenuDto.quantityAvailable;
    }
    if (updateMenuDto.preparationTime !== undefined) {
      menu.preparationTime = updateMenuDto.preparationTime;
    }
    if (updateMenuDto.isAvailable !== undefined) {
      menu.isAvailable = updateMenuDto.isAvailable;
    }
    if (updateMenuDto.availableFrom !== undefined) {
      menu.availableFrom = updateMenuDto.availableFrom;
    }
    if (updateMenuDto.availableTo !== undefined) {
      menu.availableTo = updateMenuDto.availableTo;
    }
    if (updateMenuDto.variantOptions !== undefined) {
      // Normalize variant options: ensure price is set (map priceModifier to price if needed)
      const normalizedVariantOptions = updateMenuDto.variantOptions.map(option => ({
        ...option,
        options: option.options.map(item => ({
          ...item,
          price: item.price ?? item.priceModifier ?? 0,
        })),
      }));
      menu.variantOptions = normalizedVariantOptions;
    }

    // Handle restaurantId change if provided
    if (updateMenuDto.restaurantId !== undefined && updateMenuDto.restaurantId !== menu.restaurantId) {
      menu.restaurantId = updateMenuDto.restaurantId;
    }

    await this.menuRepository.save(menu);

    // Audit Log
    await this.orderActivityLogService.logAction(null, OrderAction.MENU_MODIFIED, userId, `Updated menu item: ${menu.name}`, null, {
      restaurantId: menu.restaurantId,
      entityId: menu.id,
    });

    // Reload menu with relations to include category and restaurant
    // Use the original ID to avoid any stale data issues
    const refreshedMenu = await this.menuRepository.findOne({
      where: { id },
      relations: ['restaurant', 'category', 'menuAddons', 'menuAddons.addon'],
    });

    if (!refreshedMenu) {
      throw new NotFoundException('Menu not found after update');
    }

    return refreshedMenu;
  }

  async deleteMenu(id: string, restaurantId?: string, userId?: string): Promise<void> {
    const menu = await this.findOne(id, restaurantId);

    // Check if there are any order items referencing this menu
    const orderItemsCount = await this.orderItemRepository.count({
      where: { menuId: id },
    });

    if (orderItemsCount > 0) {
      throw new BadRequestException(
        `Cannot delete menu item "${menu.name}" because it is associated with ${orderItemsCount} order item(s). Please remove or update the orders first.`
      );
    }

    try {
      const menuName = menu.name;
      const resId = menu.restaurantId;
      await this.menuRepository.remove(menu);

      // Audit Log
      await this.orderActivityLogService.logAction(null, OrderAction.MENU_MODIFIED, userId, `Deleted menu item: ${menuName}`, null, {
        restaurantId: resId,
        entityId: id,
      });
    } catch (error) {
      // Handle any other database constraint errors
      if (error.code === '23503') { // PostgreSQL foreign key violation
        throw new BadRequestException(
          `Cannot delete menu item "${menu.name}" because it is referenced by other records. Please remove all references first.`
        );
      }
      throw error;
    }
  }

  /**
   * Get all menus for a food court tenant
   * Returns all restaurants and their menus under the food court tenant
   */
  async getMenusByFoodCourt(tenantId: string): Promise<Array<{ restaurant: Restaurant; menus: Menu[] }>> {
    // Validate tenant exists and is a food court
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.type !== TenantType.FOOD_COURT) {
      throw new BadRequestException('This endpoint is only available for food court tenants');
    }

    // Get all restaurants under this tenant
    const restaurants = await this.restaurantRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });

    // Get all menus for each restaurant
    const restaurantsWithMenus = await Promise.all(
      restaurants.map(async (restaurant) => {
        const menus = await this.menuRepository.find({
          where: { restaurantId: restaurant.id },
          relations: ['restaurant', 'category', 'menuAddons', 'menuAddons.addon'],
          order: { createdAt: 'DESC' },
        });

        return {
          restaurant,
          menus,
        };
      }),
    );

    return restaurantsWithMenus;
  }

  /**
   * Get menus based on tenant type
   * - For restaurant tenant: returns menus for the specific restaurant
   * - For food court tenant: returns all restaurants and their menus
   */
  async getMenusByTenant(tenantId: string, restaurantId?: string): Promise<Menu[] | Array<{ restaurant: Restaurant; menus: Menu[] }>> {
    // Get tenant to check type
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // If it's a food court, return all restaurants with menus
    if (tenant.type === TenantType.FOOD_COURT) {
      return this.getMenusByFoodCourt(tenantId);
    }

    // If it's a restaurant tenant, return menus for that specific restaurant only
    if (tenant.type === TenantType.RESTAURANT) {
      // For restaurant tenant, find the restaurant for this tenant
      // Restaurant tenant should have only one restaurant, but we'll handle the case where restaurantId is provided
      const where: any = { tenantId };

      if (restaurantId) {
        // If restaurantId is provided, validate it belongs to this tenant
        where.id = restaurantId;
      }

      const restaurant = await this.restaurantRepository.findOne({
        where,
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found for this tenant');
      }

      // Return menus only for this specific restaurant
      return this.findByRestaurantId(restaurant.id);
    }

    throw new BadRequestException('Invalid tenant type');
  }

  async searchLightweight(restaurantId: string, search?: string): Promise<Array<{ menuItemId: string; menuName: string }>> {
    const query = this.menuRepository
      .createQueryBuilder('menu')
      .select(['menu.id', 'menu.name'])
      .where('menu.restaurantId = :restaurantId', { restaurantId });

    if (search) {
      query.andWhere('menu.name ILIKE :search', { search: `%${search}%` });
    }

    const menus = await query.limit(20).getMany();
    return menus.map(m => ({ menuItemId: m.id, menuName: m.name }));
  }

  /**
   * Optimized endpoint for customer portal
   * Returns all available menu items grouped by category with restaurant details
   */
  async getMenusForCustomerPortal(restaurantId: string) {
    // Fetch restaurant with basic details
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId, isActive: true, status: 'active' },
      select: [
        'id',
        'name',
        'logo',
        'address',
        'contactEmail',
        'contactPhoneNumber',
        'openTime',
        'closeTime',
        'openHours',
        'paymentTiming',
        'primaryColor',
        'secondaryColor',
        'tertiaryColor',
        'serviceChargePercentage',
        'applyServiceCharge',
        'serviceChargeType',
        'fixedServiceCharge',
      ],
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found or inactive');
    }

    // Fetch all available menu items with relations
    const menus = await this.menuRepository.find({
      where: {
        restaurantId,
        isAvailable: true,
        category: { isActive: true },
      },
      relations: ['category', 'menuAddons', 'menuAddons.addon'],
      order: {
        category: { displayOrder: 'ASC' },
        name: 'ASC',
      },
    });

    // Fetch active badges for the restaurant
    const activeBadges = await this.badgeService.findActive(restaurantId);

    // Group menus by category
    const categoriesMap = new Map<string, any>();

    menus.forEach((menu) => {
      const categoryId = menu.category?.id || 'uncategorized';
      const categoryName = menu.category?.name || 'Uncategorized';
      const categoryImage = menu.category?.image || null;
      const categoryDescription = menu.category?.description || null;

      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          image: categoryImage,
          description: categoryDescription,
          displayOrder: menu.category?.displayOrder ?? 0,
          items: [],
        });
      }

      // Transform menu item
      const menuItem = {
        id: menu.id,
        name: menu.name,
        description: menu.description,
        note: menu.note,
        price: menu.price,
        image: menu.image,
        imageKey: menu.imageKey,
        discount: menu.discount,
        preparationTime: menu.preparationTime,
        isAvailable: menu.isAvailable,
        availableFrom: menu.availableFrom,
        availableTo: menu.availableTo,
        variantOptions: menu.variantOptions,
        badges: (menu.badges || []).map(code => {
          const badge = activeBadges.find(b => b.code === code);
          return badge ? {
            id: badge.id,
            name: badge.name,
            code: badge.code,
            icon: badge.icon,
            backgroundColor: badge.backgroundColor,
            textColor: badge.textColor
          } : { code };
        }),
        addons: menu.menuAddons?.map((ma) => ({
          id: ma.addon.id,
          name: ma.addon.name,
          description: ma.addon.description,
          price: Number(ma.addon.price),
          image: ma.addon.image,
          imageKey: ma.addon.imageKey,
          type: ma.addon.type,
          status: ma.addon.status,
          isRequired: ma.addon.isRequired,
          maxSelection: ma.addon.maxSelection,
        })) || [],
      };

      categoriesMap.get(categoryId).items.push(menuItem);
    });

    // Convert map to array and sort by displayOrder
    const categories = Array.from(categoriesMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        logo: restaurant.logo,
        address: restaurant.address,
        contactEmail: restaurant.contactEmail,
        contactPhoneNumber: restaurant.contactPhoneNumber,
        openTime: restaurant.openTime,
        closeTime: restaurant.closeTime,
        openHours: restaurant.openHours,
        paymentTiming: restaurant.paymentTiming,
        colors: {
          primary: restaurant.primaryColor,
          secondary: restaurant.secondaryColor,
          tertiary: restaurant.tertiaryColor,
        },
        serviceCharge: {
          percentage: restaurant.serviceChargePercentage,
          apply: restaurant.applyServiceCharge,
          type: restaurant.serviceChargeType,
          fixedAmount: restaurant.fixedServiceCharge,
        },
      },
      categories,
      totalItems: menus.length,
      totalCategories: categories.length,
    };
  }

  /**
   * Get filtered and sorted menu items for customer portal or restaurant management
   * @param restaurantId Restaurant ID
   * @param filters Filter options (category, priceRange, search, sort)
   * @returns Filtered and sorted menu items
   */
  async getMenusWithFilters(
    restaurantId: string,
    filters: {
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
      hasDiscount?: boolean;
      isTopSelling?: boolean;
      isFeatured?: boolean;
      badges?: string;
      sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'best_match' | 'discount_desc';
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.category', 'category')
      .leftJoinAndSelect('menu.menuAddons', 'menuAddons')
      .leftJoinAndSelect('menuAddons.addon', 'addon')
      .where('menu.restaurantId = :restaurantId', { restaurantId })
      .andWhere('menu.isAvailable = :isAvailable', { isAvailable: true });

    // Category filter
    if (filters.categoryId && filters.categoryId !== 'all') {
      queryBuilder.andWhere('menu.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      queryBuilder.andWhere('menu.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere('menu.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    // Discount filter - only show items with discount > 0
    if (filters.hasDiscount === true) {
      queryBuilder.andWhere('menu.discount > :minDiscount', { minDiscount: 0 });
    }

    // Featured filter
    if (filters.isFeatured === true) {
      queryBuilder.andWhere('menu.isFeatured = :isFeaturedFilter', { isFeaturedFilter: true });
    }

    // Top selling filter - filter by items that appear in top selling list (last 30 days)
    if (filters.isTopSelling === true) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Subquery to get menu IDs that have been ordered in the last 30 days
      const topSellingSubquery = this.orderItemRepository
        .createQueryBuilder('orderItem')
        .select('orderItem.menuId')
        .innerJoin('orderItem.order', 'order')
        .where('order.restaurantId = :restaurantId')
        .andWhere('order.createdAt >= :thirtyDaysAgo')
        .andWhere('order.status NOT IN (:...excludedStatuses)')
        .groupBy('orderItem.menuId')
        .having('SUM(orderItem.quantity) > 0');

      queryBuilder.andWhere(`menu.id IN (${topSellingSubquery.getQuery()})`)
        .setParameters({
          ...queryBuilder.getParameters(),
          thirtyDaysAgo,
          excludedStatuses: ['cancelled', 'abandoned'],
        });
    }

    // Search filter
    if (filters.search) {
      queryBuilder.andWhere(
        '(menu.name ILIKE :search OR menu.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Badges filter using JSONB containment
    // If multiple badges provided, find items that have ANY of them (OR logic)
    if (filters.badges) {
      const badgeList = filters.badges.split(',').map(b => b.trim()).filter(b => b.length > 0);

      if (badgeList.length > 0) {
        // Use PostgreSQL JSONB operator ?| (exists any)
        // We need to properly quote the array elements for the SQL query
        // TypeORM parameter binding for arrays in raw SQL can be tricky, so we constructed a string literal for the array
        const formattedBadges = badgeList.map(b => `'${b}'`).join(',');
        queryBuilder.andWhere(`menu.badges ?| array[${formattedBadges}]`);
      }
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_asc':
        queryBuilder.orderBy('menu.price', 'ASC');
        break;
      case 'price_desc':
        queryBuilder.orderBy('menu.price', 'DESC');
        break;
      case 'name_asc':
        queryBuilder.orderBy('menu.name', 'ASC');
        break;
      case 'name_desc':
        queryBuilder.orderBy('menu.name', 'DESC');
        break;
      case 'discount_desc':
        // Sort by discount: highest discount first (items with no discount at the end)
        queryBuilder.orderBy('menu.discount', 'DESC');
        break;
      case 'best_match':
      default:
        // Best match: prioritize items with search term in name, then by category, then by name
        if (filters.search) {
          queryBuilder.orderBy('menu.name', 'ASC');
        } else {
          queryBuilder.orderBy('category.name', 'ASC').addOrderBy('menu.name', 'ASC');
        }
        break;
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const menus = await queryBuilder
      .skip(skip)
      .take(limit)
      .getMany();

    // Fetch active badges for the restaurant
    const activeBadges = await this.badgeService.findActive(restaurantId);

    // Transform to include addons and badges
    const items = menus.map((menu) => ({
      id: menu.id,
      name: menu.name,
      description: menu.description,
      note: menu.note,
      price: Number(menu.price),
      image: menu.image,
      imageKey: menu.imageKey,
      discount: Number(menu.discount),
      preparationTime: menu.preparationTime,
      isAvailable: menu.isAvailable,
      availableFrom: menu.availableFrom,
      availableTo: menu.availableTo,
      variantOptions: menu.variantOptions,
      badges: (menu.badges || []).map(code => {
        const badge = activeBadges.find(b => b.code === code);
        return badge ? {
          id: badge.id,
          name: badge.name,
          code: badge.code,
          icon: badge.icon,
          backgroundColor: badge.backgroundColor,
          textColor: badge.textColor
        } : { code };
      }),
      category: {
        id: menu.category?.id,
        name: menu.category?.name,
        image: menu.category?.image,
        code: menu.category?.code,
      },
      addons: menu.menuAddons?.map((ma) => ({
        id: ma.addon.id,
        name: ma.addon.name,
        description: ma.addon.description,
        price: Number(ma.addon.price),
        image: ma.addon.image,
        imageKey: ma.addon.imageKey,
        type: ma.addon.type,
        status: ma.addon.status,
        isRequired: ma.addon.isRequired,
        maxSelection: ma.addon.maxSelection,
      })) || [],
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        categoryId: filters.categoryId,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        search: filters.search,
        hasDiscount: filters.hasDiscount,
        isTopSelling: filters.isTopSelling,
        isFeatured: filters.isFeatured,
        sortBy: filters.sortBy || 'best_match',
      },
    };
  }

  /**
   * Get featured menu items for a restaurant
   * Returns items marked as featured by the manager
   */
  async getFeaturedItems(restaurantId: string, limit: number = 10): Promise<any[]> {
    const menus = await this.menuRepository.find({
      where: {
        restaurantId,
        isAvailable: true,
        isFeatured: true,
      },
      relations: ['category', 'menuAddons', 'menuAddons.addon'],
      order: {
        featuredOrder: 'ASC',
        name: 'ASC',
      },
      take: limit,
    });

    const activeBadges = await this.badgeService.findActive(restaurantId);
    return menus.map((menu) => this.formatMenuItemWithBadges(menu, activeBadges));
  }

  /**
   * Get top selling items for a restaurant
   * Calculates based on order history (last 30 days)
   */
  async getTopSellingItems(restaurantId: string, limit: number = 10): Promise<any[]> {
    // Calculate top selling items based on order count in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topSellingQuery = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('orderItem.menuId', 'menuId')
      .addSelect('SUM(orderItem.quantity)', 'totalSold')
      .innerJoin('orderItem.order', 'order')
      .innerJoin('orderItem.menu', 'menu')
      .where('order.restaurantId = :restaurantId', { restaurantId })
      .andWhere('order.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('order.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'abandoned'],
      })
      .groupBy('orderItem.menuId')
      .orderBy('"totalSold"', 'DESC')
      .limit(limit)
      .getRawMany();

    this.logger.log(`Top selling raw query found ${topSellingQuery.length} items for restaurant ${restaurantId}`);

    if (topSellingQuery.length === 0) {
      return [];
    }

    const menuIds = topSellingQuery.map((item) => item.menuId);
    const salesMap = new Map(topSellingQuery.map((item) => [item.menuId, parseInt(item.totalSold)]));

    // Fetch menu details for top selling items
    const menus = await this.menuRepository.find({
      where: {
        id: In(menuIds),
        isAvailable: true,
      },
      relations: ['category', 'menuAddons', 'menuAddons.addon'],
    });

    const activeBadges = await this.badgeService.findActive(restaurantId);
    const badgeMap = new Map(activeBadges.map((b) => [b.code, b]));
    const bestsellerBadge = badgeMap.get('bestseller');

    // Sort by sales count and add bestseller badge
    return menus
      .sort((a, b) => (salesMap.get(b.id) || 0) - (salesMap.get(a.id) || 0))
      .map((menu) => {
        const formatted = this.formatMenuItemWithBadges(menu, activeBadges);
        // Add bestseller badge object if not already present
        if (bestsellerBadge && !formatted.badges.some((b: any) => b.code === 'bestseller')) {
          formatted.badges.push({
            id: bestsellerBadge.id,
            name: bestsellerBadge.name,
            code: bestsellerBadge.code,
            icon: bestsellerBadge.icon,
            backgroundColor: bestsellerBadge.backgroundColor,
            textColor: bestsellerBadge.textColor,
          });
        }
        return {
          ...formatted,
          totalSold: salesMap.get(menu.id) || 0,
        };
      });
  }

  /**
   * Get showcase/default categories for a restaurant
   * Returns categories marked as showcase with their featured items
   */
  async getShowcaseCategories(restaurantId: string): Promise<any[]> {
    const categories = await this.categoryRepository.find({
      where: {
        restaurantId,
        isShowcase: true,
        isActive: true,
      },
      order: {
        displayOrder: 'ASC',
        name: 'ASC',
      },
    });

    const activeBadges = await this.badgeService.findActive(restaurantId);
    const result = [];

    for (const category of categories) {
      const menus = await this.menuRepository.find({
        where: {
          categoryId: category.id,
          isAvailable: true,
        },
        relations: ['menuAddons', 'menuAddons.addon'],
        order: {
          isFeatured: 'DESC',
          featuredOrder: 'ASC',
          name: 'ASC',
        },
        take: 10, // Limit items per showcase category
      });

      result.push({
        id: category.id,
        name: category.name,
        code: category.code,
        description: category.description,
        image: category.image,
        isShowcase: category.isShowcase,
        displayOrder: category.displayOrder,
        items: menus.map((menu) => this.formatMenuItemWithBadges(menu, activeBadges)),
      });
    }

    return result;
  }

  /**
   * Get customer portal menu with featured items, top selling, and showcase categories
   * Enhanced version with badges and special sections
   */
  async getEnhancedMenuForCustomerPortal(restaurantId: string) {
    // Get base menu data
    const baseMenu = await this.getMenusForCustomerPortal(restaurantId);

    // Get featured items
    const featuredItems = await this.getFeaturedItems(restaurantId, 10);

    // Get top selling items
    const topSellingItems = await this.getTopSellingItems(restaurantId, 10);

    // Get showcase categories
    const showcaseCategories = await this.getShowcaseCategories(restaurantId);

    // Enhance categories with badges
    const enhancedCategories = baseMenu.categories.map((category: any) => ({
      ...category,
      isShowcase: showcaseCategories.some((sc) => sc.id === category.id),
      items: category.items.map((item: any) => {
        const badges = [];

        // Check if item is in top selling
        const topSellingItem = topSellingItems.find((ts) => ts.id === item.id);
        if (topSellingItem) {
          badges.push('bestseller');
        }

        // Check if item is featured
        const featuredItem = featuredItems.find((fi) => fi.id === item.id);
        if (featuredItem) {
          badges.push('featured');
        }

        return {
          ...item,
          badges: badges.length > 0 ? badges : (item.badges || []),
        };
      }),
    }));

    return {
      ...baseMenu,
      categories: enhancedCategories,
      specialSections: {
        featured: {
          title: 'Featured Items',
          description: 'Handpicked by our chef',
          items: featuredItems,
        },
        topSelling: {
          title: 'Top Selling',
          description: 'Customer favorites',
          items: topSellingItems,
        },
        showcase: {
          title: 'Showcase Categories',
          categories: showcaseCategories,
        },
      },
    };
  }

  /**
   * Update menu item featured status and badges (for restaurant manager)
   */
  async updateMenuFeaturedStatus(
    menuId: string,
    updates: {
      isFeatured?: boolean;
      featuredOrder?: number;
      badges?: string[];
    }
  ): Promise<Menu> {
    const menu = await this.menuRepository.findOne({ where: { id: menuId } });
    if (!menu) {
      throw new NotFoundException('Menu item not found');
    }

    if (updates.isFeatured !== undefined) {
      menu.isFeatured = updates.isFeatured;
    }
    if (updates.featuredOrder !== undefined) {
      menu.featuredOrder = updates.featuredOrder;
    }
    if (updates.badges !== undefined) {
      // Validate badges against restaurant's custom badges
      const validBadges = await this.badgeService.validateBadgeCodes(updates.badges, menu.restaurantId);
      const invalidBadges = updates.badges.filter((b) => !validBadges.includes(b));
      if (invalidBadges.length > 0) {
        const activeBadges = await this.badgeService.findActive(menu.restaurantId);
        const validCodes = activeBadges.map((b) => b.code).join(', ');
        throw new BadRequestException(`Invalid badges: ${invalidBadges.join(', ')}. Valid badges are: ${validCodes}`);
      }
      menu.badges = updates.badges;
    }

    const savedMenu = await this.menuRepository.save(menu);

    // Reload with relations and format with badge objects
    const menuWithRelations = await this.menuRepository.findOne({
      where: { id: savedMenu.id },
      relations: ['restaurant', 'category', 'menuAddons', 'menuAddons.addon'],
    });

    const activeBadges = await this.badgeService.findActive(menu.restaurantId);
    return this.formatMenuItemWithBadges(menuWithRelations, activeBadges);
  }

  /**
   * Update category showcase status (for restaurant manager)
   */
  async updateCategoryShowcaseStatus(
    categoryId: string,
    updates: {
      isShowcase?: boolean;
      displayOrder?: number;
      isActive?: boolean;
    }
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (updates.isShowcase !== undefined) {
      category.isShowcase = updates.isShowcase;
    }
    if (updates.displayOrder !== undefined) {
      category.displayOrder = updates.displayOrder;
    }
    if (updates.isActive !== undefined) {
      category.isActive = updates.isActive;
    }

    return this.categoryRepository.save(category);
  }

  /**
   * Helper method to format menu item with badges
   */
  private formatMenuItemWithBadges(menu: Menu, activeBadges: any[] = []): any {
    const badgeMap = new Map(activeBadges.map((b) => [b.code, b]));

    // Map badge codes to full badge objects if available
    const badgeObjects = (menu.badges || []).map((code) => {
      const badge = badgeMap.get(code);
      if (badge) {
        return {
          id: badge.id,
          name: badge.name,
          code: badge.code,
          icon: badge.icon,
          backgroundColor: badge.backgroundColor,
          textColor: badge.textColor,
        };
      }
      return { code }; // Fallback to just code if badge not found in active list
    });

    return {
      id: menu.id,
      name: menu.name,
      description: menu.description,
      note: menu.note,
      price: Number(menu.price),
      image: menu.image,
      imageKey: menu.imageKey,
      discount: Number(menu.discount),
      quantityAvailable: menu.quantityAvailable,
      isAvailable: menu.isAvailable,
      isFeatured: menu.isFeatured,
      featuredOrder: menu.featuredOrder,
      badges: badgeObjects,
      preparationTime: menu.preparationTime,
      availableFrom: menu.availableFrom,
      availableTo: menu.availableTo,
      variantOptions: menu.variantOptions,
      category: menu.category ? {
        id: menu.category.id,
        name: menu.category.name,
        image: menu.category.image,
        code: menu.category.code,
      } : null,
      restaurant: menu.restaurant ? {
        id: menu.restaurant.id,
        name: menu.restaurant.name,
        logo: menu.restaurant.logo,
      } : null,
      addons: menu.menuAddons?.map((ma) => ({
        id: ma.addon.id,
        name: ma.addon.name,
        description: ma.addon.description,
        price: Number(ma.addon.price),
        image: ma.addon.image,
        type: ma.addon.type,
        isRequired: ma.addon.isRequired,
        maxSelection: ma.addon.maxSelection,
      })) || [],
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
    };
  }
}
