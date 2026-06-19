import { Injectable } from '@nestjs/common';
import { IMapper } from '../domain';
import { OrderStatus } from './order_status';
import { OrderStatus as OrderStatusEntity } from '../infrastructure/database/entities/order-status.entity';
import { AuditMapper } from '../audit';

@Injectable()
export class OrderStatusMapper implements IMapper<OrderStatus, OrderStatusEntity> {
  constructor(private readonly auditMapper: AuditMapper) {}
  toPersistence(entity: OrderStatus): OrderStatusEntity {
    const { id, isActive, name, code, description, audit } = entity;
    const {
      auditCreatedBy,
      auditCreatedDateTime,
      auditModifiedBy,
      auditModifiedDateTime,
      auditDeletedBy,
      auditDeletedDateTime,
    } = audit;
    const orderStatusany: OrderStatusEntity = {
      id: id,
      name,
      isActive,
      code,
      description,
      auditCreatedBy,
      auditCreatedDateTime: new Date(auditCreatedDateTime),
      auditModifiedBy,
      auditModifiedDateTime: auditModifiedDateTime ? new Date(auditModifiedDateTime) : undefined,
      auditDeletedDateTime: auditDeletedDateTime ? new Date(auditDeletedDateTime) : undefined,
      auditDeletedBy,
    };
    return orderStatusany;
  }

  toDomain(model: OrderStatusEntity): OrderStatus {
    const { id, isActive, name, code, description } = model;
    const entity: OrderStatus = OrderStatus.create(
      {
        name,
        code,
        description,
        isActive,
        audit: this.auditMapper.toDomain(model),
      },
      id,
    );
    return entity;
  }
}
