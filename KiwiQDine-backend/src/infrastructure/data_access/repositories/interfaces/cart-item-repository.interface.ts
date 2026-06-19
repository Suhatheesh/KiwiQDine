import { CartItem } from '../../../../cart/cart-item';
import { IGenericTypeOrmRepository } from '../../../database/typeorm/generic-typeorm.interface';
import { Result } from '../../../../domain/result/result';
import { CartItem as CartItemEntity } from '../../../database/entities/cart-item.entity';

export interface ICartItemRepository extends IGenericTypeOrmRepository<CartItem, CartItemEntity> {
  updateCartItemSelectedItems(cartItems: CartItem[], options?: { session: any }): Promise<Result<CartItem[]>>;
}
