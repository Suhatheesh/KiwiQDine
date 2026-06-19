import { Injectable } from '@nestjs/common';
import { AuditMapper } from './../audit/audit.mapper';
import { IMapper } from './../domain/mapper/mapper';
import { Location as LocationEntity } from './../infrastructure/database/entities/location.entity';
import { Location } from './location';

@Injectable()
export class LocationMapper implements IMapper<Location, LocationEntity> {
  constructor(private readonly auditMapper: AuditMapper) {}
  toPersistence(entity: Location): LocationEntity {
    const document: LocationEntity = {
      id: entity.id,
      address: entity.address,
      address2: entity.address2,
      city: entity.city,
      country: entity.country,
      postCode: entity.postCode,
      state: entity.state,
      latitude: entity.latitude,
      longitude: entity.longitude,
      auditCreatedBy: entity.audit.auditCreatedBy,
      auditCreatedDateTime: new Date(entity.audit.auditCreatedDateTime),
      auditModifiedBy: entity.audit.auditModifiedBy,
      auditModifiedDateTime: entity.audit.auditModifiedDateTime ? new Date(entity.audit.auditModifiedDateTime) : undefined,
      auditDeletedDateTime: entity.audit.auditDeletedDateTime ? new Date(entity.audit.auditDeletedDateTime) : undefined,
      auditDeletedBy: entity.audit.auditDeletedBy,
    };
    return document;
  }

  toDomain(doc: LocationEntity): Location {
    const { id, address, address2, city, country, postCode, state, latitude, longitude } = doc;
    const entity: Location = Location.create(
      {
        address,
        address2,
        city,
        country,
        postCode,
        state,
        latitude,
        longitude,
        audit: this.auditMapper.toDomain(doc as any),
      },
      id,
    ).getValue();
    return entity;
  }
}
