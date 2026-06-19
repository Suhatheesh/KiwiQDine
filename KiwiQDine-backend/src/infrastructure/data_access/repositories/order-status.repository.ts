import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { OrderStatus as OrderStatusEntity } from '../../../infrastructure/database/entities/order-status.entity';

@Injectable()
export class OrderStatusRepository extends GenericTypeOrmRepository<any, OrderStatusEntity> {
  constructor(
    @InjectRepository(OrderStatusEntity) repository: Repository<OrderStatusEntity>,
  ) {
    super(repository, null);
  }
}