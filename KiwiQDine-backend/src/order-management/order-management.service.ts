import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In, Brackets } from 'typeorm';
import { Order, OrderItem, Restaurant, Customer, Menu, Table, TableStatus, Payment, PaymentMethod, PaymentStatus, Addon, OrderItemAddon, OrderAction, UserRole } from '../infrastructure/database/entities';
import { OrderStatus as OrderStatusEnum } from '../infrastructure/database/entities/order.entity';
import { OrderActivityLogService } from '../order-status/order-activity-log.service';
import { CreateOrderDto, UpdateOrderDto, ProcessPaymentDto, UpdateOrderItemStatusDto } from './dto/order-management.dto';
import { OrderStatusGateway } from '../order-status/order-status.gateway';
import { TYPES } from '../application/constants';
import { ISubscriptionService } from '../subscription/subscription-service.interface';
import { PaginationDto, PaginationResponse } from '../shared/dto/pagination.dto';

@Injectable()
export class OrderManagementService {
  private readonly logger = new Logger(OrderManagementService.name);
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Addon)
    private addonRepository: Repository<Addon>,
    @InjectRepository(OrderItemAddon)
    private orderItemAddonRepository: Repository<OrderItemAddon>,
    private orderStatusGateway: OrderStatusGateway,
    @Inject(TYPES.ISubscriptionService)
    private readonly subscriptionService: ISubscriptionService,
    private readonly orderActivityLogService: OrderActivityLogService,
    @Inject('OrderAlertsService')
    private readonly orderAlertsService: any, // Optional - will be injected if module is imported
  ) { }

  async createOrder(createOrderDto: CreateOrderDto, user: any): Promise<Order> {
    const { restaurantId, tableNo, tableId, orderItems, paymentMethod, orderType, customerName, notes, vehicleModel, vehicleNumber } = createOrderDto;

    // Use customerId if provided, otherwise fallback to phone
    const customerId = createOrderDto.customerId || createOrderDto.phone;

    if (!customerId) {
      throw new BadRequestException('Customer ID or Phone number is required');
    }

    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Check subscription limits before creating order
    const subscriptionCheck = await this.subscriptionService.canRestaurantCreateOrder(restaurantId);
    if (!subscriptionCheck.allowed) {
      this.logger.warn(`Order creation blocked for restaurant ${restaurantId}: ${subscriptionCheck.reason}`);
      throw new ForbiddenException(
        subscriptionCheck.reason || 'Order limit reached for current subscription plan'
      );
    }

    // DEBUG: Log restaurant settings
    this.logger.log(`[DEBUG] Restaurant ${restaurantId} settings:`);
    this.logger.log(`  - paymentTiming: ${restaurant.paymentTiming}`);
    this.logger.log(`  - requireWaiterConfirmation: ${restaurant.requireWaiterConfirmation}`);
    this.logger.log(`  - requireWaiterConfirmation type: ${typeof restaurant.requireWaiterConfirmation}`);


    // Determine actual order type (with fallback logic)
    // If orderType is explicitly provided, use it
    // Otherwise: if table is provided, default to 'dine_in', else 'takeaway'
    const actualOrderType = orderType || (tableId || tableNo ? 'dine_in' : 'takeaway');

    // Determine initial order status based on restaurant payment timing, waiter confirmation setting, and order type
    // CRITICAL RULES:
    // 1. Parking orders: NEVER need waiter confirmation (customers select & pay themselves)
    // 2. Takeaway orders: NEVER need waiter confirmation (customers select & pay themselves)
    // 3. Dine-in at pay-last restaurants: ONLY case where requireWaiterConfirmation matters
    // 4. Dine-in at pay-first restaurants: Always PENDING until payment, then auto-confirm
    // Flow:
    // 1. Parking/Takeaway: Always PENDING (needs payment first), auto-confirm after payment
    // 2. Dine-in + pay_at_first: PENDING (needs payment first), auto-confirm after payment
    // 3. Dine-in + pay_at_last + requireWaiterConfirmation: PENDING (needs waiter verification)
    // 4. Dine-in + pay_at_last + !requireWaiterConfirmation: CONFIRMED (auto-confirm to kitchen)
    let initialStatus = OrderStatusEnum.PENDING;

    // Special handling for Parking and Takeaway - always PENDING initially (needs payment)
    if (actualOrderType === 'parking' || actualOrderType === 'takeaway') {
      initialStatus = OrderStatusEnum.PENDING;
      this.logger.log(`${actualOrderType} order - staying PENDING until payment is processed (no waiter confirmation needed)`);
    }
    // Dine-in orders - check restaurant payment timing
    else if (restaurant.paymentTiming === 'pay_at_first') {
      // For pay_at_first dine-in restaurants:
      // - Always PENDING initially (needs payment first)
      // - After payment: auto-confirm (no waiter confirmation for pay-first)
      initialStatus = OrderStatusEnum.PENDING;
      this.logger.log(`Dine-in order at pay_at_first restaurant - staying PENDING until payment (will auto-confirm after payment)`);
    } else if (restaurant.paymentTiming === 'pay_at_last') {
      // For pay_at_last dine-in restaurants:
      // - This is the ONLY case where requireWaiterConfirmation setting matters
      // - If enabled: waiter must manually confirm before sending to kitchen
      // - If disabled: auto-confirm immediately
      if (restaurant.requireWaiterConfirmation) {
        initialStatus = OrderStatusEnum.PENDING;
        this.logger.log(`Dine-in order at pay_at_last restaurant - staying PENDING for waiter confirmation`);
      } else {
        initialStatus = OrderStatusEnum.CONFIRMED;
        this.logger.log(`Dine-in order at pay_at_last restaurant - auto-confirmed (no waiter confirmation required)`);
      }
    }


    // Validate table if tableId is provided and update status to OCCUPIED
    let table: Table | null = null;
    if (tableId) {
      table = await this.tableRepository.findOne({
        where: { id: tableId, restaurantId },
      });

      if (!table) {
        throw new NotFoundException(`Table with ID ${tableId} not found for this restaurant`);
      }

      // Block orders from MAINTENANCE and RESERVED tables
      // Allow orders from AVAILABLE and OCCUPIED tables (multiple orders per table allowed)
      if (table.status === TableStatus.MAINTENANCE) {
        throw new BadRequestException('This table is currently under maintenance and is not available for orders.');
      }

      if (table.status === TableStatus.RESERVED) {
        throw new BadRequestException('This table is currently reserved and is not available for orders.');
      }

      // Update table status to OCCUPIED when order is created
      if (table.status === TableStatus.AVAILABLE) {
        table.status = TableStatus.OCCUPIED;
        await this.tableRepository.save(table);
        this.logger.log(`Table ${table.name} (ID: ${tableId}) status updated to OCCUPIED for new order`);
      }
    }

    // Validate or create customer
    // Flow: Customer authenticates via phone OTP → Customer account created during order
    // customerId can be either:
    // 1. Phone number (for authenticated customers - most common case)
    // 2. Customer UUID (for staff creating orders on behalf of existing customers)
    // Check if it's a valid UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);

    let customer: Customer | null = null;

    if (isUUID) {
      // Look up by customer ID (UUID)
      customer = await this.customerRepository.findOne({
        where: { id: customerId, restaurantId },
      });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${customerId} not found for this restaurant`);
      }
    } else {
      // Normalize phone number: Convert +94 to 0, remove spaces/dashes
      const normalizedPhone = this.normalizePhoneNumber(customerId);

      // Look up by phone number for THIS restaurant only
      customer = await this.customerRepository.findOne({
        where: { phone: normalizedPhone, restaurantId },
      });

      if (!customer) {
        // Create NEW customer for THIS restaurant with normalized phone
        this.logger.log(`Creating new customer for phone: ${normalizedPhone} (original: ${customerId}) at restaurant: ${restaurantId}`);
        customer = this.customerRepository.create({
          phone: normalizedPhone,
          name: customerName || 'Customer',
          restaurantId,
        });
        customer = await this.customerRepository.save(customer);
        this.logger.log(`Customer created: ${customer.name} (ID: ${customer.id}) for restaurant: ${restaurantId}`);
      }
    }

    // Calculate totals with variant pricing support
    let totalAmount = 0;
    const orderItemsToCreate = [];

    for (const orderItemDto of orderItems) {
      const menu = await this.menuRepository.findOne({
        where: { id: orderItemDto.menuId, restaurantId },
      });

      if (!menu) {
        throw new NotFoundException(`Menu item with ID ${orderItemDto.menuId} not found for this restaurant`);
      }

      if (!menu.isAvailable) {
        throw new BadRequestException(`Menu item ${menu.name} is currently unavailable`);
      }

      // Calculate correct price including variants and discounts
      const itemUnitPrice = this.calculateItemPrice(menu, orderItemDto.specialInstructions);
      this.logger.log(`[OrderMgmt] Calculated price for item ${menu.name}: ${itemUnitPrice} (Base: ${menu.price}, Discount: ${menu.discount}%)`);

      // Handle Addons - Independent quantity pricing
      let itemAddonsTotal = 0;
      const itemSelectedAddons = [];

      // Support both legacy addonIds and new structured selectedAddons
      const addonsToProcess = orderItemDto.selectedAddons ||
        (orderItemDto.addonIds?.map(id => ({ addonId: id, quantity: 1 })) || []);

      if (addonsToProcess && addonsToProcess.length > 0) {
        this.logger.log(`[OrderMgmt] Processing ${addonsToProcess.length} addons for item ${menu.name}`);
        for (const addonSelection of addonsToProcess) {
          const addon = await this.addonRepository.findOne({
            where: { id: addonSelection.addonId },
          });

          if (!addon) {
            this.logger.warn(`[OrderMgmt] Addon with ID ${addonSelection.addonId} not found in DB. Skipping.`);
            continue;
          }

          this.logger.log(`[OrderMgmt] Found addon: ${addon.name} (Price: ${addon.unitPrice})`);

          const addonUnitPrice = Number(addon.unitPrice);
          const addonQuantity = addonSelection.quantity || 1;
          const addonTotalPrice = addonUnitPrice * addonQuantity;

          itemAddonsTotal += addonTotalPrice;
          itemSelectedAddons.push({
            addonId: addon.id,
            name: addon.name,
            quantity: addonQuantity,
            unitPrice: addonUnitPrice,
            totalPrice: addonTotalPrice,
          });
        }
      } else {
        this.logger.log(`[OrderMgmt] No addons to process for item ${menu.name}`);
      }

      // Addon logic: Addons are independent of item quantity
      // Example: 1 Kothu ($500) + 2 Eggs ($50 each) = $500 + $100 = $600
      // Example: 2 Kothu ($500) + 2 Eggs ($50 each) = $1000 + $100 = $1100
      const recalculatedItemTotal = (itemUnitPrice * orderItemDto.quantity) + itemAddonsTotal;

      totalAmount += recalculatedItemTotal;

      this.logger.log(`[OrderMgmt] Item total: ${itemUnitPrice} x ${orderItemDto.quantity} + Addons: ${itemAddonsTotal} = ${recalculatedItemTotal}`);

      // Handle specialInstructions: serialize objects to JSON string, keep strings as-is
      // This ensures TypeORM can handle it properly (transformer will handle deserialization on read)
      let specialInstructionsValue: string | object | null = null;
      if (orderItemDto.specialInstructions !== undefined && orderItemDto.specialInstructions !== null) {
        if (typeof orderItemDto.specialInstructions === 'object') {
          // Serialize object to JSON string - transformer will handle deserialization when reading
          specialInstructionsValue = JSON.stringify(orderItemDto.specialInstructions);
        } else {
          // It's already a string, pass as-is
          specialInstructionsValue = orderItemDto.specialInstructions;
        }
      }

      orderItemsToCreate.push({
        menuId: menu.id,
        quantity: orderItemDto.quantity,
        unitPrice: itemUnitPrice,
        totalPrice: recalculatedItemTotal,
        specialInstructions: specialInstructionsValue,
        status: 'pending',
        selectedAddons: itemSelectedAddons,
        estimatedPreparationTime: menu.preparationTime || 0,
      });
    }

    // Calculate order totals with service charge
    const subtotal = totalAmount; // Items total before service charge
    const serviceCharge = this.calculateServiceCharge(subtotal, restaurant);
    const tax = 0; // For future use
    const discount = 0; // For future use
    const finalTotal = parseFloat((subtotal + serviceCharge + tax - discount).toFixed(2));

    this.logger.log(`Order pricing - Subtotal: ${subtotal}, Service Charge: ${serviceCharge}, Total: ${finalTotal}`);

    // Generate unique order number for this restaurant
    const orderNumber = await this.generateOrderNumber(restaurantId);

    // Determine who created the order (customer vs staff)
    const createdBy = user?.id || customer.id; // User ID if staff, Customer ID if customer portal
    const createdByType: 'customer' | 'staff' = user?.id ? 'staff' : 'customer';

    this.logger.log(`Order created by: ${createdByType} (ID: ${createdBy})`);

    // Create order
    const order = this.orderRepository.create({
      restaurantId,
      customerId: customer.id,
      tableNo: tableNo || null,
      tableId: tableId || null,
      orderType: actualOrderType,
      status: initialStatus,
      subtotal,
      serviceCharge,
      tax,
      discount,
      totalAmount: finalTotal,
      orderNumber,
      notes: notes || null, // Add customer notes to order
      vehicleModel: vehicleModel || null, // Optional - for parking orders
      vehicleNumber: vehicleNumber || null, // Optional - for parking orders
      createdBy,
      createdByType,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create Payment entity (paymentMethod is required for restaurant portal orders)
    // CASHIER: Payment PENDING (customer will pay at counter, cashier hasn't processed yet)
    // CASHIER_CASH/CASHIER_CARD/CASHIER_QR: Payment PAID (cashier already processed payment)
    // CASH/CARD/QR: Payment PAID (customer already paid online/kiosk)

    this.logger.log(`[PAYMENT CHECK] Payment Method: ${paymentMethod} (type: ${typeof paymentMethod})`);
    this.logger.log(`[PAYMENT CHECK] PaymentMethod.CASHIER: ${PaymentMethod.CASHIER}`);
    this.logger.log(`[PAYMENT CHECK] Comparison: ${paymentMethod} === ${PaymentMethod.CASHIER} = ${paymentMethod === PaymentMethod.CASHIER}`);

    const paymentStatus = paymentMethod === PaymentMethod.CASHIER
      ? PaymentStatus.PENDING
      : PaymentStatus.PAID;

    this.logger.log(`[PAYMENT CHECK] Determined Payment Status: ${paymentStatus}`);

    const payment = this.paymentRepository.create({
      orderId: savedOrder.id,
      method: paymentMethod,
      amount: finalTotal,
      status: paymentStatus,
    });
    await this.paymentRepository.save(payment);

    // CRITICAL: Auto-confirm orders if payment is PAID and no waiter confirmation needed
    // Auto-confirm for:
    // 1. Takeaway orders (always auto-confirm after payment)
    // 2. Parking orders (always auto-confirm after payment)
    // 3. Pay-first dine-in orders (always auto-confirm after payment)
    // Do NOT auto-confirm:
    // - Pay-last dine-in orders (may need waiter confirmation)

    this.logger.log(`[AUTO-CONFIRM CHECK] Order ${savedOrder.orderNumber}:`);
    this.logger.log(`  - Order Type: ${savedOrder.orderType}`);
    this.logger.log(`  - Payment Status: ${paymentStatus}`);
    this.logger.log(`  - Payment Method: ${paymentMethod}`);
    this.logger.log(`  - Restaurant Payment Timing: ${restaurant.paymentTiming}`);

    // Debug each condition separately
    this.logger.log(`[AUTO-CONFIRM DEBUG] Checking conditions:`);
    this.logger.log(`  - paymentStatus === PaymentStatus.PAID: ${paymentStatus} === ${PaymentStatus.PAID} = ${paymentStatus === PaymentStatus.PAID}`);
    this.logger.log(`  - orderType === 'takeaway': ${savedOrder.orderType} === 'takeaway' = ${savedOrder.orderType === 'takeaway'}`);
    this.logger.log(`  - orderType === 'parking': ${savedOrder.orderType} === 'parking' = ${savedOrder.orderType === 'parking'}`);
    this.logger.log(`  - orderType === 'dine_in': ${savedOrder.orderType} === 'dine_in' = ${savedOrder.orderType === 'dine_in'}`);
    this.logger.log(`  - paymentTiming === 'pay_at_first': ${restaurant.paymentTiming} === 'pay_at_first' = ${restaurant.paymentTiming === 'pay_at_first'}`);

    const shouldAutoConfirm = paymentStatus === PaymentStatus.PAID && (
      savedOrder.orderType === 'takeaway' ||
      savedOrder.orderType === 'parking' ||
      (savedOrder.orderType === 'dine_in' && restaurant.paymentTiming === 'pay_at_first')
    );

    this.logger.log(`  - Should Auto-Confirm: ${shouldAutoConfirm}`);

    if (shouldAutoConfirm) {
      savedOrder.status = OrderStatusEnum.CONFIRMED;
      await this.orderRepository.save(savedOrder);
      this.logger.log(`✅ Order ${savedOrder.orderNumber} (${savedOrder.orderType}) auto-confirmed after payment - no waiter confirmation needed`);
    } else {
      this.logger.log(`⏳ Order ${savedOrder.orderNumber} staying PENDING - payment status: ${paymentStatus}, order type: ${savedOrder.orderType}`);
    }

    // Create order items
    for (const itemData of orderItemsToCreate) {
      try {
        // specialInstructions is already serialized to JSON string if it was an object
        // The transformer will handle deserialization when reading from the database
        const specialInstructionsValue = itemData.specialInstructions !== undefined && itemData.specialInstructions !== null
          ? itemData.specialInstructions
          : null;

        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          menuId: itemData.menuId,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice: itemData.totalPrice,
          specialInstructions: specialInstructionsValue,
          status: itemData.status,
          estimatedPreparationTime: itemData.estimatedPreparationTime || 0,
          originalPreparationTime: itemData.estimatedPreparationTime || 0,
        });
        const savedOrderItem = await this.orderItemRepository.save(orderItem);

        // Save addons for this order item
        if (itemData.selectedAddons && itemData.selectedAddons.length > 0) {
          for (const addonData of itemData.selectedAddons) {
            const orderItemAddon = this.orderItemAddonRepository.create({
              orderItemId: savedOrderItem.id,
              orderItem: savedOrderItem, // Explicitly set relation
              addonId: addonData.addonId,
              // addon: addonData.addonEntity, // Ideally we would pass this if available
              quantity: addonData.quantity,
              unitPrice: addonData.unitPrice,
              totalPrice: addonData.totalPrice,
            });
            await this.orderItemAddonRepository.save(orderItemAddon);
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to create order item for menu ${itemData.menuId}`,
          error instanceof Error ? error.message : JSON.stringify(error),
          error instanceof Error ? error.stack : '',
        );
        throw new BadRequestException(
          `Failed to create order item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    const fullOrder = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: [
        'orderItems',
        'orderItems.menu',
        'orderItems.menu.category',
        'orderItems.orderItemAddons',
        'orderItems.orderItemAddons.addon',
        'customer',
        'restaurant',
        'table',
        'payments',
      ],
    });

    // Ensure orderNumber is present (fallback to savedOrder.orderNumber if fullOrder doesn't have it)
    if (fullOrder && !fullOrder.orderNumber && savedOrder.orderNumber) {
      fullOrder.orderNumber = savedOrder.orderNumber;
    }

    // Broadcast new order via WebSocket
    await this.orderStatusGateway.broadcastNewOrder(fullOrder);
    await this.orderStatusGateway.broadcastOrderStatusUpdate(savedOrder.id, {
      status: initialStatus,
      order: fullOrder,
      updatedAt: new Date(),
    });

    // Track subscription usage
    try {
      await this.subscriptionService.recordOrderUsage(
        restaurantId,
        savedOrder.createdAt ?? new Date(),
        1,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.warn(
        `Failed to record subscription usage for restaurant ${restaurantId}: ${errorMessage}`,
      );
    }

    // Log action
    await this.orderActivityLogService.logAction(
      savedOrder.id,
      OrderAction.CREATED,
      user?.id,
      `Order created via ${savedOrder.createdByType}`
    );

    if (savedOrder.status === OrderStatusEnum.CONFIRMED) {
      const confirmReason = paymentStatus === PaymentStatus.PAID
        ? `Auto-confirmed after payment (${savedOrder.orderType})`
        : 'Auto-confirmed based on restaurant payment timing (pay-last dine-in)';

      await this.orderActivityLogService.logAction(
        savedOrder.id,
        OrderAction.CONFIRMED,
        user?.id,
        confirmReason
      );
    }

    // Send immediate alert for new order (if alert service is available)
    try {
      if (this.orderAlertsService) {
        await this.orderAlertsService.sendNewOrderAlert(fullOrder);
      }
    } catch (error) {
      this.logger.warn('Failed to send new order alert:', error);
    }

    return this.formatOrderWithGroupedItems(fullOrder);
  }

  async findAll(filters: any, user: any, pagination: PaginationDto = { page: 1, limit: 10 }): Promise<PaginationResponse<any>> {
    try {
      const page = pagination.page || 1;
      const limit = Math.min(pagination.limit || 10, 100); // Max 100 items per page
      const skip = (page - 1) * limit;

      // Build query using QueryBuilder for payment status filtering
      const queryBuilder = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.orderItems', 'orderItems')
        .leftJoinAndSelect('orderItems.menu', 'menu')
        .leftJoinAndSelect('menu.category', 'category')
        .leftJoinAndSelect('orderItems.orderItemAddons', 'orderItemAddons')
        .leftJoinAndSelect('orderItemAddons.addon', 'addon')
        .leftJoinAndSelect('order.customer', 'customer')
        .leftJoinAndSelect('order.restaurant', 'restaurant')
        .leftJoinAndSelect('order.payments', 'payments')
        .leftJoinAndSelect('order.ratings', 'ratings');

      // Apply restaurant filter - required for non-super-admin users
      if (filters.restaurantId) {
        queryBuilder.andWhere('order.restaurantId = :restaurantId', { restaurantId: filters.restaurantId });
      } else if (user.restaurantId) {
        queryBuilder.andWhere('order.restaurantId = :restaurantId', { restaurantId: user.restaurantId });
      } else if (user.role !== 'super_admin') {
        throw new BadRequestException('Restaurant ID is required for non-admin users');
      }

      // Apply status filter
      if (filters.status) {
        queryBuilder.andWhere('order.status = :status', { status: filters.status });
      }

      // Apply order type filter
      if (filters.orderType) {
        queryBuilder.andWhere('order.orderType = :orderType', { orderType: filters.orderType });
      }

      // Apply payment status filter
      // Logic: Filter orders where the NEWEST payment record matches the status
      if (filters.paymentStatus) {
        queryBuilder.andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('p1.id')
            .from(Payment, 'p1')
            .where('p1.orderId = order.id')
            .andWhere('p1.status = :paymentStatus')
            // Ensure no newer payment exists for this order
            .andWhere((qb2) => {
              const newerSubQuery = qb2
                .subQuery()
                .select('p2.id')
                .from(Payment, 'p2')
                .where('p2.orderId = p1.orderId')
                .andWhere('p2.createdAt > p1.createdAt')
                .getQuery();
              return `NOT EXISTS ${newerSubQuery}`;
            })
            .getQuery();
          return `EXISTS ${subQuery}`;
        });
        queryBuilder.setParameter('paymentStatus', filters.paymentStatus);
      }

      // Apply payment method filter
      // Logic: Filter orders where the NEWEST payment record matches the method
      if (filters.paymentMethod) {
        queryBuilder.andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('pm1.id')
            .from(Payment, 'pm1')
            .where('pm1.orderId = order.id')
            .andWhere('pm1.method = :paymentMethod')
            // Ensure no newer payment exists for this order
            .andWhere((qb2) => {
              const newerSubQuery = qb2
                .subQuery()
                .select('pm2.id')
                .from(Payment, 'pm2')
                .where('pm2.orderId = pm1.orderId')
                .andWhere('pm2.createdAt > pm1.createdAt')
                .getQuery();
              return `NOT EXISTS ${newerSubQuery}`;
            })
            .getQuery();
          return `EXISTS ${subQuery}`;
        });
        queryBuilder.setParameter('paymentMethod', filters.paymentMethod);
      }

      // Apply hold status filter
      if (filters.isHold !== undefined) {
        queryBuilder.andWhere('order.isOnHold = :isOnHold', { isOnHold: filters.isHold });
      }

      // Apply date filter using ISO date format
      // Support both single date filter and date range (startDate/endDate)
      if (filters.date) {
        // Single date filter - filter orders for a specific day
        const filterDate = new Date(filters.date);
        const isoDate = filterDate.toISOString().split('T')[0]; // Get YYYY-MM-DD format

        const startDate = new Date(`${isoDate}T00:00:00.000Z`);
        const endDate = new Date(`${isoDate}T23:59:59.999Z`);

        queryBuilder.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (filters.startDate || filters.endDate) {
        // Date range filter - filter orders between startDate and endDate
        if (filters.startDate && filters.endDate) {
          // Both startDate and endDate provided
          const start = new Date(filters.startDate);
          const end = new Date(filters.endDate);

          const startDateTime = new Date(`${start.toISOString().split('T')[0]}T00:00:00.000Z`);
          const endDateTime = new Date(`${end.toISOString().split('T')[0]}T23:59:59.999Z`);

          queryBuilder.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
            startDate: startDateTime,
            endDate: endDateTime,
          });
        } else if (filters.startDate) {
          // Only startDate provided - filter from startDate onwards
          const start = new Date(filters.startDate);
          const startDateTime = new Date(`${start.toISOString().split('T')[0]}T00:00:00.000Z`);

          queryBuilder.andWhere('order.createdAt >= :startDate', {
            startDate: startDateTime,
          });
        } else if (filters.endDate) {
          // Only endDate provided - filter up to endDate
          const end = new Date(filters.endDate);
          const endDateTime = new Date(`${end.toISOString().split('T')[0]}T23:59:59.999Z`);

          queryBuilder.andWhere('order.createdAt <= :endDate', {
            endDate: endDateTime,
          });
        }
      }

      // Apply ordering and pagination
      queryBuilder
        .orderBy('order.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      const [orders, total] = await queryBuilder.getManyAndCount();

      // Format orders with items grouped by category
      const formattedOrders = orders.map(order => this.formatOrderWithGroupedItems(order));

      return {
        data: formattedOrders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error fetching orders:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Format order with items grouped by category
   */
  private formatOrderWithGroupedItems(order: Order): any {
    // Get payment method from the most recent payment
    const latestPayment = order.payments && order.payments.length > 0
      ? order.payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null;

    // Check if order has a review (rating) - only ratings specifically for this order
    // Filter out ratings that are for the restaurant in general (orderId is null)
    const orderSpecificRatings = order.ratings?.filter(r => r.orderId === order.id) || [];
    const hasReview = orderSpecificRatings.length > 0;
    const review = hasReview ? orderSpecificRatings[0] : null;

    if (!order.orderItems || order.orderItems.length === 0) {
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        tableNo: order.tableNo,
        customerName: order.customer?.name || 'Customer',
        customerPhone: order.customer?.phone || null,
        customer: order.customer
          ? {
            id: order.customer.id,
            name: order.customer.name,
            phone: order.customer.phone,
          }
          : null,
        orderType: order.orderType || null,
        status: order.status,
        isOnHold: order.isOnHold || false,
        holdReason: order.holdReason || null,
        notes: order.notes || null,
        vehicleModel: order.vehicleModel || null,
        vehicleNumber: order.vehicleNumber || null,
        subtotal: order.subtotal || 0,
        serviceCharge: order.serviceCharge || 0,
        tax: order.tax || 0,
        discount: order.discount || 0,
        totalAmount: order.totalAmount,
        paymentMethod: latestPayment?.method || null,
        paymentStatus: latestPayment?.status || null,
        amountTendered: latestPayment?.amountTendered || null,
        changeReturned: latestPayment?.changeReturned || null,
        restaurant: order.restaurant
          ? {
            id: order.restaurant.id,
            name: order.restaurant.name,
          }
          : null,
        itemsByCategory: [],
        hasReview,
        review: review ? {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        } : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    }

    // Group items by category
    const itemsByCategory: Record<string, any[]> = {};

    order.orderItems.forEach((item) => {
      const categoryName = item.menu?.category?.name || 'Uncategorized';
      if (!itemsByCategory[categoryName]) {
        itemsByCategory[categoryName] = [];
      }

      itemsByCategory[categoryName].push({
        id: item.id,
        menuId: item.menuId,
        menuName: item.menu?.name || 'Unknown',
        menuImage: item.menu?.image || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        specialInstructions: item.specialInstructions,
        status: item.status,
        startedAt: item.startedAt,
        readyAt: item.readyAt,
        estimatedPreparationTime: item.estimatedPreparationTime,
        originalPreparationTime: item.originalPreparationTime,
        category: categoryName,
        addons: item.orderItemAddons?.map(oa => ({
          id: oa.id,
          addonId: oa.addonId,
          name: oa.addon?.name || 'Unknown Addon',
          quantity: oa.quantity,
          unitPrice: oa.unitPrice,
          totalPrice: oa.totalPrice,
        })) || [],
      });
    });

    // Convert to array format
    const categoryGroups = Object.keys(itemsByCategory).map(categoryName => ({
      category: categoryName,
      items: itemsByCategory[categoryName],
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      tableNo: order.tableNo,
      customerName: order.customer?.name || 'Customer',
      customerPhone: order.customer?.phone || null,
      customer: order.customer
        ? {
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
        }
        : null,
      orderType: order.orderType || null,
      status: order.status,
      isOnHold: order.isOnHold || false,
      holdReason: order.holdReason || null,
      notes: order.notes || null,
      vehicleModel: order.vehicleModel || null,
      vehicleNumber: order.vehicleNumber || null,
      subtotal: order.subtotal || 0,
      serviceCharge: order.serviceCharge || 0,
      tax: order.tax || 0,
      discount: order.discount || 0,
      totalAmount: order.totalAmount,
      paymentMethod: latestPayment?.method || null,
      paymentStatus: latestPayment?.status || null,
      amountTendered: latestPayment?.amountTendered || null,
      changeReturned: latestPayment?.changeReturned || null,
      restaurant: order.restaurant
        ? {
          id: order.restaurant.id,
          name: order.restaurant.name,
        }
        : null,
      itemsByCategory: categoryGroups,
      itemsProgress: (() => {
        const allItems = order.orderItems || [];
        const totalItems = allItems.length;
        const itemsByStatus = {
          pending: allItems.filter(i => i.status === 'pending').length,
          in_progress: allItems.filter(i => i.status === 'in_progress').length,
          ready: allItems.filter(i => i.status === 'ready').length,
          served: allItems.filter(i => i.status === 'served').length,
        };

        const activeItems = allItems.map(item => {
          const elapsed = item.startedAt
            ? Math.floor((new Date().getTime() - new Date(item.startedAt).getTime()) / 1000 / 60)
            : 0;
          const remaining = (item.status === 'ready' || item.status === 'served')
            ? 0
            : Math.max(0, (item.estimatedPreparationTime || 0) - elapsed);
          return { status: item.status, remaining };
        });

        const maxRemainingTime = activeItems.length > 0
          ? Math.max(...activeItems.filter(i => i.status !== 'ready' && i.status !== 'served').map(i => i.remaining))
          : 0;

        const progressPercentage = totalItems > 0
          ? Math.round(((itemsByStatus.in_progress + itemsByStatus.ready + itemsByStatus.served) / totalItems) * 100)
          : 0;

        return {
          total: totalItems,
          byStatus: itemsByStatus,
          progressPercentage,
          maxRemainingTime: maxRemainingTime === -Infinity ? 0 : maxRemainingTime,
          estimatedOrderReadyTime: maxRemainingTime > 0
            ? new Date(new Date().getTime() + maxRemainingTime * 60000)
            : null,
        };
      })(),
      hasReview,
      review: review ? {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      } : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async getCashierPendingOrders(
    restaurantId: string,
    orderType?: string,
    date?: string,
    customerName?: string,
    tableNo?: string,
    orderNumber?: string,
    pagination: PaginationDto = { page: 1, limit: 10 }
  ): Promise<PaginationResponse<any>> {
    this.logger.log(`Getting cashier pending orders for restaurant ${restaurantId}, orderType: ${orderType}, date: ${date}, customerName: ${customerName}, tableNo: ${tableNo}, orderNumber: ${orderNumber}, page: ${pagination.page}, limit: ${pagination.limit}`);

    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 10, 100);

    this.logger.log(`[CASHIER PENDING] Query started for restaurant: ${restaurantId}`);

    // Build base query for orders ready for payment
    // TWO DIFFERENT FLOWS:
    // 1. TAKEAWAY/PARKING (pay-first): Show PENDING/CONFIRMED orders (payment needed BEFORE kitchen)
    // 2. DINE-IN (pay-last): Show SERVED/READY orders (payment needed AFTER eating)
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.menu', 'menu')
      .leftJoinAndSelect('menu.category', 'category')
      .leftJoinAndSelect('orderItems.orderItemAddons', 'orderItemAddons')
      .leftJoinAndSelect('orderItemAddons.addon', 'addon')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.payments', 'payments')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.ratings', 'ratings')
      .where('order.restaurantId = :restaurantId', { restaurantId: restaurantId.trim() })
      .andWhere(
        new Brackets((qb) => {
          qb
            // Takeaway/Parking: Show PENDING or CONFIRMED orders (pay before cooking)
            .where("(order.orderType IN ('takeaway', 'parking') AND order.status IN (:...beforeKitchenStatuses))", {
              beforeKitchenStatuses: [OrderStatusEnum.PENDING, OrderStatusEnum.CONFIRMED]
            })
            // Dine-in: Show SERVED or READY orders (pay after eating)
            .orWhere("(order.orderType = 'dine_in' AND order.status IN (:...afterEatingStatuses))", {
              afterEatingStatuses: [OrderStatusEnum.SERVED, OrderStatusEnum.READY]
            });
        })
      );

    // Filter by order type if provided
    if (orderType && orderType.trim() !== '') {
      queryBuilder.andWhere('order.orderType = :orderType', { orderType });
    }

    // Filter by date if provided
    if (date && date.trim() !== '') {
      const filterDate = new Date(date);
      if (!isNaN(filterDate.getTime())) {
        const isoDate = filterDate.toISOString().split('T')[0];
        const startOfDay = new Date(`${isoDate}T00:00:00.000Z`);
        const endOfDay = new Date(`${isoDate}T23:59:59.999Z`);
        queryBuilder.andWhere('order.createdAt BETWEEN :startOfDay AND :endOfDay', {
          startOfDay,
          endOfDay,
        });
        this.logger.log(`[CASHIER PENDING] Date filter applied: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
      }
    }

    // Filter by customer name (partial match, case-insensitive)
    if (customerName && customerName.trim() !== '') {
      queryBuilder.andWhere('LOWER(customer.name) LIKE LOWER(:customerName)', {
        customerName: `%${customerName.trim()}%`
      });
      this.logger.log(`[CASHIER PENDING] Customer name filter applied: ${customerName}`);
    }

    // Filter by table number
    if (tableNo && tableNo.trim() !== '') {
      queryBuilder.andWhere('order.tableNo = :tableNo', { tableNo: tableNo.trim() });
      this.logger.log(`[CASHIER PENDING] Table number filter applied: ${tableNo}`);
    }

    // Filter by order number (partial match)
    if (orderNumber && orderNumber.trim() !== '') {
      queryBuilder.andWhere('LOWER(order.orderNumber) LIKE LOWER(:orderNumber)', {
        orderNumber: `%${orderNumber.trim()}%`
      });
      this.logger.log(`[CASHIER PENDING] Order number filter applied: ${orderNumber}`);
    }

    // Get all orders that are ready for payment (SERVED or READY status)
    const allOrders = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .getMany();

    this.logger.log(`[CASHIER PENDING] Found ${allOrders.length} orders with SERVED/READY status before payment filtering`);

    // Filter orders based on payment status
    // Only include orders where payment is PENDING (not yet paid)
    // Exclude orders that have already been paid
    const pendingPaymentOrders = allOrders.filter(order => {
      this.logger.log(`[CASHIER PENDING DEBUG] Order ${order.orderNumber} - payments array: ${JSON.stringify(order.payments?.map(p => ({id: p.id, status: p.status, createdAt: p.createdAt})))}`);

      // If no payments, include it (pay later scenario)
      if (!order.payments || order.payments.length === 0) {
        this.logger.log(`[CASHIER PENDING] Order ${order.orderNumber} - NO PAYMENTS (included)`);
        return true;
      }

      // Get the latest payment by sorting by createdAt
      const sortedPayments = [...order.payments].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestPayment = sortedPayments[0];

      // Include if latest payment is NOT paid
      const shouldInclude = latestPayment.status !== PaymentStatus.PAID;
      this.logger.log(`[CASHIER PENDING] Order ${order.orderNumber} - Latest payment status: ${latestPayment.status} (PaymentStatus.PAID=${PaymentStatus.PAID}, shouldInclude=${shouldInclude})`);
      return shouldInclude;
    });

    this.logger.log(`[CASHIER PENDING] After payment filtering: ${pendingPaymentOrders.length} orders`);

    // Apply pagination to filtered results
    const skip = (page - 1) * limit;
    const paginatedOrders = pendingPaymentOrders.slice(skip, skip + limit);
    const total = pendingPaymentOrders.length;

    // Format response
    const formattedOrders = paginatedOrders.map(order => this.formatOrderWithGroupedItems(order));

    this.logger.log(`[CASHIER PENDING] Returning ${formattedOrders.length} orders (page ${page} of ${Math.ceil(total / limit)})`);

    return {
      data: formattedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: any): Promise<Order> {
    const whereCondition: any = { id };

    // For non-super-admin users, filter by restaurantId
    if (user.role !== 'super_admin' && user.restaurantId) {
      whereCondition.restaurantId = user.restaurantId;
    }

    const order = await this.orderRepository.findOne({
      where: whereCondition,
      relations: [
        'orderItems',
        'orderItems.menu',
        'orderItems.menu.category',
        'orderItems.orderItemAddons',
        'orderItems.orderItemAddons.addon',
        'customer',
        'restaurant',
        'table',
        'payments',
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Additional check: ensure non-super-admin users can only access their restaurant's orders
    if (user.role !== 'super_admin' && user.restaurantId && order.restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Access denied: Order does not belong to your restaurant');
    }

    // Log view action for staff members
    if (user && user.id && user.role !== 'customer') {
      await this.orderActivityLogService.logAction(id, OrderAction.VIEWED, user.id);
    }

    return this.formatOrderWithGroupedItems(order);
  }

  /**
   * Public endpoint - Find orders by customer phone number
   * No authentication required
   * Used for customer portal when they scan QR code
   */
  async findOrdersByCustomerPhone(phone: string, restaurantId?: string): Promise<Order[]> {
    // Normalize phone number (remove spaces, dashes, parentheses)
    const normalizePhone = (phoneNum: string) => phoneNum.replace(/[\s\-\(\)+]/g, '');
    const normalizedPhone = normalizePhone(phone);

    // Build query - search directly by phone number to handle restaurant-scoped customers
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.menu', 'menu')
      .leftJoinAndSelect('menu.category', 'category')
      .leftJoinAndSelect('orderItems.orderItemAddons', 'orderItemAddons')
      .leftJoinAndSelect('orderItemAddons.addon', 'addon')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.payments', 'payments')
      .leftJoinAndSelect('order.ratings', 'ratings')
      .where('customer.phone = :phone', { phone });

    // Optional: Filter by restaurant (for single restaurant view)
    if (restaurantId) {
      queryBuilder.andWhere('order.restaurantId = :restaurantId', { restaurantId });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('order.createdAt', 'DESC');

    let orders = await queryBuilder.getMany();

    // If no orders found with exact phone match, try normalized phone matching
    if (orders.length === 0) {
      const allOrdersQuery = this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.orderItems', 'orderItems')
        .leftJoinAndSelect('orderItems.menu', 'menu')
        .leftJoinAndSelect('menu.category', 'category')
        .leftJoinAndSelect('orderItems.orderItemAddons', 'orderItemAddons')
        .leftJoinAndSelect('orderItemAddons.addon', 'addon')
        .leftJoinAndSelect('order.customer', 'customer')
        .leftJoinAndSelect('order.restaurant', 'restaurant')
        .leftJoinAndSelect('order.table', 'table')
        .leftJoinAndSelect('order.payments', 'payments')
        .leftJoinAndSelect('order.ratings', 'ratings')
        .orderBy('order.createdAt', 'DESC');

      // Add restaurant filter if provided
      if (restaurantId) {
        allOrdersQuery.where('order.restaurantId = :restaurantId', { restaurantId });
      }

      const allOrders = await allOrdersQuery.getMany();

      orders = allOrders.filter(order =>
        order.customer && normalizePhone(order.customer.phone) === normalizedPhone
      );
    }

    // Format orders with grouped items
    return orders.map(order => this.formatOrderWithGroupedItems(order));
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, user: any): Promise<any> {
    try {
      // Ensure the user has access to this order (restaurant scoping, etc.)
      await this.findOne(id, user);

      let activeOrder = await this.orderRepository.findOne({
        where: { id },
        relations: ['orderItems', 'orderItems.menu', 'orderItems.menu.category', 'orderItems.orderItemAddons', 'customer', 'restaurant', 'table', 'payments'],
      });

      if (!activeOrder) {
        throw new NotFoundException('Order not found');
      }

      // Track activeOrder data for use throughout the method
      let activeOrderRef = activeOrder;
      let activeRestaurant = activeOrder.restaurant;
      let activeOrderId = activeOrder.id;

      // Prevent updates for completed/cancelled orders
      if (activeOrder.status === OrderStatusEnum.COMPLETED || activeOrder.status === OrderStatusEnum.CANCELLED) {
        throw new BadRequestException(`Cannot update an order with status: ${activeOrder.status}`);
      }

      // Allow updates only for orders that are on hold or in pending/confirmed status
      // This prevents modification of orders that are already being prepared or served
      const allowedStatuses = [OrderStatusEnum.PENDING, OrderStatusEnum.CONFIRMED];
      if (!activeOrder.isOnHold && !allowedStatuses.includes(activeOrder.status)) {
        throw new BadRequestException(
          `Cannot update order with status: ${activeOrder.status}. Order must be on hold or in pending/confirmed status.`
        );
      }

      // Handle order items replacement and total recalculation
      if (updateOrderDto.orderItems && updateOrderDto.orderItems.length > 0) {
        this.logger.log(`[OrderUpdate] Starting order items update for order ${activeOrder.orderNumber} (ID: ${activeOrder.id})`);
        this.logger.log(`[OrderUpdate] Current order has ${activeOrder.orderItems?.length || 0} items`);

        // Remove existing order items and their addons for this order
        if (activeOrder.orderItems && activeOrder.orderItems.length > 0) {
          try {
            const itemCount = activeOrder.orderItems.length;
            this.logger.log(`[OrderUpdate] Attempting to delete items and addons for order ${activeOrder.orderNumber}...`);

            // Step 1: Manually delete all addons for these items first
            // This is a bulletproof way to avoid foreign key issues regardless of DB constraints
            const orderItemIds = activeOrder.orderItems.map(item => item.id);
            await this.orderItemAddonRepository
              .createQueryBuilder()
              .delete()
              .from(OrderItemAddon)
              .where('orderItemId IN (:...ids)', { ids: orderItemIds })
              .execute();

            this.logger.log(`[OrderUpdate] Deleted all addons for ${itemCount} order items`);

            // Step 2: Delete the order items
            const deleteResult = await this.orderItemRepository
              .createQueryBuilder()
              .delete()
              .from(OrderItem)
              .where('orderId = :orderId', { orderId: activeOrder.id })
              .execute();

            this.logger.log(`[OrderUpdate] Successfully deleted ${deleteResult.affected || 0} order items for order ${activeOrder.orderNumber}`);
          } catch (error) {
            this.logger.error(
              `[OrderUpdate] Error deleting order items for order ${activeOrder.id}:`,
              error instanceof Error ? error.message : JSON.stringify(error),
              error instanceof Error ? error.stack : ''
            );

            // Log the full error object for debugging
            console.error('[OrderUpdate] Full deletion error:', error);

            // Provide a more specific error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
            throw new BadRequestException(
              `Failed to delete existing order items: ${errorMessage}. Please ensure the order is in a valid state for updates.`
            );
          }
        }

        // Reload the order after deletion to get a fresh entity
        // This ensures the entity is properly managed by TypeORM and has no stale data
        this.logger.log(`[OrderUpdate] Reloading order entity after deletion...`);
        const reloadedOrder = await this.orderRepository.findOne({
          where: { id: activeOrder.id },
          relations: ['restaurant'], // Only load what we need for calculations
        });

        if (!reloadedOrder) {
          this.logger.error(`[OrderUpdate] Order not found after deletion. ID: ${activeOrder.id}`);
          throw new NotFoundException('Order not found after deletion');
        }

        this.logger.log(`[OrderUpdate] Order reloaded successfully. ID: ${reloadedOrder.id}`);

        // Update active tracking variables for subsequent operations
        activeOrderRef = reloadedOrder;
        activeRestaurant = reloadedOrder.restaurant;
        activeOrderId = reloadedOrder.id;

        let subtotal = 0;
        const orderItemsToCreate = [];

        for (const orderItemDto of updateOrderDto.orderItems) {
          const menu = await this.menuRepository.findOne({
            where: { id: orderItemDto.menuId, restaurantId: activeRestaurant.id },
          });

          if (!menu) {
            throw new NotFoundException(`Menu item with ID ${orderItemDto.menuId} not found for this restaurant`);
          }

          if (!menu.isAvailable) {
            throw new BadRequestException(`Menu item ${menu.name} is currently unavailable`);
          }

          // Calculate correct price including variants and discounts
          const itemUnitPrice = this.calculateItemPrice(menu, orderItemDto.specialInstructions);
          this.logger.log(`[OrderUpdate] Calculated price for item ${menu.name}: ${itemUnitPrice} (Base: ${menu.price}, Discount: ${menu.discount}%)`);

          // Handle Addons - Independent quantity pricing
          let itemAddonsTotal = 0;
          const itemSelectedAddons = [];

          // Support both legacy addonIds and new structured selectedAddons
          const addonsToProcess = orderItemDto.selectedAddons ||
            (orderItemDto.addonIds?.map(id => ({ addonId: id, quantity: 1 })) || []);

          if (addonsToProcess && addonsToProcess.length > 0) {
            this.logger.log(`[OrderUpdate] Processing ${addonsToProcess.length} addons for item ${menu.name}`);
            for (const addonSelection of addonsToProcess) {
              const addon = await this.addonRepository.findOne({
                where: { id: addonSelection.addonId },
              });

              if (!addon) {
                this.logger.warn(`[OrderUpdate] Addon with ID ${addonSelection.addonId} not found in DB. Skipping.`);
                continue;
              }

              this.logger.log(`[OrderUpdate] Found addon: ${addon.name} (Price: ${addon.unitPrice})`);

              const addonUnitPrice = Number(addon.unitPrice);
              const addonQuantity = addonSelection.quantity || 1;
              const addonTotalPrice = addonUnitPrice * addonQuantity;

              itemAddonsTotal += addonTotalPrice;
              itemSelectedAddons.push({
                addonId: addon.id,
                name: addon.name,
                quantity: addonQuantity,
                unitPrice: addonUnitPrice,
                totalPrice: addonTotalPrice,
              });
            }
          } else {
            this.logger.log(`[OrderUpdate] No addons to process for item ${menu.name}`);
          }

          // Addon logic: Addons are independent of item quantity
          // Example: 1 Kothu ($500) + 2 Eggs ($50 each) = $500 + $100 = $600
          // Example: 2 Kothu ($500) + 2 Eggs ($50 each) = $1000 + $100 = $1100
          const recalculatedItemTotal = (itemUnitPrice * orderItemDto.quantity) + itemAddonsTotal;

          subtotal += recalculatedItemTotal;

          this.logger.log(`[OrderUpdate] Item total: ${itemUnitPrice} x ${orderItemDto.quantity} + Addons: ${itemAddonsTotal} = ${recalculatedItemTotal}`);

          // Handle specialInstructions: serialize objects to JSON string, keep strings as-is
          let specialInstructionsValue: string | object | null = null;
          if (orderItemDto.specialInstructions !== undefined && orderItemDto.specialInstructions !== null) {
            if (typeof orderItemDto.specialInstructions === 'object') {
              specialInstructionsValue = JSON.stringify(orderItemDto.specialInstructions);
            } else {
              specialInstructionsValue = orderItemDto.specialInstructions;
            }
          }

          orderItemsToCreate.push({
            menuId: menu.id,
            quantity: orderItemDto.quantity,
            unitPrice: itemUnitPrice,
            totalPrice: recalculatedItemTotal,
            specialInstructions: specialInstructionsValue,
            status: 'pending',
            selectedAddons: itemSelectedAddons,
            estimatedPreparationTime: menu.preparationTime || 0,
          });
        }

        // Calculate order totals with service charge
        const serviceCharge = this.calculateServiceCharge(subtotal, activeRestaurant);
        const tax = 0; // For future use
        const discount = 0; // For future use
        const finalTotal = parseFloat((subtotal + serviceCharge + tax - discount).toFixed(2));

        this.logger.log(`[OrderUpdate] Order update pricing - Subtotal: ${subtotal}, Service Charge: ${serviceCharge}, Total: ${finalTotal}`);

        // Create order items with addons
        this.logger.log(`[OrderUpdate] Creating ${orderItemsToCreate.length} new order items...`);
        for (const itemData of orderItemsToCreate) {
          try {
            this.logger.log(`[OrderUpdate] Creating order item for menu ${itemData.menuId}, quantity: ${itemData.quantity}`);

            const specialInstructionsValue = itemData.specialInstructions !== undefined && itemData.specialInstructions !== null
              ? itemData.specialInstructions
              : null;

            this.logger.log(`[OrderUpdate] Creating order item with orderId: ${activeOrderId}, menuId: ${itemData.menuId}`);

            const orderItem = this.orderItemRepository.create({
              orderId: activeOrderId,
              menuId: itemData.menuId,
              quantity: itemData.quantity,
              unitPrice: itemData.unitPrice,
              totalPrice: itemData.totalPrice,
              specialInstructions: specialInstructionsValue,
              status: itemData.status,
              estimatedPreparationTime: itemData.estimatedPreparationTime || 0,
              originalPreparationTime: itemData.estimatedPreparationTime || 0,
            });

            this.logger.log(`[OrderUpdate] Order item created object: ${JSON.stringify({ orderId: orderItem.orderId, menuId: orderItem.menuId })}`);
            this.logger.log(`[OrderUpdate] Saving order item to database...`);
            const savedOrderItem = await this.orderItemRepository.save(orderItem);
            this.logger.log(`[OrderUpdate] Order item saved with ID: ${savedOrderItem.id}`);

            // Save addons for this order item
            if (itemData.selectedAddons && itemData.selectedAddons.length > 0) {
              this.logger.log(`[OrderUpdate] Saving ${itemData.selectedAddons.length} addons for order item ${savedOrderItem.id}`);
              for (const addonData of itemData.selectedAddons) {
                this.logger.log(`[OrderUpdate] Creating addon: ${addonData.addonId}, quantity: ${addonData.quantity}`);
                const orderItemAddon = this.orderItemAddonRepository.create({
                  orderItemId: savedOrderItem.id,
                  orderItem: savedOrderItem,
                  addonId: addonData.addonId,
                  quantity: addonData.quantity,
                  unitPrice: addonData.unitPrice,
                  totalPrice: addonData.totalPrice,
                });
                await this.orderItemAddonRepository.save(orderItemAddon);
                this.logger.log(`[OrderUpdate] Addon saved successfully`);
              }
            }
          } catch (error) {
            this.logger.error(
              `[OrderUpdate] Failed to create order item for menu ${itemData.menuId}`,
              error instanceof Error ? error.message : JSON.stringify(error),
              error instanceof Error ? error.stack : '',
            );
            throw new BadRequestException(
              `Failed to create order item: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        }

        this.logger.log(`[OrderUpdate] All order items created successfully`);

        // Update order totals
        const oldTotal = activeOrderRef.totalAmount;
        activeOrderRef.subtotal = subtotal;
        activeOrderRef.serviceCharge = serviceCharge;
        activeOrderRef.tax = tax;
        activeOrderRef.discount = discount;
        activeOrderRef.totalAmount = finalTotal;
        await this.orderRepository.save(activeOrderRef);

        this.logger.log(`Order ${activeOrderRef.orderNumber} updated - Old total: ${oldTotal}, New total: ${finalTotal} (Subtotal: ${subtotal}, Service Charge: ${serviceCharge})`);
      }

      // Handle payment method update
      if (updateOrderDto.paymentMethod) {
        this.logger.log(`Updating payment method for order ${activeOrderRef.orderNumber} to ${updateOrderDto.paymentMethod}`);

        // Create a new payment record with the updated payment method
        // The latest payment record is used to determine the current payment method
        const payment = this.paymentRepository.create({
          orderId: activeOrderId,
          method: updateOrderDto.paymentMethod,
          amount: activeOrderRef.totalAmount,
          status: updateOrderDto.paymentMethod === PaymentMethod.CASHIER
            ? PaymentStatus.PENDING
            : PaymentStatus.PAID,
        });
        await this.paymentRepository.save(payment);

        this.logger.log(`Payment method updated to ${updateOrderDto.paymentMethod} for order ${activeOrderRef.orderNumber}`);
      }

      // Handle notes update
      if (updateOrderDto.notes !== undefined) {
        activeOrderRef.notes = updateOrderDto.notes;
        await this.orderRepository.save(activeOrderRef);
        this.logger.log(`Notes updated for order ${activeOrderRef.orderNumber}`);
      }


      const refreshedOrder = await this.orderRepository.findOne({
        where: { id },
        relations: [
          'orderItems',
          'orderItems.menu',
          'orderItems.menu.category',
          'orderItems.orderItemAddons',
          'orderItems.orderItemAddons.addon',
          'customer',
          'restaurant',
          'table',
          'payments',
        ],
      });

      // Broadcast updated order so all UIs stay in sync
      await this.orderStatusGateway.broadcastOrderStatusUpdate(id, {
        status: refreshedOrder.status,
        updatedAt: new Date(),
        order: refreshedOrder,
      });
      await this.orderStatusGateway.broadcastOrderUpdate(refreshedOrder);

      // Log the update action
      await this.orderActivityLogService.logAction(
        id,
        OrderAction.UPDATED,
        user?.id,
        `Order items updated - New total: ${refreshedOrder.totalAmount}`
      );

      return this.formatOrderWithGroupedItems(refreshedOrder);
    } catch (error) {
      this.logger.error(
        `Error updating order ${id}:`,
        error instanceof Error ? error.message : JSON.stringify(error),
        error instanceof Error ? error.stack : ''
      );

      // Re-throw known exceptions (BadRequestException, NotFoundException, etc.)
      if (error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException) {
        throw error;
      }

      // For unknown errors, log details and throw a generic error
      throw new BadRequestException(
        `Failed to update order: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      );
    }
  }


  async updateOrderItemStatus(orderId: string, itemId: string, updateDto: UpdateOrderItemStatusDto, user: any): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
      relations: ['order', 'menu'],
    });

    if (!orderItem) {
      throw new NotFoundException(`Order item with ID ${itemId} not found for order ${orderId}`);
    }

    const oldStatus = orderItem.status;
    const newStatus = updateDto.status;

    if (oldStatus === newStatus) {
      return orderItem;
    }

    orderItem.status = newStatus;

    if (newStatus === 'in_progress' && !orderItem.startedAt) {
      orderItem.startedAt = new Date();
    } else if (newStatus === 'ready') {
      orderItem.readyAt = new Date();
    } else if (newStatus === 'served') {
      orderItem.servedAt = new Date();
    }

    const savedItem = await this.orderItemRepository.save(orderItem);

    // Log action based on item status
    let itemAction = OrderAction.VIEWED;
    if (newStatus === 'in_progress') itemAction = OrderAction.PREPARING;
    else if (newStatus === 'ready') itemAction = OrderAction.READY;
    else if (newStatus === 'served') itemAction = OrderAction.SERVED;

    await this.orderActivityLogService.logAction(
      orderId,
      itemAction,
      user?.id,
      `Item ${orderItem.menu?.name} status changed from ${oldStatus} to ${newStatus}`
    );

    // Broadcast item update
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'orderItems',
        'orderItems.menu',
        'orderItems.menu.category',
        'orderItems.orderItemAddons',
        'orderItems.orderItemAddons.addon',
        'customer',
        'restaurant',
      ],
    });

    if (order) {
      const allItems = order.orderItems;
      const allServed = allItems.every(item => item.status === 'served');
      const anyInProgress = allItems.some(item => item.status === 'in_progress' || item.status === 'ready' || item.status === 'served');

      let orderStatusChanged = false;
      let newOrderStatus = order.status;

      if (allServed) {
        // All items served - move to COMPLETED or SERVED based on payment timing
        const targetStatus = order.restaurant?.paymentTiming === 'pay_at_first'
          ? OrderStatusEnum.COMPLETED
          : OrderStatusEnum.SERVED;

        if (order.status !== targetStatus) {
          newOrderStatus = targetStatus;
          orderStatusChanged = true;
        }
      } else if (anyInProgress && order.status === OrderStatusEnum.CONFIRMED) {
        // At least one item in kitchen - move to PREPARING
        newOrderStatus = OrderStatusEnum.PREPARING;
        orderStatusChanged = true;
      }

      if (orderStatusChanged) {
        order.status = newOrderStatus;
        await this.orderRepository.save(order);
        this.logger.log(`Order ${order.orderNumber} status auto-updated to ${newOrderStatus} based on item status changes.`);

        // Clear alert tracking when order is READY (all items cooked and ready to serve)
        // This ensures kitchen gets reminders if preparation is taking too long
        if (newOrderStatus === OrderStatusEnum.READY) {
          try {
            if (this.orderAlertsService) {
              this.orderAlertsService.clearOrderAlerts(orderId);
              this.logger.log(`Cleared alerts for order ${order.orderNumber} - order is ready to serve`);
            }
          } catch (error) {
            this.logger.warn('Failed to clear order alerts:', error);
          }
        }
      }

      // ALWAYS broadcast order status update with full order details (even for item-only changes)
      // This ensures customers receive micro-updates for individual item status changes
      await this.orderStatusGateway.broadcastOrderStatusUpdate(orderId, {
        status: order.status,
        updatedAt: new Date(),
        order: order, // Include full order with updated items
      });

      // Broadcast complete order update
      await this.orderStatusGateway.broadcastOrderUpdate(order);
    }

    return savedItem;
  }

  async remove(id: string, user: any): Promise<void> {
    const order = await this.findOne(id, user);

    // Only allow deletion if order is pending or cancelled
    if (order.status !== OrderStatusEnum.PENDING && order.status !== OrderStatusEnum.CANCELLED) {
      throw new BadRequestException('Cannot delete order with this status');
    }

    await this.orderRepository.remove(order);
    await this.orderActivityLogService.logAction(id, OrderAction.DELETED, user?.id);
  }

  async confirmOrder(id: string, user: any): Promise<Order> {
    const order = await this.findOne(id, user);

    order.status = OrderStatusEnum.CONFIRMED;
    const savedOrder = await this.orderRepository.save(order);

    await this.orderActivityLogService.logAction(id, OrderAction.CONFIRMED, user?.id);
    const fullOrder = await this.findOne(id, user);

    // Broadcast order confirmation via WebSocket
    await this.orderStatusGateway.broadcastOrderStatusUpdate(id, {
      status: OrderStatusEnum.CONFIRMED,
      order: fullOrder,
      updatedAt: new Date(),
    });
    await this.orderStatusGateway.broadcastOrderUpdate(fullOrder);

    // NOTE: Alerts will continue until order starts preparing
    // This ensures kitchen is reminded to start working on confirmed orders

    return fullOrder;
  }

  /**
   * Get all pending orders for a specific table
   * Used by waiters to view and verify customer orders before confirming
   * Only returns orders in PENDING status for tables in pay-last restaurants with waiter confirmation enabled
   */
  async getTablePendingOrders(tableId: string, restaurantId: string | undefined, user: any): Promise<Order[]> {
    // Determine restaurant ID from user if not provided
    const effectiveRestaurantId = restaurantId || user.restaurantId;

    if (!effectiveRestaurantId && user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Restaurant ID is required');
    }

    // Build query to find pending orders for the table
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.menu', 'menu')
      .leftJoinAndSelect('menu.category', 'category')
      .leftJoinAndSelect('orderItems.orderItemAddons', 'orderItemAddons')
      .leftJoinAndSelect('orderItemAddons.addon', 'addon')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.payments', 'payments')
      .where('order.tableId = :tableId', { tableId })
      .andWhere('order.status = :status', { status: OrderStatusEnum.PENDING })
      .andWhere('order.orderType = :orderType', { orderType: 'dine_in' }); // Only dine-in orders need waiter confirmation


    // Apply restaurant filter
    if (effectiveRestaurantId) {
      queryBuilder.andWhere('order.restaurantId = :restaurantId', { restaurantId: effectiveRestaurantId });
    }

    // Permission check: Non-super-admin users can only see their restaurant's orders
    if (user.role !== UserRole.SUPER_ADMIN && user.restaurantId) {
      queryBuilder.andWhere('order.restaurantId = :userRestaurantId', { userRestaurantId: user.restaurantId });
    }

    // Order by creation date (oldest first - FIFO)
    queryBuilder.orderBy('order.createdAt', 'ASC');

    const orders = await queryBuilder.getMany();

    // Format orders with grouped items
    return orders.map(order => this.formatOrderWithGroupedItems(order));
  }

  /**
   * Waiter confirms order and sends to kitchen
   * Only applicable for pay-last restaurants with waiter confirmation enabled
   * Changes order status from PENDING to CONFIRMED
   */
  async waiterConfirmOrder(id: string, user: any): Promise<Order> {
    // Fetch order with restaurant details
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'restaurant',
        'orderItems',
        'orderItems.menu',
        'orderItems.menu.category',
        'orderItems.orderItemAddons',
        'orderItems.orderItemAddons.addon',
        'customer',
        'table',
        'payments',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Permission check: Ensure user has access to this restaurant's orders
    if (user.role !== UserRole.SUPER_ADMIN && user.restaurantId && order.restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Access denied: Order does not belong to your restaurant');
    }

    // Validate order status - only PENDING orders can be waiter-confirmed
    if (order.status !== OrderStatusEnum.PENDING) {
      throw new BadRequestException(
        `Cannot confirm order with status: ${order.status}. Only PENDING orders can be confirmed by waiter.`
      );
    }

    // CRITICAL: Waiter confirmation is ONLY for dine-in orders
    // Takeaway and Parking orders should NEVER require waiter confirmation
    if (order.orderType === 'takeaway' || order.orderType === 'parking') {
      throw new BadRequestException(
        `Waiter confirmation is not applicable for ${order.orderType} orders. These orders auto-confirm after payment.`
      );
    }

    // Validate restaurant settings - only pay-last restaurants with waiter confirmation enabled
    if (order.restaurant.paymentTiming !== 'pay_at_last') {
      throw new BadRequestException(
        'Waiter confirmation is only applicable for pay-last restaurants. This is a pay-first restaurant.'
      );
    }

    if (!order.restaurant.requireWaiterConfirmation) {
      throw new BadRequestException(
        'Waiter confirmation is not enabled for this restaurant. Orders should auto-confirm.'
      );
    }

    // Update order status to CONFIRMED
    order.status = OrderStatusEnum.CONFIRMED;
    const savedOrder = await this.orderRepository.save(order);

    this.logger.log(
      `Order ${order.orderNumber} confirmed by waiter ${user.name || user.id} - sending to kitchen`
    );

    // Log the waiter confirmation action
    await this.orderActivityLogService.logAction(
      id,
      OrderAction.CONFIRMED,
      user?.id,
      `Order confirmed by waiter and sent to kitchen`
    );

    // Fetch full order with all relations
    const fullOrder = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'orderItems',
        'orderItems.menu',
        'orderItems.menu.category',
        'orderItems.orderItemAddons',
        'orderItems.orderItemAddons.addon',
        'customer',
        'restaurant',
        'table',
        'payments',
      ],
    });

    // Broadcast order confirmation via WebSocket
    await this.orderStatusGateway.broadcastOrderStatusUpdate(id, {
      status: OrderStatusEnum.CONFIRMED,
      order: fullOrder,
      updatedAt: new Date(),
    });
    await this.orderStatusGateway.broadcastOrderUpdate(fullOrder);

    return this.formatOrderWithGroupedItems(fullOrder);
  }


  async processPayment(id: string, paymentData: ProcessPaymentDto, user: any): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const orderAmount = Number(order.totalAmount);

    // requirement: Pay last restaurants - different rules for dine-in vs takeaway/parking
    // - Dine-in: Must wait until all items are served (status: SERVED)
    // - Takeaway/Parking: Can pay immediately (payment needed to send order to kitchen)
    const isTakeawayOrParking = order.orderType === 'takeaway' || order.orderType === 'parking';
    const isPayAtLast = order.restaurant?.paymentTiming === 'pay_at_last';

    if (isPayAtLast && !isTakeawayOrParking && order.status !== OrderStatusEnum.SERVED && order.status !== OrderStatusEnum.COMPLETED) {
      throw new BadRequestException(
        `Cannot process payment. For this restaurant, all food items must be served (Status: SERVED) before payment can be accepted. Current status: ${order.status}`
      );
    }

    // Validation for cash payments
    const isCashPayment = paymentData.paymentMethod === PaymentMethod.CASH ||
      paymentData.paymentMethod === PaymentMethod.CASHIER_CASH;

    if (isCashPayment) {
      // For cash payments, validate amount tendered
      if (paymentData.amountTendered !== undefined) {
        if (paymentData.amountTendered < orderAmount) {
          throw new BadRequestException(
            `Amount tendered (${paymentData.amountTendered}) must be greater than or equal to order total (${orderAmount})`
          );
        }

        // Validate change calculation if provided
        if (paymentData.changeReturned !== undefined) {
          const expectedChange = paymentData.amountTendered - orderAmount;
          const providedChange = paymentData.changeReturned;

          // Allow small rounding differences (0.01)
          if (Math.abs(expectedChange - providedChange) > 0.01) {
            throw new BadRequestException(
              `Change returned (${providedChange}) does not match expected change (${expectedChange}). ` +
              `Amount tendered: ${paymentData.amountTendered}, Order total: ${orderAmount}`
            );
          }
        }
      }
    } else {
      // For non-cash payments (card, QR), cash tracking fields should not be provided
      if (paymentData.amountTendered !== undefined || paymentData.changeReturned !== undefined) {
        this.logger.warn(
          `Cash tracking fields provided for non-cash payment method: ${paymentData.paymentMethod}. ` +
          `These fields will be ignored.`
        );
        // Clear the fields for non-cash payments
        paymentData.amountTendered = undefined;
        paymentData.changeReturned = undefined;
      }
    }

    // Create or update payment record
    const existingPayment = await this.paymentRepository.findOne({
      where: { orderId: id },
      order: { createdAt: 'DESC' },
    });

    if (existingPayment) {
      // Update existing payment
      existingPayment.method = paymentData.paymentMethod;
      existingPayment.status = PaymentStatus.PAID;

      // Store cash payment tracking details
      if (paymentData.amountTendered !== undefined) {
        existingPayment.amountTendered = paymentData.amountTendered;
      }
      if (paymentData.changeReturned !== undefined) {
        existingPayment.changeReturned = paymentData.changeReturned;
      }

      if (paymentData.paymentReference) {
        // Store payment reference in metadata if needed
      }
      await this.paymentRepository.save(existingPayment);
    } else {
      // Create new payment record
      const payment = this.paymentRepository.create({
        orderId: id,
        method: paymentData.paymentMethod,
        amount: orderAmount,
        status: PaymentStatus.PAID,
        amountTendered: paymentData.amountTendered || null,
        changeReturned: paymentData.changeReturned || null,
      });
      await this.paymentRepository.save(payment);
    }

    // Automatically update order status based on current state
    // CRITICAL RULES:
    // - Parking/Takeaway: ALWAYS auto-confirm after payment (no waiter confirmation)
    // - Pay-first dine-in: ALWAYS auto-confirm after payment (no waiter confirmation)
    // - Pay-last dine-in: Check requireWaiterConfirmation setting
    // Pay-last: SERVED → COMPLETED (order is done)
    if (order.status === OrderStatusEnum.PENDING) {
      // Check if this is a parking or takeaway order - these ALWAYS auto-confirm
      const isParkingOrTakeaway =
        order.orderType === 'parking' ||
        order.orderType === 'takeaway';

      if (isParkingOrTakeaway) {
        // Auto-confirm - no waiter verification needed
        order.status = OrderStatusEnum.CONFIRMED;
        await this.orderRepository.save(order);
        await this.orderActivityLogService.logAction(id, OrderAction.CONFIRMED, user?.id, `Auto-confirmed after payment (${order.orderType})`);
        this.logger.log(`Order ${order.orderNumber} (${order.orderType}) auto-confirmed after payment - no waiter confirmation needed`);
      }
      // Pay-first dine-in: ALWAYS auto-confirm after payment
      else if (order.restaurant.paymentTiming === 'pay_at_first') {
        order.status = OrderStatusEnum.CONFIRMED;
        await this.orderRepository.save(order);
        await this.orderActivityLogService.logAction(id, OrderAction.CONFIRMED, user?.id, 'Auto-confirmed after payment (pay-first dine-in)');
        this.logger.log(`Order ${order.orderNumber} (dine-in, pay-first) auto-confirmed after payment`);
      }
      // Pay-last dine-in: Check requireWaiterConfirmation setting
      else if (order.restaurant.paymentTiming === 'pay_at_last') {
        if (order.restaurant.requireWaiterConfirmation) {
          // Order stays PENDING - waiter must manually confirm
          this.logger.log(`Order ${order.orderNumber} (dine-in, pay-last) payment received but staying PENDING - waiter confirmation required`);
        } else {
          // Auto-confirm
          order.status = OrderStatusEnum.CONFIRMED;
          await this.orderRepository.save(order);
          await this.orderActivityLogService.logAction(id, OrderAction.CONFIRMED, user?.id, 'Auto-confirmed after payment (pay-last dine-in)');
          this.logger.log(`Order ${order.orderNumber} (dine-in, pay-last) auto-confirmed after payment`);
        }
      }
    } else if (order.status === OrderStatusEnum.SERVED) {
      order.status = OrderStatusEnum.COMPLETED;
      await this.orderRepository.save(order);
      await this.orderActivityLogService.logAction(id, OrderAction.COMPLETED, user?.id, 'Auto-completed after payment (SERVED + PAID → COMPLETED)');
      this.logger.log(`Order ${order.orderNumber} auto-completed after payment (SERVED + PAID → COMPLETED)`);
    }

    await this.orderActivityLogService.logAction(id, OrderAction.PAYMENT_PROCESSED, user?.id, `Payment processed via ${paymentData.paymentMethod}`);

    return this.findOne(id, user);
  }

  /**
   * Mark order as done (completed) - used by cashier when payment is received
   * Changes order status to COMPLETED and updates payment status to PAID
   * Supports both:
   * - Pay-first: PENDING → COMPLETED (quick service, no kitchen)
   * - Pay-last: SERVED → COMPLETED (after food is served and paid)
   */
  async markOrderAsDone(id: string, user: any): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // requirement: Pay last restaurants - different rules for dine-in vs takeaway
    // - Dine-in: Must wait until all items are served (status: SERVED)
    // - Takeaway: Can mark as done immediately when order is ready for pickup
    const isTakeaway = order.orderType === 'takeaway';
    const isPayAtLast = order.restaurant?.paymentTiming === 'pay_at_last';

    if (isPayAtLast && !isTakeaway && order.status !== OrderStatusEnum.SERVED) {
      throw new BadRequestException(
        `Cannot mark order as done. For Pay-at-Last restaurants, all items must be SERVED first. Current status: ${order.status}`
      );
    }

    // Allow marking as done if order is PENDING (pay-at-first) or SERVED (pay-at-last)
    if (order.status !== OrderStatusEnum.PENDING && order.status !== OrderStatusEnum.SERVED && order.status !== OrderStatusEnum.COMPLETED) {
      throw new BadRequestException(
        `Cannot mark order as done. Order status must be PENDING or SERVED, but current status is ${order.status}`
      );
    }

    // Store original status for logging
    const originalStatus = order.status;

    // Update order status to COMPLETED
    order.status = OrderStatusEnum.COMPLETED;
    await this.orderRepository.save(order);

    await this.orderActivityLogService.logAction(id, OrderAction.COMPLETED, user?.id, `Manually completed from ${originalStatus}`);
    this.logger.log(`Order ${order.orderNumber} marked as COMPLETED (${originalStatus === OrderStatusEnum.PENDING ? 'pay-first' : 'pay-last'})`);

    // Release table if order had a table assigned
    if (order.tableId) {
      const table = await this.tableRepository.findOne({
        where: { id: order.tableId },
      });

      if (table) {
        this.logger.log(`[TABLE STATUS] Checking table ${table.name} (ID: ${order.tableId}) for order ${order.orderNumber}`);
        this.logger.log(`[TABLE STATUS] Current table status: ${table.status}`);

        // Check if there are any other active orders for this table
        const activeOrdersOnTable = await this.orderRepository
          .createQueryBuilder('order')
          .where('order.tableId = :tableId', { tableId: order.tableId })
          .andWhere('order.id != :orderId', { orderId: order.id })
          .andWhere('order.status NOT IN (:...excludedStatuses)', {
            excludedStatuses: [OrderStatusEnum.CANCELLED, OrderStatusEnum.COMPLETED, OrderStatusEnum.ABANDONED],
          })
          .getCount();

        this.logger.log(`[TABLE STATUS] Active orders on table ${table.name}: ${activeOrdersOnTable}`);

        // If no other active orders, set table back to AVAILABLE
        if (activeOrdersOnTable === 0 && table.status === TableStatus.OCCUPIED) {
          table.status = TableStatus.AVAILABLE;
          await this.tableRepository.save(table);
          this.logger.log(`[TABLE STATUS] ✅ Table ${table.name} (ID: ${order.tableId}) status updated to AVAILABLE after order completion`);
        } else if (activeOrdersOnTable > 0) {
          this.logger.log(`[TABLE STATUS] ⏸️  Table ${table.name} remains OCCUPIED - ${activeOrdersOnTable} other active order(s) on this table`);
        } else if (table.status !== TableStatus.OCCUPIED) {
          this.logger.log(`[TABLE STATUS] ℹ️  Table ${table.name} status is ${table.status} (not OCCUPIED), no change needed`);
        }
      } else {
        this.logger.warn(`[TABLE STATUS] ⚠️  Table with ID ${order.tableId} not found for order ${order.orderNumber}`);
      }
    }

    // Update payment status to PAID if payment exists
    const payment = await this.paymentRepository.findOne({
      where: { orderId: id },
      order: { createdAt: 'DESC' },
    });

    if (payment && payment.status === PaymentStatus.PENDING) {
      payment.status = PaymentStatus.PAID;
      await this.paymentRepository.save(payment);
    }

    const fullOrder = await this.findOne(id, user);

    // Broadcast order completion via WebSocket
    await this.orderStatusGateway.broadcastOrderStatusUpdate(id, {
      status: OrderStatusEnum.COMPLETED,
      order: fullOrder,
      updatedAt: new Date(),
    });
    await this.orderStatusGateway.broadcastOrderUpdate(fullOrder);

    return fullOrder;
  }

  async getOrderAnalytics(filters: any, user: any): Promise<any> {
    const whereCondition: any = {};

    // Apply restaurant filter - required for non-super-admin users
    if (filters.restaurantId) {
      whereCondition.restaurantId = filters.restaurantId;
    } else if (user.restaurantId) {
      whereCondition.restaurantId = user.restaurantId;
    } else if (user.role !== 'super_admin') {
      throw new BadRequestException('Restaurant ID is required for non-admin users');
    }

    // Calculate date range based on period filter
    let startDate: Date;
    let endDate: Date = new Date(); // Now

    if (filters.period) {
      switch (filters.period) {
        case 'today':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'last7days':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last30days':
        case 'lastMonth':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'total':
        case 'all':
          // No date filter - get all time data
          startDate = null;
          endDate = null;
          break;
        default:
          // Default to last 7 days if invalid period
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
      }
    } else if (filters.startDate && filters.endDate) {
      // Custom date range - support YYYY-MM-DD format
      startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 7 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    // Apply date filter if dates are set
    if (startDate && endDate) {
      whereCondition.createdAt = Between(startDate, endDate);
    }

    // Apply order status filter (if not provided, default to COMPLETED for revenue analytics)
    if (filters.status) {
      whereCondition.status = filters.status;
    } else {
      // Default: Only count COMPLETED orders for revenue analytics
      whereCondition.status = OrderStatusEnum.COMPLETED;
    }

    // Apply order type filter
    if (filters.orderType) {
      whereCondition.orderType = filters.orderType;
    }

    this.logger.log(`Analytics query - Restaurant: ${whereCondition.restaurantId}, Period: ${filters.period || 'custom'}, Status: ${whereCondition.status}, OrderType: ${filters.orderType || 'all'}, PaymentMethod: ${filters.paymentMethod || 'all'}`);

    // Use QueryBuilder for payment method filtering
    // Only select order fields needed for summary calculation
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .select(['order.id', 'order.totalAmount', 'order.status', 'order.orderType', 'order.createdAt']);

    // Join payments only if filtering by payment method
    if (filters.paymentMethod) {
      queryBuilder.leftJoin('order.payments', 'payments');
    }

    // Apply where conditions
    if (whereCondition.restaurantId) {
      queryBuilder.andWhere('order.restaurantId = :restaurantId', { restaurantId: whereCondition.restaurantId });
    }
    if (whereCondition.createdAt) {
      queryBuilder.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }
    if (whereCondition.status) {
      queryBuilder.andWhere('order.status = :status', { status: whereCondition.status });
    }
    if (whereCondition.orderType) {
      queryBuilder.andWhere('order.orderType = :orderType', { orderType: whereCondition.orderType });
    }

    // Apply payment method filter using subquery
    if (filters.paymentMethod) {
      const targetMethods = [filters.paymentMethod];
      if (filters.paymentMethod === 'cash') targetMethods.push(PaymentMethod.CASHIER_CASH);
      if (filters.paymentMethod === 'card') targetMethods.push(PaymentMethod.CASHIER_CARD);
      if (filters.paymentMethod === 'qr') targetMethods.push(PaymentMethod.CASHIER_QR);

      queryBuilder.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('payment.orderId')
          .from(Payment, 'payment')
          .where('payment.method IN (:...targetMethods)')
          .andWhere('payment.orderId = order.id')
          .getQuery();
        return `EXISTS ${subQuery}`;
      });
      queryBuilder.setParameter('targetMethods', targetMethods);
    }

    const orders = await queryBuilder.getMany();

    // Calculate summary metrics only
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get real-time status counts for dashboard cards
    const statusCountsQuery = this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.restaurantId = :restaurantId', { restaurantId: whereCondition.restaurantId })
      .groupBy('order.status');

    const statusCounts = await statusCountsQuery.getRawMany();
    const statusCountsMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count, 10);
      return acc;
    }, {} as Record<string, number>);

    // Get completed orders count for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const completedTodayCount = await this.orderRepository.count({
      where: {
        restaurantId: whereCondition.restaurantId,
        status: OrderStatusEnum.COMPLETED,
        createdAt: Between(todayStart, todayEnd),
      },
    });

    return {
      summary: {
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
      },
      statusCounts: {
        pending: statusCountsMap[OrderStatusEnum.PENDING] || 0,
        confirmed: statusCountsMap[OrderStatusEnum.CONFIRMED] || 0,
        preparing: statusCountsMap[OrderStatusEnum.PREPARING] || 0,
        ready: statusCountsMap[OrderStatusEnum.READY] || 0,
        served: statusCountsMap[OrderStatusEnum.SERVED] || 0,
        completed: statusCountsMap[OrderStatusEnum.COMPLETED] || 0,
        cancelled: statusCountsMap[OrderStatusEnum.CANCELLED] || 0,
        abandoned: statusCountsMap[OrderStatusEnum.ABANDONED] || 0,
        completedToday: completedTodayCount,
      },
      dateRange: {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      },
      filters: {
        orderType: filters.orderType || 'all',
        status: filters.status || 'completed',
        paymentMethod: filters.paymentMethod || 'all',
      },
    };
  }

  /**
   * Generate a unique readable order number per restaurant
   * Format: ORD followed by a 6-digit number (e.g., ORD000001, ORD000255)
   * Each restaurant has its own counter starting from 1
   * Uses the maximum existing order number for the restaurant + 1, or starts from 1 if no orders exist
   * Handles both old format (#0000001) and new format (ORD000001)
   */
  private async generateOrderNumber(restaurantId: string): Promise<string> {
    // Temporary solution: Use timestamp-based order numbers
    // This ensures orders can always be created
    // Format: ORD + timestamp (last 10 digits) + random 2 digits
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const orderNumber = `ORD${timestamp}${random}`;

    this.logger.log(`Generated timestamp-based order number: ${orderNumber} for restaurant ${restaurantId}`);

    return orderNumber;
  }
  /**
   * Helper method to calculate item price including variants and discounts
   */
  private calculateItemPrice(menu: Menu, specialInstructions: any): number {
    let finalPrice = Number(menu.price);
    const discountPercentage = Number(menu.discount) || 0;

    if (isNaN(finalPrice) || finalPrice < 0) {
      throw new BadRequestException(`Invalid base price for menu item ${menu.name} (${menu.price})`);
    }

    let instructions = specialInstructions;
    // Handle JSON string input
    if (typeof specialInstructions === 'string') {
      try {
        instructions = JSON.parse(specialInstructions);
      } catch (e) {
        this.logger.warn(`Failed to parse specialInstructions string: ${specialInstructions}`);
      }
    }

    // Process variants if applicable
    if (instructions && typeof instructions === 'object' && menu.variantOptions && Array.isArray(menu.variantOptions)) {
      const instructionsObj = instructions as Record<string, any>;

      for (const variantOption of menu.variantOptions) {
        // Try to match by variant name or generic 'portion' key
        const selectedVariantValue = instructionsObj[variantOption.name] || instructionsObj?.portion;

        if (!selectedVariantValue) {
          continue;
        }

        const matchedOption = variantOption.options?.find(
          opt => opt.name.trim().toLowerCase() === String(selectedVariantValue).trim().toLowerCase()
        );

        if (matchedOption && matchedOption.price !== undefined) {
          finalPrice = Number(matchedOption.price);
          break; // Stop at first price override
        }
      }
    }

    // Apply discount if any
    if (discountPercentage > 0) {
      const discountAmount = (finalPrice * discountPercentage) / 100;
      finalPrice = parseFloat((finalPrice - discountAmount).toFixed(2));
    }

    return finalPrice;
  }
  /**
   * Get KOT (Kitchen Order Ticket) Summary
   * Returns order counts grouped by status for kitchen/waiter dashboard
   */
  async getKOTSummary(restaurantId: string, user: any): Promise<any> {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count orders by status
    const [
      pendingCount,
      confirmedCount,
      preparingCount,
      readyCount,
      servedCount,
      completedCount,
      completedTodayCount,
      cancelledCount,
      abandonedCount,
      totalOrders,
      totalRevenue,
    ] = await Promise.all([
      // Pending orders
      this.orderRepository.count({
        where: { restaurantId, status: OrderStatusEnum.PENDING },
      }),

      // Confirmed orders
      this.orderRepository.count({
        where: { restaurantId, status: OrderStatusEnum.CONFIRMED },
      }),

      // Preparing orders
      this.orderRepository.count({
        where: { restaurantId, status: OrderStatusEnum.PREPARING },
      }),

      // Ready orders
      this.orderRepository.count({
        where: { restaurantId, status: OrderStatusEnum.READY },
      }),

      // Served orders
      this.orderRepository.count({
        where: { restaurantId, status: OrderStatusEnum.SERVED },
      }),

      // Completed orders (all time)
      this.orderRepository.count({
        where: { restaurantId, status: OrderStatusEnum.COMPLETED },
      }),

      // Completed today
      this.orderRepository.count({
        where: {
          restaurantId,
          status: OrderStatusEnum.COMPLETED,
          createdAt: Between(today, tomorrow),
        },
      }),

      // Cancelled orders
      this.orderRepository.count({
        where: { restaurantId, status: OrderStatusEnum.CANCELLED },
      }),

      // Abandoned orders
      this.orderRepository.count({
        where: { restaurantId, status: OrderStatusEnum.ABANDONED },
      }),

      // Total orders count
      this.orderRepository.count({
        where: { restaurantId },
      }),

      // Total revenue (sum of all completed orders)
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where('order.restaurantId = :restaurantId', { restaurantId })
        .andWhere('order.status = :status', { status: OrderStatusEnum.COMPLETED })
        .getRawOne()
        .then(result => parseFloat(result?.total || '0')),
    ]);

    // Calculate average order value
    const averageOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0;

    return {
      summary: {
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      },
      statusCounts: {
        pending: pendingCount,
        confirmed: confirmedCount,
        preparing: preparingCount,
        ready: readyCount,
        served: servedCount,
        completed: completedCount,
        cancelled: cancelledCount,
        abandoned: abandonedCount,
        completedToday: completedTodayCount,
      },
      ordersByStatus: {
        completed: completedCount,
        pending: pendingCount,
        preparing: preparingCount,
        ready: readyCount,
      },
      dateRange: {
        startDate: today.toISOString().split('T')[0],
        endDate: tomorrow.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Normalize phone number to consistent format
   * Converts +94XXXXXXXXX to 0XXXXXXXXX
   * Removes spaces, dashes, parentheses
   */
  private normalizePhoneNumber(phone: string): string {
    if (!phone) return phone;

    // Remove all spaces, dashes, parentheses, plus signs
    let normalized = phone.replace(/[\s\-\(\)+]/g, '');

    // Convert +94 prefix to 0
    if (normalized.startsWith('94') && normalized.length === 11) {
      normalized = '0' + normalized.substring(2);
    }

    return normalized;
  }

  async getOrderLogs(id: string, user: any): Promise<any[]> {
    const order = await this.findOne(id, user); // Validates existence and ownership
    return await this.orderActivityLogService.getOrderLogs(id);
  }

  async getRecentLogs(restaurantId: string, user: any): Promise<any[]> {
    // Check permission - must be tenant admin or manager of this restaurant
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (user.restaurantId !== restaurantId) {
        throw new ForbiddenException('Access denied: You can only view logs for your own restaurant');
      }

      const allowedRoles = [UserRole.TENANT_ADMIN, UserRole.MANAGER];
      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenException('Access denied: Only Tenant Admins and Managers can view activity logs');
      }
    }

    return await this.orderActivityLogService.getRecentLogs(restaurantId);
  }

  /**
   * Calculate service charge based on restaurant settings
   */
  private calculateServiceCharge(subtotal: number, restaurant: any): number {
    if (!restaurant.applyServiceCharge) {
      return 0;
    }

    if (restaurant.serviceChargeType === 'fixed') {
      return Number(restaurant.fixedServiceCharge || 0);
    }

    // Percentage-based service charge
    const percentage = Number(restaurant.serviceChargePercentage || 0);
    return parseFloat(((subtotal * percentage) / 100).toFixed(2));
  }
}
