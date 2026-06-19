import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { SingleClient as SingleClientEntity } from '../../../infrastructure/database/entities/singleclient.entity';
import { SingleClient } from '../../../singleclient/singleclient';
import { SingleClientMapper } from '../../../singleclient/singleclient.mapper';

@Injectable()
export class SingleClientRepository extends GenericTypeOrmRepository<SingleClient, SingleClientEntity> {
  constructor(
    @InjectRepository(SingleClientEntity) repository: Repository<SingleClientEntity>,
    singleclientMapper: SingleClientMapper,
  ) {
    super(repository, singleclientMapper);
  }
}