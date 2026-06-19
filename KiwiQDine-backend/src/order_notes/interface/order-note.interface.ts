
import { Audit } from 'src/domain';

export interface IOrderNote {
  orderId: string;
  menuId: string;
  note: string;
  audit: Audit;
}
