import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { Location as LocationEntity } from '../../../infrastructure/database/entities/location.entity';

@Injectable()
export class LocationRepository extends GenericTypeOrmRepository<any, LocationEntity> {
  constructor(
    @InjectRepository(LocationEntity) repository: Repository<LocationEntity>,
  ) {
    super(repository, null);
  }
}