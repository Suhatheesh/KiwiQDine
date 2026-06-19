
import { dinningType } from 'src/order/order-entity.interface';
import { CartItem as CartItemEntity } from '../../../database/entities/cart-item.entity';
import { OrderStatus as OrderStatusEntity } from '../../../database/entities/order-status.entity';

export interface IOrderDataModel {
  readonly state?: OrderStatusEntity;
  readonly type: dinningType;
  readonly singleclientId: string;
  readonly customerId?: string;
  readonly total: number;
  readonly discount?: number;
  readonly orderManagerId?: string;
  readonly cartItems?: CartItemEntity[];
  readonly orderStatusId: string;
  readonly summary: string;
}
