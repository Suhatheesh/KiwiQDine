import { Injectable } from '@nestjs/common';
import { AuditMapper } from 'src/audit';
import { IMapper } from 'src/domain';
import { OrderNote as OrderNoteEntity } from './../infrastructure/database/entities/order-note.entity';
import { OrderNote } from './order_note';

@Injectable()
export class OrderNoteMapper implements IMapper<OrderNote, OrderNoteEntity> {
  constructor(private readonly auditMapper: AuditMapper) {}
  toPersistence(entity: OrderNote): OrderNoteEntity {
    const { id, orderId, note, menuId, audit } = entity;
    const {
      auditCreatedBy,
      auditCreatedDateTime,
      auditModifiedBy,
      auditModifiedDateTime,
      auditDeletedBy,
      auditDeletedDateTime,
    } = audit;
    const orderNoteany: OrderNoteEntity = {
      id: id,
      orderId,
      menuId,
      note,
      order: null as any, // Will be populated by TypeORM
      menu: null as any, // Will be populated by TypeORM
      auditCreatedBy,
      auditCreatedDateTime: new Date(auditCreatedDateTime),
      auditModifiedBy,
      auditModifiedDateTime: auditModifiedDateTime ? new Date(auditModifiedDateTime) : undefined,
      auditDeletedDateTime: auditDeletedDateTime ? new Date(auditDeletedDateTime) : undefined,
      auditDeletedBy,
    };
    return orderNoteany;
  }

  toDomain(model: OrderNoteEntity): OrderNote {
    const { id, orderId, note, menuId } = model;
    const entity: OrderNote = OrderNote.create(
      {
        orderId,
        note,
        menuId,
        audit: this.auditMapper.toDomain(model),
      },
      id,
    );
    return entity;
  }
}
