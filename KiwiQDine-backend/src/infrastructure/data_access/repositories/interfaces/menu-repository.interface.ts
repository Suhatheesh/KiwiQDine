import { Menu } from '../../../../menu/menu';
import { Menu as MenuEntity } from '../../../database/entities/menu.entity';
import { Result } from '../../../../domain/result/result';

export interface IMenuRepository {
  getMenus(filterQuery: any): Promise<Result<Menu[]>>;
  getMenuById(id: string): Promise<Result<Menu>>;
  createMenu(menuModel: any): Promise<Result<Menu>>;
  deleteMenu(id: string): Promise<Result<boolean>>;
  getMenuByRestaurantId(restaurantId: string, singleclientId: string): Promise<Result<Menu[]>>;
}
