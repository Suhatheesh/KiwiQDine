import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TYPES } from 'src/application';
import { AuditMapper } from 'src/audit';
import { ContextService } from 'src/infrastructure';

import { OrderProcessingQueueMapper } from './order_processing_queue.mapper';
import { OrderProcessingQueue } from '../infrastructure/database/entities/order-processing-queue.entity';
import { OrderProcessingQueuesController } from './order_queue_processing.controller';
import { OrderProcessingQueueService } from './order_processing_queue.service';
import { OrderProcessingQueueRepository } from 'src/infrastructure/data_access/repositories/order-processing-queue.repository';

@Module({
  imports: [TypeOrmModule.forFeature([OrderProcessingQueue])],
  controllers: [OrderProcessingQueuesController],
  providers: [
    { provide: TYPES.IOrderProcessingQueueService, useClass: OrderProcessingQueueService },
    { provide: TYPES.IOrderProcessingQueueRepository, useClass: OrderProcessingQueueRepository },
    { provide: TYPES.IContextService, useClass: ContextService },
    OrderProcessingQueueMapper,
    AuditMapper,
  ],
})
export class OrderProcessingQueuesModule {}
