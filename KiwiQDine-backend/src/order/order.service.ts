import { HttpStatus, Inject } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Menu, Restaurant, Payment } from '../infrastructure/database/entities';

import { TYPES } from '../application';
import { CartItem } from '../cart/cart-item';
import { SelectedCartItem } from '../cart/selectedItems/selectedCartItem';
import { Audit, Result } from '../domain';
import { Context, IContextService, SingleClientRepository } from '../infrastructure';
import { ICartItemRepository } from '../infrastructure/data_access/repositories/interfaces/cart-item-repository.interface';
import { IOrderRepository } from '../infrastructure/data_access/repositories/interfaces/order-repository.interface';
import { IOrderStatusRespository } from '../infrastructure/data_access/repositories/interfaces/order-status.repository';
import { SelectedCartItemRepository } from '../infrastructure/data_access/repositories/selected-cart-item.repository';
import { throwApplicationError } from '../infrastructure/utilities/exception-instance';
import { ISingleClientService, SingleClient } from '../singleclient';
import { IOrderNoteService } from '../order_notes/interface/order-note-service.interface';
import { OrderNote } from '../order_notes/order_note';
import { CartItemMapper } from './../cart/cart-item.mapper';
import { SelectedCartItemMapper } from './../cart/selectedItems/selected-cart-item.mapper';
import { CreateCartItemsDTO, CreateOrderDTO } from './dto/create-order.dto';
import { IOrderService } from './interface/order-service.interface';
import { Order } from './order';
import { IOrderResponseDTO } from './order-response.dto';
import { OrderMapper } from './order.mapper';
import { OrderParser } from './order.parser';
import { IOrderProcessingQueueService } from '../order_processing_queue/interface/order-processing-queue-service.interface';

