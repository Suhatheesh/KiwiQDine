import { ICategoryResponseDTO } from './category-response.dto';
import { CategoryParser } from './category.parser';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Context } from '../infrastructure';
import { TYPES } from './../application/constants/types';
import { Audit } from './../domain/audit/audit';
import { Result } from './../domain/result/result';
import { IContextService } from './../infrastructure/context/context-service.interface';
import { CategoryRepository } from './../infrastructure/data_access/repositories/category.repository';
import { throwApplicationError } from './../infrastructure/utilities/exception-instance';
import { ISingleClientService } from './../singleclient/interface/singleclient-service.interface';
import { Category } from './category';
import { ICategoryService } from './category-service.interface';
import { CategoryMapper } from './category.mapper';
import { CreateCategoryDTO } from './create-category.dto';
import { UpdateCategoryDTO } from './update-category.dto';
import { Restaurant, Menu } from '../infrastructure/database/entities';


@Injectable()
export class CategoryService implements ICategoryService {
  constructor(
    @Inject(TYPES.IContextService) private readonly contextService: IContextService,
    @Inject(TYPES.ISingleClientService) private readonly singleclientService: ISingleClientService,
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryMapper: CategoryMapper,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) { }
  async createCategory(props: CreateCategoryDTO): Promise<Result<ICategoryResponseDTO>> {
    const { name, restaurantId } = props;
    await this.ensureRestaurantExists(restaurantId);
    const code = name.toUpperCase();
    const existingItem = await this.categoryRepository.findOne({ where: { name, restaurantId } });
    if (existingItem.isSuccess) {
      throwApplicationError(HttpStatus.BAD_REQUEST, `Item ${name} already exists`);
    }
    const context: Context = this.contextService.getContext();
    const audit: Audit = Audit.createInsertContext(context);

    // Automatically set displayOrder if not provided
    if (props.displayOrder === undefined || props.displayOrder === null) {
      const typeOrmRepository = (this.categoryRepository as any).repository;
      const maxOrderResult = await typeOrmRepository
        .createQueryBuilder('category')
        .select('MAX(category.displayOrder)', 'max')
        .where('category.restaurantId = :restaurantId', { restaurantId })
        .getRawOne();

      const maxOrder = maxOrderResult?.max || 0;
      props.displayOrder = maxOrder + 1;
    }

    const category: Category = Category.create({ ...props, audit, code }).getValue();
    const categoryModel = this.categoryMapper.toPersistence(category);
    const result: Result<Category> = await this.categoryRepository.create(categoryModel);
    if (!result.isSuccess) {
      throwApplicationError(HttpStatus.SERVICE_UNAVAILABLE, 'Error while creating item, please try again later');
    }
    const response = CategoryParser.createCategoryResponse(result.getValue(), 0);
    return Result.ok(response);
  }

  async getCategories(restaurantId: string): Promise<Result<ICategoryResponseDTO[]>> {
    if (!restaurantId) {
      throwApplicationError(HttpStatus.BAD_REQUEST, 'Restaurant identifier is required');
    }
    // Ensure restaurant exists and filter categories strictly by restaurantId
    await this.ensureRestaurantExists(restaurantId);
    const result: Result<Category[]> = await this.categoryRepository.find({
      where: { restaurantId },
      order: { displayOrder: 'ASC' }
    });
    if (!result.isSuccess) {
      throwApplicationError(HttpStatus.SERVICE_UNAVAILABLE, 'Error while retrieving categories');
    }
    const categories = result.getValue();
    const categoryIds = categories.map(c => c.id);

    let itemCounts: Record<string, number> = {};
    if (categoryIds.length > 0) {
      const counts = await this.menuRepository
        .createQueryBuilder('menu')
        .select('menu.categoryId', 'categoryId')
        .addSelect('COUNT(menu.id)', 'count')
        .where('menu.categoryId IN (:...categoryIds)', { categoryIds })
        .groupBy('menu.categoryId')
        .getRawMany();

      counts.forEach(c => {
        itemCounts[c.categoryId] = parseInt(c.count);
      });
    }

    const response: ICategoryResponseDTO[] = CategoryParser.createCategoriesResponse(categories, itemCounts);
    return Result.ok(response);
  }

