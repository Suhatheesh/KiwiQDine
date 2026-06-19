import { Result } from 'src/domain';
import { IGenericTypeOrmRepository } from '../../../database/typeorm/generic-typeorm.interface';
import { OrderProcessingQueue } from 'src/order_processing_queue/order_processing_queue';
import { OrderProcessingQueue as OrderProcessingQueueEntity } from '../../../database/entities/order-processing-queue.entity';

export interface IOrderProcessingQueueRespository
  extends IGenericTypeOrmRepository<OrderProcessingQueue, OrderProcessingQueueEntity> {
  createOrderProcessingQueue(note: OrderProcessingQueue): Promise<Result<OrderProcessingQueue>>;
}