export class OrderService implements IOrderService {
  private context: Context;
  constructor(
    @Inject(TYPES.IOrderRepository) private readonly orderRepository: IOrderRepository,
    @Inject(TYPES.ISingleClientService) private readonly singleclientService: ISingleClientService,
    @Inject(TYPES.IContextService)
    private readonly contextService: IContextService,
    private readonly singleclientRepository: SingleClientRepository,
    private readonly selectedCartItemRepository: SelectedCartItemRepository,
    private readonly orderMapper: OrderMapper,
    private readonly selectedItemMapper: SelectedCartItemMapper,
    private readonly cartItemMapper: CartItemMapper,
    @Inject(TYPES.ICartItemRepository) private readonly cartItemRepository: ICartItemRepository,
    @Inject(TYPES.IOrderStatusRepository) private readonly orderStatusRespository: IOrderStatusRespository,
    @Inject(TYPES.IOrderNoteService) private readonly orderNoteService: IOrderNoteService,
    @Inject(TYPES.IOrderProcessingQueueService)
    private readonly OrderProcessingQueueService: IOrderProcessingQueueService,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {
    this.context = this.contextService.getContext();
  }

  async createOrder(orderSummary: CreateOrderDTO): Promise<Result<IOrderResponseDTO>> {
    await this.singleclientService.validateContext();
    const { state, type, singleClientId, total, cartItems, summary, restaurantId, paymentMethod, paymentStatus } = orderSummary;

    // Validate restaurant exists and get payment timing setting
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throwApplicationError(HttpStatus.NOT_FOUND, `Restaurant with id ${restaurantId} does not exist`);
    }

    // Validate payment based on restaurant's paymentTiming setting
    if (restaurant.paymentTiming === 'pay_at_first') {
      // For pay_at_first, payment is REQUIRED before creating order
      if (!paymentMethod || !paymentStatus) {
        throwApplicationError(
          HttpStatus.BAD_REQUEST,
          'Payment is required before placing an order at this restaurant. Please provide paymentMethod and paymentStatus.'
        );
      }
      // Ensure payment status is 'paid' for pay_at_first
      if (paymentStatus !== 'paid') {
        throwApplicationError(
          HttpStatus.BAD_REQUEST,
          'Payment must be completed (status: paid) before placing an order at this restaurant.'
        );
      }
    }
    // For pay_at_last, payment is optional (can be made after order is served)

    const orderDuplicate = await this.orderRepository.getDuplicateOrder(type, singleClientId, cartItems);
    if (orderDuplicate) {
      throwApplicationError(HttpStatus.NOT_FOUND, 'Duplicate order detected. Please confirm.');
    }
    const validateSingleClient: Result<SingleClient> = await this.singleclientRepository.findOne({
      where: { id: singleClientId },
    });
    if (!validateSingleClient.isSuccess) {
      throwApplicationError(HttpStatus.NOT_FOUND, `SingleClient does not exist`);
    }
    // Session handling removed for TypeORM
    try {
      const audit: Audit = Audit.createInsertContext(this.context);
      const getOrderStatus = await this.orderStatusRespository.findOne({ where: { code: state.toUpperCase() } });
      if (!getOrderStatus) {
        throwApplicationError(HttpStatus.INTERNAL_SERVER_ERROR, `Order status not found`);
      }
      const orderStatus = getOrderStatus.getValue();
      const order: Order = Order.create({
        orderStatusId: orderStatus.id,
        type,
        subtotal: total,
        serviceCharge: 0,
        tax: 0,
        total,
        singleclientId: singleClientId,
        summary,
        audit,
      });
      const orderModel = this.orderMapper.toPersistence(order);
      const orderToSave: Result<Order> = await this.orderRepository.createOrder(orderModel);
      const savedOrder = orderToSave.getValue();
      const orderId = savedOrder.id;
      if (cartItems?.length) {
        // Recalculate total if discount is present on any menu item
        // This ensures the backend enforces discounts even if the frontend doesn't calculate them
        let recalculatedTotal = 0;
        const menuIds = cartItems.flatMap(item => item.selectedItems?.map(si => si.menuId) || []);
        const menus = await this.restaurantRepository.manager.find(Menu, {
          where: { id: In(menuIds) }
        });
        const menuMap = new Map(menus.map(m => [m.id, m]));

        const items = cartItems.map((item) => {
          // In the legacy structure, price and quantity come from selectedItems
          // We calculate the discounted total for each cart item
          let cartItemTotal = 0;

          if (item.selectedItems?.length) {
            item.selectedItems.forEach(selectedItem => {
              const menu = menuMap.get(selectedItem.menuId);
              let unitPrice = Number(selectedItem.price || menu?.price || 0);
              const discount = Number(menu?.discount || 0);

              if (discount > 0) {
                const discountAmount = (unitPrice * discount) / 100;
                unitPrice = parseFloat((unitPrice - discountAmount).toFixed(2));
              }

              // Update the selected item price in the DTO so it gets saved correctly
              selectedItem.price = unitPrice;
              cartItemTotal += unitPrice * (selectedItem.quantity || 1);
            });
          }

          recalculatedTotal += cartItemTotal;

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { selectedItems, ...otherItemProperties } = item;
          return CartItem.create({
            ...otherItemProperties,
            total: cartItemTotal,
            orderId,
            audit
          });
        });

        const cartItemDataModels = items.map((item) => this.cartItemMapper.toPersistence(item));
        const savedCartItems: Result<CartItem[]> = await this.cartItemRepository.insertMany(cartItemDataModels);
        const savedItems = savedCartItems.getValue();
        savedOrder.cartItems = savedItems;
        savedOrder.state = orderStatus;

        // If recalculated total is different, update the order
        if (recalculatedTotal > 0 && Math.abs(recalculatedTotal - total) > 0.01) {
          savedOrder.total = recalculatedTotal;
        }

        const orderWithCartItems = await this.orderRepository.updateOne(
          { id: orderId },
          this.orderMapper.toPersistence(savedOrder),
        );
        if (!orderWithCartItems.isSuccess) {
          throwApplicationError(HttpStatus.INTERNAL_SERVER_ERROR, `Error while creating order`);
        }

        const cartItemMap = savedItems.reduce((map, item) => {
          map.set(item.menuId, item.id);
          return map;
        }, new Map<string, string>());

        const flattenedSelectedItems = cartItems.flatMap((item) => item.selectedItems);
        flattenedSelectedItems.forEach((item) => {
          if (cartItemMap.has(item.menuId)) {
            const cartItemId = cartItemMap.get(item.menuId);
            item.cartItemId = cartItemId;
          }
        });
        const selectedItems = flattenedSelectedItems.map((item) =>
          SelectedCartItem.create({
            ...item,
            cartItemId: item.cartItemId,
            itemId: item.itemId,
            menuId: item.menuId,
            audit,
          }),
        );
        const selectedCartItemsDataModel = selectedItems.map((item) => this.selectedItemMapper.toPersistence(item));
        const insertedItems: Result<string[]> = await this.selectedCartItemRepository.insertMany(
          selectedCartItemsDataModel,
        );
        if (!insertedItems.isSuccess) {
          throwApplicationError(HttpStatus.INTERNAL_SERVER_ERROR, `Could not create an order`);
        }
        const notes = await this.createOrderNotes(cartItems, orderId);
        const notesToSave: OrderNote[] = notes || [];
        const response: IOrderResponseDTO | undefined = OrderParser.createOrderResponse(savedOrder, notesToSave);
        const savedSelectedItemIds = insertedItems.getValue();
        let savedSelectedItems: SelectedCartItem[];
        if (savedSelectedItemIds.length) {
          const result = await this.selectedCartItemRepository.find({ where: { id: In(savedSelectedItemIds) } });
          if (result.isSuccess) {
            savedSelectedItems = result.getValue();
          }
        }
        const savedItemsMap = savedSelectedItems.reduce((map, item) => {
          const cartItemIdToString = item.cartItemId;
          !map.has(cartItemIdToString) ? map.set(cartItemIdToString, [item]) : map.get(cartItemIdToString).push(item);
          return map;
        }, new Map<string, SelectedCartItem[]>());
        savedItems.forEach((item) => {
          if (savedItemsMap.has(item.id)) {
            item.selectedItems = savedItemsMap.get(item.id);
          }
        });
        await this.cartItemRepository.updateCartItemSelectedItems(savedItems);

        // Create payment record if payment details are provided
        if (paymentMethod && paymentStatus) {
          const payment = this.paymentRepository.create({
            orderId,
            method: paymentMethod as any,
            amount: total,
            status: paymentStatus as any,
          });
          await this.paymentRepository.save(payment);
        }

        await this.createOrderStatusQueue(orderStatus.id, orderId);
        // Transaction committed
        return Result.ok(response);
      }
    } catch (error) {
      console.error(error);
      // Transaction aborted
      return Result.fail('An error occurred during order creation.', HttpStatus.BAD_REQUEST);
    }
  }

  async getOrdersBasic(): Promise<IOrderResponseDTO[]> {
    const result = await this.orderRepository.getOrders();
    const response = OrderParser.createOrdersResponse(result.getValue());
    return response;
  }

  async createOrderNotes(cartItems: CreateCartItemsDTO[], orderId: string): Promise<OrderNote[]> {
    const orderNotes: { menuId: string; note: string; orderId: string }[] = [];
    cartItems.forEach(({ menuId, note }: CreateCartItemsDTO) => {
      if (note?.length) {
        orderNotes.push({
          menuId,
          note: note,
          orderId: orderId,
        });
      }
    });

    if (orderNotes.length) {
      const notes = await this.orderNoteService.createNotes(orderNotes);
      return notes.getValue();
    }
  }

  async createOrderStatusQueue(orderStatusId: string, orderId: string) {
    return this.OrderProcessingQueueService.createQueue({ orderStatusId, orderId });
  }
}
