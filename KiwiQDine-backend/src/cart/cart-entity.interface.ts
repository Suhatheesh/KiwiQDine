
import { Audit } from 'src/domain';
import { SelectedCartItem } from './selectedItems/selectedCartItem';

export interface ICartItem {
  menuId: string;
  orderId: string;
  total: number;
  selectedItems?: SelectedCartItem[];
  audit: Audit;
}
