
import { Result } from './../domain/result/result';
import { ICategoryResponseDTO } from './category-response.dto';
import { CreateCategoryDTO } from './create-category.schema';
import { UpdateCategoryDTO } from './update-category.dto';
export interface ICategoryService {
  createCategory(props: CreateCategoryDTO): Promise<Result<ICategoryResponseDTO>>;
  getCategories(restaurantId: string): Promise<Result<ICategoryResponseDTO[]>>;
  getCategoryById(id: string, restaurantId: string): Promise<Result<ICategoryResponseDTO>>;
  updateCategory(id: string, props: UpdateCategoryDTO, restaurantId: string): Promise<Result<ICategoryResponseDTO>>;
  deleteCategories(ids: string[], restaurantId: string): Promise<Result<boolean>>;
  getRestaurantsByCategory(categoryId?: string, categoryName?: string, tenantId?: string): Promise<Result<any[]>>;
  reorderCategories(restaurantId: string, categoryOrders: { id: string; displayOrder: number }[]): Promise<Result<boolean>>;
}
