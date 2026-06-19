import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericTypeOrmRepository } from '../../../infrastructure/database/typeorm/generic-typeorm.repository';
import { OrderProcessingQueue as OrderProcessingQueueEntity } from '../../../infrastructure/database/entities/order-processing-queue.entity';

@Injectable()
export class OrderProcessingQueueRepository extends GenericTypeOrmRepository<any, OrderProcessingQueueEntity> {
  constructor(
    @InjectRepository(OrderProcessingQueueEntity) repository: Repository<OrderProcessingQueueEntity>,
  ) {
    super(repository, null);
  }
}