import { Injectable } from '@nestjs/common';
import { AuditMapper } from './../audit/audit.mapper';
import { IMapper } from './../domain/mapper/mapper';
import { Addon } from './addon';
import { Addon as AddonEntity } from '../infrastructure/database/entities/addon.entity';

@Injectable()
export class AddonMapper implements IMapper<Addon, AddonEntity> {
  toPersistence(entity: Addon): AddonEntity {
    const { name, description, audit, quantity, restaurantId, unitPrice } = entity;
    const {
      auditCreatedBy,
      auditCreatedDateTime,
      auditModifiedBy,
      auditModifiedDateTime,
      auditDeletedBy,
      auditDeletedDateTime,
    } = audit;

    const result: any = {
      name,
      description,
      quantity,
      unitPrice,
      price: unitPrice, // Map unitPrice to price for the entity
      restaurantId,
      type: 'single' as any, // Default type
      status: 'active' as any, // Default status
      sortOrder: 0,
      isRequired: false,
      maxSelection: 1,
      auditCreatedBy,
      auditCreatedDateTime: new Date(auditCreatedDateTime),
      auditModifiedBy,
      auditModifiedDateTime: auditModifiedDateTime ? new Date(auditModifiedDateTime) : undefined,
      auditDeletedBy,
      auditDeletedDateTime: auditDeletedDateTime ? new Date(auditDeletedDateTime) : undefined,
    };

    // Only include id if it exists (for updates), omit for new entities
    if (entity.id) {
      result.id = entity.id;
    }

    return result as AddonEntity;
  }

  toDomain(model: AddonEntity): Addon {
    const { name, description, id, quantity, restaurantId, unitPrice } = model;
    return Addon.create(
      {
        name,
        description,
        restaurantId,
        quantity,
        unitPrice,
        audit: new AuditMapper().toDomain(model as any),
      },
      id,
    );
  }
}
