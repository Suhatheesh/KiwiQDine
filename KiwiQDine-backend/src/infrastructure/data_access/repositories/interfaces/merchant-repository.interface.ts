import { IGenericTypeOrmRepository } from '../../../database/typeorm/generic-typeorm.interface';
import { SingleClient } from 'src/singleclient';
import { SingleClient as SingleClientEntity } from '../../../database/entities/singleclient.entity';

export interface ISingleClientRepository extends IGenericTypeOrmRepository<SingleClient, SingleClientEntity> {}
