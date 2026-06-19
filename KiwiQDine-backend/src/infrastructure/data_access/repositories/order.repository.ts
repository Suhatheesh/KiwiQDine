import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { Order as OrderEntity } from '../../../infrastructure/database/entities/order.entity';

@Injectable()
export class OrderRepository extends GenericTypeOrmRepository<any, OrderEntity> {
  constructor(
    @InjectRepository(OrderEntity) repository: Repository<OrderEntity>,
  ) {
    super(repository, null);
  }
}