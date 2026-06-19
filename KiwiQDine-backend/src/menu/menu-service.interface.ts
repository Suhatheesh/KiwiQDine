
import { Result } from './../domain/result/result';
import { CreateMenuDTO } from './create-menu.schema';
import { IMenuResponseDTO } from './menu-response.dto';

export interface IMenuService {
  createMenu(props: CreateMenuDTO): Promise<Result<IMenuResponseDTO>>;
  getMenus(): Promise<Result<IMenuResponseDTO[]>>;
  getMenuById(id: string): Promise<Result<IMenuResponseDTO>>;
  updateMenu(props: any, id: string): Promise<Result<IMenuResponseDTO>>;
  deleteMenu(id: string): Promise<Result<boolean>>;
  getMenuByRestaurantId(restaurantId: string): Promise<Result<IMenuResponseDTO[]>>;
  getExtendedMenuByRestaurantId(restaurantId: string): Promise<Result<IMenuResponseDTO[]>>;
}
