import { Injectable } from '@nestjs/common';
import { AuditMapper } from '../../audit';
import { IMapper } from '../../domain';
import { SelectedCartItem } from './selectedCartItem';
import { SelectedCartItem as SelectedCartItemEntity } from '../../infrastructure/database/entities/selected-cart-item.entity';

@Injectable()
export class SelectedCartItemMapper implements IMapper<SelectedCartItem, SelectedCartItemEntity> {
  toPersistence(entity: SelectedCartItem): SelectedCartItemEntity {
    const { id, cartItemId, itemId, price, quantity, menuId, audit } = entity;
    const {
      auditCreatedBy,
      auditCreatedDateTime,
      auditModifiedBy,
      auditModifiedDateTime,
      auditDeletedBy,
      auditDeletedDateTime,
    } = audit;
    const selectedCartItemEntity: any = {
      id: id,
      cartItemId,
      itemId,
      menuId,
      price,
      quantity,
      auditCreatedBy,
      auditCreatedDateTime: new Date(auditCreatedDateTime),
      auditModifiedBy,
      auditModifiedDateTime: auditModifiedDateTime ? new Date(auditModifiedDateTime) : undefined,
      auditDeletedBy,
      auditDeletedDateTime: auditDeletedDateTime ? new Date(auditDeletedDateTime) : undefined,
    };
    return selectedCartItemEntity as SelectedCartItemEntity;
  }

  toDomain(model: SelectedCartItemEntity): SelectedCartItem {
    const { id, cartItemId, itemId, price, quantity, menuId } = model;
    const entity: SelectedCartItem = SelectedCartItem.create(
      {
        cartItemId,
        itemId,
        menuId,
        price,
        quantity,
        audit: new AuditMapper().toDomain(model as any),
      },
      id,
    );
    return entity;
  }
}
