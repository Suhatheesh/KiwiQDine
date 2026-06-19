import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { OrderManager as OrderManagerEntity } from '../../../infrastructure/database/entities/order-manager.entity';

@Injectable()
export class OrderManagerRepository extends GenericTypeOrmRepository<any, OrderManagerEntity> {
  constructor(
    @InjectRepository(OrderManagerEntity) repository: Repository<OrderManagerEntity>,
  ) {
    super(repository, null);
  }
}