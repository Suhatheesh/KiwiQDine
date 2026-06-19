// Note: This mapper needs to be refactored to match the new Order entity structure
// The new Order entity has: id, restaurantId, customerId, tableNo, status, totalAmount, createdAt, updatedAt
// Old structure referenced: state, type, singleclientId, total, discount, orderManagerId, cartItems, orderStatusId, summary

import { CartItemMapper } from './../cart/cart-item.mapper';
import { Injectable } from '@nestjs/common';
import { IMapper } from '../domain';
import { Order as OrderEntity } from '../infrastructure/database/entities/order.entity';
import { Order } from './order';
import { AuditMapper } from '../audit';
import { OrderStatusMapper } from '../order_statuses/order_status.mapper';

@Injectable()
export class OrderMapper implements IMapper<Order, OrderEntity> {
  constructor(
    private readonly auditMapper: AuditMapper,
    private readonly cartItemMapper: CartItemMapper,
    private readonly orderStatusMapper: OrderStatusMapper,
  ) {}
  
  toPersistence(entity: Order): OrderEntity {
    // Note: This mapping is incomplete - the new Order entity structure is simpler
    // This mapper may need complete refactoring for the new structure
    const orderEntity = new OrderEntity();
    orderEntity.id = entity.id;
    // Map other fields as needed when domain entity is updated
    return orderEntity;
  }

  toDomain(model: OrderEntity): Order {
    // Note: This mapping is incomplete - the new Order entity structure is simpler
    // This mapper may need complete refactoring for the new structure
    const entity: Order = Order.create(
      {
        state: undefined, // New entity has status enum, not state object
        type: 'DINE_IN' as any, // Default - type removed from new entity
        singleclientId: '', // No longer in new entity
        orderStatusId: '',
        subtotal: Number(model.subtotal) || 0,
        serviceCharge: Number(model.serviceCharge) || 0,
        tax: Number(model.tax) || 0,
        total: Number(model.totalAmount),
        discount: 0,
        orderManagerId: '',
        summary: '',
        audit: this.auditMapper.toDomain({
          auditCreatedDateTime: model.createdAt,
          auditCreatedBy: '',
          auditModifiedBy: '',
          auditModifiedDateTime: model.updatedAt,
        } as any),
        cartItems: [], // Cart items not in new structure
      },
      model.id,
    );
    return entity;
  }
}