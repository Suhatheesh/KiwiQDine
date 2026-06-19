
import { CartItem } from 'src/cart/cart-item';
import { Audit } from 'src/domain';
import { OrderStatus } from 'src/order_statuses/order_status';

export type currentStatus = 'CREATED' | 'ACCEPTED' | 'DENIED' | 'FINISHED' | 'CANCELLED';
export type dinningType = 'PICK_UP' | 'DINE_IN' | 'DELIVERY';

export interface IOrder {
  state?: OrderStatus;
  orderStatusId: string;
  type: dinningType;
  singleclientId: string;
  customerId?: string;
  subtotal: number;
  serviceCharge: number;
  tax: number;
  total: number;
  discount?: number;
  orderManagerId?: string;
  audit: Audit;
  cartItems?: CartItem[];
  summary: string;
}

//tableNumber
//status comment if any
