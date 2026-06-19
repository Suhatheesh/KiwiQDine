import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TYPES } from '../application';
import { AuditMapper } from '../audit';
import { CartItemMapper } from '../cart/cart-item.mapper';
import { SelectedCartItemMapper } from '../cart/selectedItems/selected-cart-item.mapper';
import {
  ContextService,
  SingleClientRepository,
} from '../infrastructure';
import { CartItemRepository } from '../infrastructure/data_access/repositories/cart-item.repository';
import { OrderRepository } from '../infrastructure/data_access/repositories/order.repository';
import { SelectedCartItemRepository } from '../infrastructure/data_access/repositories/selected-cart-item.repository';
import { SingleClientMapper, SingleClientService } from '../singleclient';
import { ValidateUser } from '../utils';
import { OrderMapper } from './order.mapper';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { ContextMiddleWare } from '../infrastructure/middlewares';
import { OrderStatusRepository } from '../infrastructure/data_access/repositories/order-status.repository';
import { OrderStatusMapper } from '../order_statuses/order_status.mapper';
import { OrderNoteMapper } from '../order_notes/order_note.mapper';
import { OrderNoteRepository } from '../infrastructure/data_access/repositories/order-note.repository';
import { OrderNoteService } from '../order_notes/order_note.service';
import { OrderProcessingQueueService } from '../order_processing_queue/order_processing_queue.service';
import { OrderProcessingQueueRepository } from '../infrastructure/data_access/repositories/order-processing-queue.repository';
import { OrderProcessingQueueMapper } from '../order_processing_queue/order_processing_queue.mapper';
import { Order, OrderItem } from '../infrastructure/database/entities';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    SubscriptionModule,
  ],
  controllers: [OrderController],
  providers: [
    { provide: TYPES.IOrderService, useClass: OrderService },
    { provide: TYPES.ICartItemRepository, useClass: CartItemRepository },
    { provide: TYPES.IOrderRepository, useClass: OrderRepository },
    { provide: TYPES.ISingleClientService, useClass: SingleClientService },
    { provide: TYPES.IContextService, useClass: ContextService },
    { provide: TYPES.IValidateUser, useClass: ValidateUser },
    { provide: TYPES.IOrderStatusRepository, useClass: OrderStatusRepository },
    { provide: TYPES.IOrderNoteRepository, useClass: OrderNoteRepository },
    { provide: TYPES.IOrderNoteService, useClass: OrderNoteService },
    { provide: TYPES.IOrderProcessingQueueService, useClass: OrderProcessingQueueService },
    { provide: TYPES.IOrderProcessingQueueRepository, useClass: OrderProcessingQueueRepository },
    SingleClientRepository,
    CartItemRepository,
    SelectedCartItemRepository,
    OrderMapper,
    SelectedCartItemMapper,
    CartItemMapper,
    JwtService,
    SingleClientMapper,
    AuditMapper,
    OrderStatusMapper,
    OrderNoteMapper,
    OrderProcessingQueueMapper,
  ],
})
export class OrderModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleWare).exclude().forRoutes(OrderController);
  }
}
