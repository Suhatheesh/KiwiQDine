
import { SelectedCartItem as SelectedCartItemEntity } from '../../../database/entities/selected-cart-item.entity';

export interface ICartItemModel {
  readonly menuId: string;
  readonly orderId: string;
  readonly total: number;
  readonly selectedItems?: SelectedCartItemEntity[];
}
