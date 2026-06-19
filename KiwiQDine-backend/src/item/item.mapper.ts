import { Injectable } from '@nestjs/common';
import { AuditMapper } from '../audit/audit.mapper';
import { IMapper } from '../domain/mapper/mapper';
import { Item as ItemEntity } from '../infrastructure/database/entities/item.entity';
import { Item } from './item';

@Injectable()
export class ItemMapper implements IMapper<Item, ItemEntity> {
  constructor(private readonly auditMapper: AuditMapper) {}
  toPersistence(entity: Item): ItemEntity {
    const { id, name, description, price, maximumPermitted, preparationTime } = entity;
    const itemEntity = new ItemEntity();
    itemEntity.id = id;
    itemEntity.name = name;
    itemEntity.description = description;
    itemEntity.price = price;
    itemEntity.maximumPermitted = maximumPermitted;
    itemEntity.preparationTime = preparationTime;
    // Audit fields from BaseEntity
    itemEntity.auditCreatedBy = entity.audit.auditCreatedBy;
    itemEntity.auditCreatedDateTime = new Date(entity.audit.auditCreatedDateTime);
    itemEntity.auditModifiedBy = entity.audit.auditModifiedBy;
    itemEntity.auditModifiedDateTime = entity.audit.auditModifiedDateTime ? new Date(entity.audit.auditModifiedDateTime) : undefined;
    itemEntity.auditDeletedDateTime = entity.audit.auditDeletedDateTime ? new Date(entity.audit.auditDeletedDateTime) : undefined;
    itemEntity.auditDeletedBy = entity.audit.auditDeletedBy;
    return itemEntity;
  }
  toDomain(model: ItemEntity): Item {
    const { id, name, description, price, maximumPermitted, preparationTime } = model;
    const entity: Item = Item.create(
      {
        name,
        price,
        description,
        maximumPermitted,
        preparationTime,
        audit: this.auditMapper.toDomain(model as any),
      },
      id,
    ).getValue();
    return entity;
  }
}
