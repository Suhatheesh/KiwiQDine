import { Injectable } from '@nestjs/common';
import { AuditMapper } from './../audit/audit.mapper';
import { IMapper } from './../domain/mapper/mapper';
import { Category } from './category';
import { Category as CategoryEntity } from '../infrastructure/database/entities/category.entity';

@Injectable()
export class CategoryMapper implements IMapper<Category, CategoryEntity> {
  toPersistence(entity: Category): CategoryEntity {
    const { name, description, code, id, image, imageKey, audit, restaurantId, displayOrder, isShowcase, isActive } = entity;
    const {
      auditCreatedBy,
      auditCreatedDateTime,
      auditModifiedBy,
      auditModifiedDateTime,
      auditDeletedDateTime,
      auditDeletedBy,
    } = audit;
    return {
      id: id,
      name,
      description,
      code,
      image,
      imageKey,
      restaurantId,
      displayOrder,
      isShowcase,
      isActive,
      auditCreatedBy,
      auditCreatedDateTime: new Date(auditCreatedDateTime),
      auditModifiedBy,
      auditModifiedDateTime: auditModifiedDateTime ? new Date(auditModifiedDateTime) : undefined,
      auditDeletedDateTime: auditDeletedDateTime ? new Date(auditDeletedDateTime) : undefined,
      auditDeletedBy,
    } as CategoryEntity;
  }

  toDomain(model: CategoryEntity): Category {
    const { id, name, code, description, image, imageKey, restaurantId, displayOrder, isShowcase, isActive } = model;
    const entity: Category = Category.create(
      { name, code, description, image, imageKey, restaurantId, displayOrder, isShowcase, isActive, audit: new AuditMapper().toDomain(model as any) },
      id,
    ).getValue();
    return entity;
  }
}
