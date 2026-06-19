import { Result } from './../domain/result/result';
import { IAddonResponseDTO } from './addon-response.dto';
import { CreateAddonDTO } from './create-addon.dto';
import { UpdateAddonDTO } from './update-addon.dto';

export interface IAddonService {
  createAddon(props: CreateAddonDTO, user: any): Promise<Result<IAddonResponseDTO>>;
  getAddons(user: any): Promise<Result<IAddonResponseDTO[]>>;
  getAddonsGroupedByRestaurant(): Promise<Result<any>>;
  getPublicAddons(restaurantId?: string, menuId?: string): Promise<Result<IAddonResponseDTO[]>>;
  updateAddon(id: string, props: UpdateAddonDTO, user: any): Promise<Result<IAddonResponseDTO>>;
  deleteAddon(id: string, user: any): Promise<Result<boolean>>;
}
