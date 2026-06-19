import { Injectable } from '@nestjs/common';
import { AuditMapper } from 'src/audit';
import { IMapper } from 'src/domain';
import { OrderProcessingQueue } from './order_processing_queue';
import { OrderProcessingQueue as OrderProcessingQueueEntity } from 'src/infrastructure/database/entities/order-processing-queue.entity';

@Injectable()
export class OrderProcessingQueueMapper implements IMapper<OrderProcessingQueue, OrderProcessingQueueEntity> {
  constructor(private readonly auditMapper: AuditMapper) {}
  toPersistence(entity: OrderProcessingQueue): OrderProcessingQueueEntity {
    const { id, orderId, orderStatusId, audit } = entity;
    const {
      auditCreatedBy,
      auditCreatedDateTime,
      auditModifiedBy,
      auditModifiedDateTime,
      auditDeletedBy,
      auditDeletedDateTime,
    } = audit;
    const OrderProcessingQueueany: OrderProcessingQueueEntity = {
      id: id,
      orderId,
      orderStatusId,
      order: null as any, // Will be populated by TypeORM
      orderStatus: null as any, // Will be populated by TypeORM
      auditCreatedBy,
      auditCreatedDateTime: new Date(auditCreatedDateTime),
      auditModifiedBy,
      auditModifiedDateTime: auditModifiedDateTime ? new Date(auditModifiedDateTime) : undefined,
      auditDeletedDateTime: auditDeletedDateTime ? new Date(auditDeletedDateTime) : undefined,
      auditDeletedBy,
    };
    return OrderProcessingQueueany;
  }

  toDomain(model: OrderProcessingQueueEntity): OrderProcessingQueue {
    const { id, orderId, orderStatusId } = model;
    const entity: OrderProcessingQueue = OrderProcessingQueue.create(
      {
        orderId,
        orderStatusId,
        audit: this.auditMapper.toDomain(model),
      },
      id,
    );
    return entity;
  }
}