  async getCategoryById(id: string, restaurantId: string): Promise<Result<ICategoryResponseDTO>> {
    if (!restaurantId) {
      throwApplicationError(HttpStatus.BAD_REQUEST, 'Restaurant identifier is required');
    }
    const result: Result<Category | null> = await this.categoryRepository.findOne({ where: { id, restaurantId } });
    if (!result.isSuccess || !result.getValue()) {
      throwApplicationError(HttpStatus.NOT_FOUND, 'Category not found for this restaurant');
    }
    const category = result.getValue()!;
    const itemCount = await this.menuRepository.count({ where: { categoryId: id } });
    const response: ICategoryResponseDTO = CategoryParser.createCategoryResponse(category, itemCount);
    return Result.ok(response);
  }

  async updateCategory(id: string, props: UpdateCategoryDTO, restaurantId: string): Promise<Result<ICategoryResponseDTO>> {
    if (!restaurantId) {
      throwApplicationError(HttpStatus.BAD_REQUEST, 'Restaurant identifier is required');
    }

    // Ensure restaurant exists
    await this.ensureRestaurantExists(restaurantId);

    // Find the category
    const categoryResult: Result<Category | null> = await this.categoryRepository.findOne({ where: { id, restaurantId } });
    if (!categoryResult.isSuccess || !categoryResult.getValue()) {
      throwApplicationError(HttpStatus.NOT_FOUND, 'Category not found for this restaurant');
    }

    const category = categoryResult.getValue();

    // Check if name is being updated and if it conflicts with existing category
    if (props.name && props.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({ where: { name: props.name, restaurantId } });
      if (existingCategory.isSuccess && existingCategory.getValue() && existingCategory.getValue().id !== id) {
        throwApplicationError(HttpStatus.BAD_REQUEST, `Category with name ${props.name} already exists`);
      }
    }

    // Update category properties
    if (props.name !== undefined) {
      category.name = props.name;
      // Update code if name changes
      category.code = props.name.toUpperCase();
    }
    if (props.description !== undefined) {
      category.description = props.description;
    }
    if (props.image !== undefined) {
      category.image = props.image;
    }
    if (props.imageKey !== undefined) {
      category.imageKey = props.imageKey;
    }
    if (props.displayOrder !== undefined) {
      category.displayOrder = props.displayOrder;
    }
    if (props.isShowcase !== undefined) {
      category.isShowcase = props.isShowcase;
    }
    if (props.isActive !== undefined) {
      category.isActive = props.isActive;
    }

    // Update audit context
    const context: Context = this.contextService.getContext();
    const updatedAudit = Audit.updateContext(context.email, category);
    category.audit = Audit.create(updatedAudit).getValue();

    // Save updated category
    const categoryModel = this.categoryMapper.toPersistence(category);
    const updateResult = await this.categoryRepository.findOneAndUpdate(
      { id, restaurantId },
      categoryModel
    );

    if (!updateResult.isSuccess) {
      throwApplicationError(HttpStatus.SERVICE_UNAVAILABLE, 'Error while updating category, please try again later');
    }

    const itemCount = await this.menuRepository.count({ where: { categoryId: id } });
    const response: ICategoryResponseDTO = CategoryParser.createCategoryResponse(updateResult.getValue(), itemCount);
    return Result.ok(response);
  }

  protected async bulkDelete(ids: string[], restaurantId: string): Promise<Result<boolean>> {
    // Note: User validation is already handled by JWT authentication guards
    // validateContext() is not needed here as it checks singleclient repository
    // which may not contain regular users

    // Validate input
    if (!ids || ids.length === 0) {
      throwApplicationError(HttpStatus.BAD_REQUEST, 'Category IDs are required for deletion');
    }

    // Validate that all categories belong to the restaurant before deleting
    const categories = await this.categoryRepository.find({ where: { id: In(ids), restaurantId } });
    if (!categories.isSuccess || categories.getValue().length === 0) {
      throwApplicationError(HttpStatus.NOT_FOUND, 'No categories found to delete for this restaurant');
    }

    // Check if all requested IDs were found (prevent partial deletes)
    const foundIds = categories.getValue().map(cat => cat.id);
    const missingIds = ids.filter(id => !foundIds.includes(id));
    if (missingIds.length > 0) {
      throwApplicationError(HttpStatus.BAD_REQUEST, `Some categories not found or don't belong to this restaurant: ${missingIds.join(', ')}`);
    }

    // Check if any menus are using these categories before deleting
    // Filter by both categoryId and restaurantId to ensure we only check menus from this restaurant
    const menusWithCategories = await this.menuRepository.find({
      where: {
        categoryId: In(ids),
        restaurantId: restaurantId,
      },
    });
    if (menusWithCategories && menusWithCategories.length > 0) {
      const categoryList = categories.getValue();
      const usedCategoryIds = new Set<string>(menusWithCategories.map((menu: Menu) => menu.categoryId));
      const categoryNames = categoryList
        .filter((cat: Category) => usedCategoryIds.has(cat.id))
        .map((cat: Category) => cat.name)
        .join(', ');
      throwApplicationError(
        HttpStatus.BAD_REQUEST,
        `Cannot delete categories that are being used by menu items. Categories in use: ${categoryNames}. Please update or remove the menu items first.`
      );
    }

    // Delete using the repository's deleteMany method
    // Access the protected repository property to use TypeORM's delete with In operator
    const typeOrmRepository = (this.categoryRepository as any).repository;
    const deleteResult = await typeOrmRepository
      .createQueryBuilder()
      .delete()
      .where('id IN (:...ids)', { ids })
      .andWhere('restaurantId = :restaurantId', { restaurantId })
      .execute();

    if (!deleteResult || deleteResult.affected === 0) {
      throwApplicationError(HttpStatus.BAD_REQUEST, 'Failed to delete categories');
    }

    return Result.ok(true);
  }

