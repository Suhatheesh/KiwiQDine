import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CartItem } from 'src/cart/cart-item';
import { Result } from 'src/domain';
import { GenericTypeOrmRepository } from 'src/infrastructure/database/typeorm/generic-typeorm.repository';
import { throwApplicationError } from 'src/infrastructure/utilities/exception-instance';
import { CartItemMapper } from './../../../cart/cart-item.mapper';
import { ICartItemRepository } from './interfaces/cart-item-repository.interface';
import { CartItem as CartItemEntity } from '../../../infrastructure/database/entities/cart-item.entity';

@Injectable()
export class CartItemRepository
  extends GenericTypeOrmRepository<CartItem, CartItemEntity>
  implements ICartItemRepository
{
  cartItemMapper: CartItemMapper;
  constructor(
    @InjectRepository(CartItemEntity) repository: Repository<CartItemEntity>,
    cartItemMapper: CartItemMapper,
  ) {
    super(repository, cartItemMapper);
    this.cartItemMapper = cartItemMapper;
  }

  async updateCartItemSelectedItems(cartItems: CartItem[]): Promise<Result<CartItem[]>> {
    try {
      const document = cartItems.map((doc) => this.cartItemMapper.toPersistence(doc));
      const selectedItemsToUpdate = document.map((doc) => ({ id: doc.id, selectedItems: doc.selectedItems }));
      const result = await this.updateMany(
        { id: In(document.map((doc) => doc.id)) },
        { selectedItems: selectedItemsToUpdate },
      );
      if (!result.isSuccess) {
        throwApplicationError(HttpStatus.BAD_REQUEST, '');
      }
      return result;
    } catch (error) {
      console.error('an error occured', error);
    }
  }
}
