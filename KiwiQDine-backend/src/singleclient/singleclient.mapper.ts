import { Injectable } from '@nestjs/common';
import { SingleClient as SingleClientEntity } from './../infrastructure/database/entities/singleclient.entity';
import { AuditMapper } from '../audit/audit.mapper';
import { IMapper } from '../domain/mapper/mapper';
import { SingleClient } from './singleclient';

@Injectable()
export class SingleClientMapper implements IMapper<SingleClient, SingleClientEntity> {
  constructor(private readonly auditMapper: AuditMapper) {}
  toPersistence(entity: SingleClient): SingleClientEntity {
    const document: SingleClientEntity = {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      organisationName: entity.organisationName,
      phoneNumber: entity.phoneNumber,
      passwordHash: entity.passwordHash,
      role: entity.role as any,
      isActive: entity.isActive,
      status: entity.status as any,
      refreshTokenHash: entity.refreshTokenHash,
      organisationAddress: entity.organisationAddress,
      auditCreatedBy: entity.audit.auditCreatedBy,
      auditCreatedDateTime: new Date(entity.audit.auditCreatedDateTime),
      auditModifiedBy: entity.audit.auditModifiedBy,
      auditModifiedDateTime: entity.audit.auditModifiedDateTime ? new Date(entity.audit.auditModifiedDateTime) : undefined,
      auditDeletedDateTime: entity.audit.auditDeletedDateTime ? new Date(entity.audit.auditDeletedDateTime) : undefined,
      auditDeletedBy: entity.audit.auditDeletedBy,
    };
    return document;
  }

  toDomain(doc: SingleClientEntity): SingleClient {
    const {
      id,
      firstName,
      lastName,
      email,
      organisationName,
      phoneNumber,
      passwordHash,
      refreshTokenHash,
      role,
      isActive,
      status,
      organisationAddress,
    } = doc;
    const entity: SingleClient = SingleClient.create(
      {
        firstName,
        lastName,
        email,
        organisationName,
        phoneNumber,
        passwordHash,
        refreshTokenHash,
        role,
        isActive,
        status,
        organisationAddress,
        audit: this.auditMapper.toDomain(doc as any),
      },
      id,
    ).getValue();
    return entity;
  }
}
