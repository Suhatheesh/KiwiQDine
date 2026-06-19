import { Order } from '../../../../order/order';
import { Order as OrderEntity } from '../../../database/entities/order.entity';
import { Result } from '../../../../domain/result/result';
import { CreateCartItemsDTO } from '../../../../order/dto/create-order.dto';
import { IGenericTypeOrmRepository } from '../../../database/typeorm/generic-typeorm.interface';

export interface IOrderRepository extends IGenericTypeOrmRepository<Order, OrderEntity> {
  createOrder(order: any, options?: { session: any }): Promise<Result<Order>>;
  getDuplicateOrder(type: string, singleclientId: string, cartItems: CreateCartItemsDTO[]): Promise<any>;
  getOrders(): Promise<Result<Order[]>>;
}
