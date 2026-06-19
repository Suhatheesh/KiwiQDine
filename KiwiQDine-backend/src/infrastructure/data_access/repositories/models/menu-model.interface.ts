import { Item as ItemEntity } from '../../../database/entities/item.entity';

export interface IMenuDataModel {
  readonly name: string;
  readonly description?: string;
  readonly items?: ItemEntity[];
  readonly discount: number;
  readonly imageUrl: string;
  readonly quantityAvailable?: number;
}
