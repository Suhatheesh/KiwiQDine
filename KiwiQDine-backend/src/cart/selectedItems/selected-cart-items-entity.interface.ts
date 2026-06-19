
import { Audit } from 'src/domain';

export interface ISelectedCartItem {
  cartItemId: string;
  itemId: string;
  menuId: string;
  price: number;
  quantity: number;
  audit: Audit;
}