  async deleteCategories(ids: string[], restaurantId: string): Promise<Result<boolean>> {
    if (!restaurantId) {
      throwApplicationError(HttpStatus.BAD_REQUEST, 'Restaurant identifier is required');
    }
    return await this.bulkDelete(ids, restaurantId);
  }

  async getRestaurantsByCategory(categoryId?: string, categoryName?: string, tenantId?: string): Promise<Result<any[]>> {
    if (!categoryId && !categoryName) {
      throwApplicationError(HttpStatus.BAD_REQUEST, 'Either categoryId or categoryName is required');
    }

    // Build query to find unique restaurant IDs that have menus with the specified category
    const restaurantIdsQuery = this.menuRepository
      .createQueryBuilder('menu')
      .select('DISTINCT menu.restaurantId', 'restaurantId')
      .innerJoin('menu.category', 'category')
      .innerJoin('menu.restaurant', 'restaurant')
      .where('restaurant.isActive = :isActive', { isActive: true })
      .andWhere('restaurant.status = :status', { status: 'active' });

    // Filter by category ID or name
    if (categoryId) {
      restaurantIdsQuery.andWhere('category.id = :categoryId', { categoryId });
    } else if (categoryName) {
      restaurantIdsQuery.andWhere('LOWER(category.name) = LOWER(:categoryName)', { categoryName });
    }

    // Optional tenant filter
    if (tenantId) {
      restaurantIdsQuery.andWhere('restaurant.tenantId = :tenantId', { tenantId });
    }

    const restaurantIds = await restaurantIdsQuery.getRawMany();

    if (!restaurantIds || restaurantIds.length === 0) {
      return Result.ok([]);
    }

    // Fetch full restaurant details
    const restaurantIdList = restaurantIds.map((r: any) => r.restaurantId);
    const restaurants = await this.restaurantRepository.find({
      where: { id: In(restaurantIdList) },
      order: { name: 'ASC' },
    });

    // Format the response
    const formattedRestaurants = restaurants.map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      logo: restaurant.logo,
      address: restaurant.address,
      contactEmail: restaurant.contactEmail,
      contactPhoneNumber: restaurant.contactPhoneNumber,
      openTime: restaurant.openTime,
      closeTime: restaurant.closeTime,
      openHours: restaurant.openHours,
      status: restaurant.status,
      isActive: restaurant.isActive,
      paymentTiming: restaurant.paymentTiming,
      tenantId: restaurant.tenantId,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    }));

    return Result.ok(formattedRestaurants);
  }

  async reorderCategories(restaurantId: string, categoryOrders: { id: string; displayOrder: number }[]): Promise<Result<boolean>> {
    if (!restaurantId) {
      throwApplicationError(HttpStatus.BAD_REQUEST, 'Restaurant identifier is required');
    }

    await this.ensureRestaurantExists(restaurantId);

    const typeOrmRepository = (this.categoryRepository as any).repository;

    const updatePromises = categoryOrders.map(order =>
      typeOrmRepository.update({ id: order.id, restaurantId }, { displayOrder: order.displayOrder })
    );

    await Promise.all(updatePromises);

    return Result.ok(true);
  }

  private async ensureRestaurantExists(restaurantId: string): Promise<void> {
    if (!restaurantId) {
      throwApplicationError(HttpStatus.BAD_REQUEST, 'Restaurant identifier is required');
    }
    const restaurant = await this.restaurantRepository.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      throwApplicationError(HttpStatus.NOT_FOUND, `Restaurant with id ${restaurantId} does not exist`);
    }
  }
}
