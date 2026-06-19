import { Result } from 'src/domain';
import { IGenericTypeOrmRepository } from '../../../database/typeorm/generic-typeorm.interface';
import { OrderStatus } from 'src/order_statuses/order_status';
import { OrderStatus as OrderStatusEntity } from '../../../database/entities/order-status.entity';

export interface IOrderStatusRespository extends IGenericTypeOrmRepository<OrderStatus, OrderStatusEntity> {
  createOrderStatus(status: OrderStatus): Promise<Result<OrderStatus>>;
}
