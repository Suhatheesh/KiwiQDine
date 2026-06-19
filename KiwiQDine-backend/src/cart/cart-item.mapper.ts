import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditMapper } from '../audit';
import { IMapper } from '../domain';
import { throwApplicationError } from '../infrastructure/utilities/exception-instance';
import { CartItem } from './cart-item';
import { SelectedCartItemMapper } from './selectedItems/selected-cart-item.mapper';
import { SelectedCartItem } from './selectedItems/selectedCartItem';
import { CartItem as CartItemEntity } from '../infrastructure/database/entities/cart-item.entity';

@Injectable()
export class CartItemMapper implements IMapper<CartItem, CartItemEntity> {
  constructor(
    private readonly auditMapper: AuditMapper,
    private readonly selectedCartItemMapper: SelectedCartItemMapper,
  ) {}
  toPersistence(entity: CartItem): CartItemEntity {
    try {
      const { id, menuId, orderId, total, selectedItems, audit } = entity;
      const {
        auditCreatedBy,
        auditCreatedDateTime,
        auditModifiedBy,
        auditModifiedDateTime,
        auditDeletedBy,
        auditDeletedDateTime,
      } = audit;
      const cartItemEntity: Partial<CartItemEntity> = {
        id: id,
        menuId,
        orderId,
        total,
        selectedItems: selectedItems?.length
          ? selectedItems.map((item) => this.selectedCartItemMapper.toPersistence(item) as any)
          : [],
        auditCreatedBy,
        auditCreatedDateTime: new Date(auditCreatedDateTime),
        auditModifiedBy,
        auditModifiedDateTime: auditModifiedDateTime ? new Date(auditModifiedDateTime) : undefined,
        auditDeletedBy,
        auditDeletedDateTime: auditDeletedDateTime ? new Date(auditDeletedDateTime) : undefined,
      };
      return cartItemEntity as CartItemEntity;
    } catch (error: any) {
      throwApplicationError(HttpStatus.BAD_REQUEST, error.message);
    }
  }

  toDomain(model: CartItemEntity): CartItem {
    const { id, menuId, orderId, total, selectedItems } = model;
    let selectedItemsToDomain: SelectedCartItem[] = [];
    if (selectedItems?.length) {
      selectedItemsToDomain = selectedItems.map((item) => this.selectedCartItemMapper.toDomain(item));
    }
    const entity: CartItem = CartItem.create(
      { menuId, orderId, total, selectedItems: selectedItemsToDomain, audit: this.auditMapper.toDomain(model as any) },
      id,
    );
    return entity;
  }
}
