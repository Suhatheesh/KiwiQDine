import { Item } from '../../../../item/item';
import { Item as ItemEntity } from '../../../database/entities/item.entity';
import { Result } from '../../../../domain/result/result';

export interface IItemRepository {
  getItemById(id: string): Promise<Result<Item>>;
  getItem(name: string): Promise<Result<Item>>;
  createItem(itemModel: any): Promise<Result<Item>>;
  getItems(filterQuery: any): Promise<Result<Item[]>>;
  getItemsByIds(itemIds: string[]): Promise<Result<Item[]>>;
}
