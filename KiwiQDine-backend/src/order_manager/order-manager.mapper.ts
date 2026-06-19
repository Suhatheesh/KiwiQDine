import { Injectable } from '@nestjs/common';
import { AuditMapper } from './../audit/audit.mapper';
import { IMapper } from './../domain/mapper/mapper';
import { OrderManager as OrderManagerEntity } from './../infrastructure/database/entities/order-manager.entity';
import { SingleClientMapper } from './../singleclient/singleclient.mapper';
import { OrderManager } from './order.manager';

@Injectable()
export class OrderManagerMapper implements IMapper<OrderManager, OrderManagerEntity> {
  constructor(private readonly singleclientMapper: SingleClientMapper, private readonly auditMapper: AuditMapper) {}
  toPersistence(entity: OrderManager): OrderManagerEntity {
    const { firstName, lastName, email, phoneNumber, singleclient, role, audit, password } = entity;
    const {
      auditCreatedBy,
      auditCreatedDateTime,
      auditModifiedBy,
      auditModifiedDateTime,
      auditDeletedBy,
      auditDeletedDateTime,
    } = audit;
    const orderManagerany: OrderManagerEntity = {
      id: entity.id,
      firstName,
      lastName,
      email,
      phoneNumber,
      singleclient: this.singleclientMapper.toPersistence(singleclient),
      singleclientId: singleclient.id,
      role,
      password,
      auditCreatedBy,
      auditCreatedDateTime: new Date(auditCreatedDateTime),
      auditModifiedBy,
      auditModifiedDateTime: auditModifiedDateTime ? new Date(auditModifiedDateTime) : undefined,
      auditDeletedBy,
      auditDeletedDateTime: auditDeletedDateTime ? new Date(auditDeletedDateTime) : undefined,
    };
    return orderManagerany;
  }

  toDomain(model: OrderManagerEntity): OrderManager {
    const { id, firstName, lastName, email, phoneNumber, singleclient, role, password } = model;
    const orderManagerEntity: OrderManager = OrderManager.create(
      {
        firstName,
        lastName,
        email,
        phoneNumber,
        singleclient: this.singleclientMapper.toDomain(singleclient),
        role,
        audit: this.auditMapper.toDomain(model),
        password,
      },
      id,
    ).getValue();
    return orderManagerEntity;
  }
}
