import { Addon } from '../../../../addon/addon';
import { IGenericTypeOrmRepository } from '../../../database/typeorm/generic-typeorm.interface';
import { Result } from '../../../../domain/result/result';
import { Addon as AddonEntity } from '../../../database/entities/addon.entity';

export interface IAddonRepository extends IGenericTypeOrmRepository<Addon, AddonEntity> {
  getAddonsByIds(addonsIds: string[]): Promise<Addon[] | []>;
  getAddonWithMenus(id: string): Promise<any>;
  getAddonsByRestaurant(restaurantId: string): Promise<any[]>;
}
