import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location as LocationEntity } from '../infrastructure/database/entities/location.entity';
import { TYPES } from './../application/constants/types';
import { AuditMapper } from './../audit/audit.mapper';
import { ContextService } from './../infrastructure/context/context.service';
import { LocationRepository } from './../infrastructure/data_access/repositories/location.repository';
import { LocationsController } from './location.controller';
import { LocationMapper } from './location.mapper';
import { LocationService } from './location.service';

@Module({
  imports: [TypeOrmModule.forFeature([LocationEntity])],
  controllers: [LocationsController],
  providers: [
    { provide: TYPES.ILocationService, useClass: LocationService },
    { provide: TYPES.IContextService, useClass: ContextService },
    { provide: TYPES.IMapper, useClass: LocationMapper },
    LocationRepository,
    LocationMapper,
    AuditMapper,
  ],
})
export class LocationModule {}
