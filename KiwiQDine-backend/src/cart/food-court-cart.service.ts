import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodCourtCart } from '../infrastructure/database/entities/food-court-cart.entity';
import { Menu, Restaurant, Tenant, TenantType, Order, Payment, PaymentStatus, PaymentMethod, Customer, Addon } from '../infrastructure/database/entities';
import { OrderStatus as OrderStatusEnum } from '../infrastructure/database/entities/order.entity';
import { AddCartItemDto, UpdateCartItemDto, RemoveCartItemDto, CreateOrderFromCartDto } from './dto/food-court-cart.dto';
import { CreateCustomerPortalOrderDto } from '../customer-portal/dto/create-customer-portal-order.dto';
import { CustomerPortalService } from '../customer-portal/customer-portal.service';

@Injectable()
export class FoodCourtCartService {
  private readonly logger = new Logger(FoodCourtCartService.name);

  constructor(
    @InjectRepository(FoodCourtCart)
    private cartRepository: Repository<FoodCourtCart>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Addon)
    private addonRepository: Repository<Addon>,
    private customerPortalService: CustomerPortalService,
  ) { }

  /**
   * Normalize phone number for consistent matching
   * Removes spaces, dashes, parentheses, and handles country codes
   */
  private normalizePhone(phone: string): string {
    if (!phone) return '';
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '');
    // Remove leading + if present
    if (normalized.startsWith('+')) {
      normalized = normalized.substring(1);
    }
    return normalized;
  }

  /**
   * Compare two add-ons arrays for equality
   * Returns true if both arrays contain the same add-ons with the same quantities
   */
  private areAddonsEqual(
    addons1: Array<{ addonId: string; quantity: number }> | undefined,
    addons2: Array<{ addonId: string; quantity: number }> | undefined
  ): boolean {
    // If both are undefined or null, they're equal
    if (!addons1 && !addons2) return true;
    // If only one is undefined/null, they're not equal
    if (!addons1 || !addons2) return false;
    // If lengths differ, they're not equal
    if (addons1.length !== addons2.length) return false;

    // Sort both arrays by addonId for consistent comparison
    const sorted1 = [...addons1].sort((a, b) => a.addonId.localeCompare(b.addonId));
    const sorted2 = [...addons2].sort((a, b) => a.addonId.localeCompare(b.addonId));

    // Compare each addon
    return sorted1.every((addon1, index) => {
      const addon2 = sorted2[index];
      return addon1.addonId === addon2.addonId && addon1.quantity === addon2.quantity;
    });
  }

  /**
   * Calculate total price for add-ons
   * Fetches add-on details from database and sums their prices
   */
  private async calculateAddonsPrice(
    selectedAddons: Array<{ addonId: string; quantity: number }> | undefined,
  ): Promise<number> {
    if (!selectedAddons || selectedAddons.length === 0) {
      return 0;
    }

    let addonsTotal = 0;

    for (const selectedAddon of selectedAddons) {
      const addon = await this.addonRepository.findOne({
        where: { id: selectedAddon.addonId },
      });

      if (!addon) {
        this.logger.warn(`Addon ${selectedAddon.addonId} not found, skipping`);
        continue;
      }

      // Add addon price * quantity to total
      const addonPrice = Number(addon.unitPrice) * selectedAddon.quantity;
      addonsTotal += addonPrice;
      this.logger.log(`Added addon ${addon.name}: ${addon.unitPrice} x ${selectedAddon.quantity} = ${addonPrice}`);
    }

    return addonsTotal;
  }

  /**
   * Get or create cart for a session/customer
   */
  async getOrCreateCart(
    tenantId: string,
    sessionId?: string,
    customerId?: string,
  ): Promise<FoodCourtCart> {
    // Validate tenant is a food court
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.type !== TenantType.FOOD_COURT) {
      throw new BadRequestException('This endpoint is only available for food court tenants');
    }

    // Try to find existing cart
    let cart: FoodCourtCart | null = null;

    if (customerId) {
      cart = await this.cartRepository.findOne({
        where: { customerId, tenantId },
        order: { updatedAt: 'DESC' },
      });
    } else if (sessionId) {
      cart = await this.cartRepository.findOne({
        where: { sessionId, tenantId },
        order: { updatedAt: 'DESC' },
      });
    }

    // Create new cart if not found
    if (!cart) {
      cart = this.cartRepository.create({
        sessionId,
        customerId,
        tenantId,
        items: [],
        totalAmount: 0,
      });
      cart = await this.cartRepository.save(cart);
      this.logger.log(`Created new cart for ${customerId || sessionId}`);
    }

    return cart;
  }

  /**
   * Add item to cart
   */
  async addItem(
    tenantId: string,
    addItemDto: AddCartItemDto,
    sessionId?: string,
    customerId?: string,
  ): Promise<FoodCourtCart> {
    const cart = await this.getOrCreateCart(tenantId, sessionId, customerId);

    // Validate menu item exists and belongs to the restaurant
    const menu = await this.menuRepository.findOne({
      where: { id: addItemDto.menuId },
      relations: ['restaurant'],
    });

    if (!menu) {
      throw new NotFoundException('Menu item not found');
    }

    if (menu.restaurantId !== addItemDto.restaurantId) {
      throw new BadRequestException('Menu item does not belong to the specified restaurant');
    }

    if (!menu.isAvailable) {
      throw new BadRequestException(`Menu item ${menu.name} is currently unavailable`);
    }

    // Get restaurant info
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: addItemDto.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Calculate item price including variants and add-ons
    const basePrice = this.calculateItemPrice(menu, addItemDto.specialInstructions);
    const addonsPrice = await this.calculateAddonsPrice(addItemDto.selectedAddons);
    const unitPrice = basePrice + addonsPrice;
    const totalPrice = unitPrice * addItemDto.quantity;

    this.logger.log(`Calculated price for ${menu.name}: basePrice=${basePrice}, addonsPrice=${addonsPrice}, unitPrice=${unitPrice}, quantity=${addItemDto.quantity}, total=${totalPrice}`);

    // Check if item already exists in cart with the same menuId AND same add-ons
    const existingItemIndex = cart.items.findIndex(
      (item) => item.menuId === addItemDto.menuId && this.areAddonsEqual(item.selectedAddons, addItemDto.selectedAddons),
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const existingItem = cart.items[existingItemIndex];
      existingItem.quantity += addItemDto.quantity;
      // Recalculate price with variant and add-ons
      const newBasePrice = this.calculateItemPrice(menu, addItemDto.specialInstructions);
      const newAddonsPrice = await this.calculateAddonsPrice(addItemDto.selectedAddons);
      const newUnitPrice = newBasePrice + newAddonsPrice;
      existingItem.unitPrice = newUnitPrice;
      existingItem.totalPrice = newUnitPrice * existingItem.quantity;
      if (addItemDto.specialInstructions) {
        existingItem.specialInstructions = addItemDto.specialInstructions;
      }
    } else {
      // Add new item
      cart.items.push({
        restaurantId: addItemDto.restaurantId,
        restaurantName: restaurant.name,
        menuId: addItemDto.menuId,
        menuName: menu.name,
        quantity: addItemDto.quantity,
        unitPrice,
        totalPrice,
        specialInstructions: addItemDto.specialInstructions,
        selectedAddons: addItemDto.selectedAddons,
        image: menu.image,
      });
    }

    // Recalculate total
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

    return await this.cartRepository.save(cart);
  }

  /**
   * Update item quantity in cart
   */
  async updateItem(
    tenantId: string,
    updateItemDto: UpdateCartItemDto,
    sessionId?: string,
    customerId?: string,
  ): Promise<FoodCourtCart> {
    const cart = await this.getOrCreateCart(tenantId, sessionId, customerId);

    // Find item by menuId and selectedAddons to handle items with different add-ons
    // If selectedAddons is not provided, match the first item with the menuId (backward compatibility)
    let itemIndex: number;

    if (updateItemDto.selectedAddons !== undefined) {
      // Exact match with add-ons
      itemIndex = cart.items.findIndex(
        (item) => item.menuId === updateItemDto.menuId && this.areAddonsEqual(item.selectedAddons, updateItemDto.selectedAddons),
      );
    } else {
      // No add-ons specified, match first item with this menuId
      itemIndex = cart.items.findIndex(
        (item) => item.menuId === updateItemDto.menuId,
      );
    }

    if (itemIndex < 0) {
      throw new NotFoundException('Item not found in cart');
    }

    const item = cart.items[itemIndex];
    item.quantity = updateItemDto.quantity;

    // Recalculate price if specialInstructions changed (variant changed)
    if (updateItemDto.specialInstructions !== undefined) {
      item.specialInstructions = updateItemDto.specialInstructions;

      // Get menu to recalculate price with new variant and add-ons
      const menu = await this.menuRepository.findOne({
        where: { id: updateItemDto.menuId },
      });

      if (menu) {
        const newBasePrice = this.calculateItemPrice(menu, updateItemDto.specialInstructions);
        const newAddonsPrice = await this.calculateAddonsPrice(item.selectedAddons);
        const newUnitPrice = newBasePrice + newAddonsPrice;
        item.unitPrice = newUnitPrice;
        this.logger.log(`Updated price for ${menu.name}: ${newUnitPrice}`);
      }
    }

    item.totalPrice = item.unitPrice * updateItemDto.quantity;

    // Recalculate total
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

    return await this.cartRepository.save(cart);
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    tenantId: string,
    removeItemDto: RemoveCartItemDto,
    sessionId?: string,
    customerId?: string,
  ): Promise<FoodCourtCart> {
    const cart = await this.getOrCreateCart(tenantId, sessionId, customerId);

    // Find item by menuId and selectedAddons to handle items with different add-ons
    // If selectedAddons is not provided, match the first item with the menuId (backward compatibility)
    let itemIndex: number;

    if (removeItemDto.selectedAddons !== undefined) {
      // Exact match with add-ons
      itemIndex = cart.items.findIndex(
        (item) => item.menuId === removeItemDto.menuId && this.areAddonsEqual(item.selectedAddons, removeItemDto.selectedAddons),
      );
    } else {
      // No add-ons specified, match first item with this menuId
      itemIndex = cart.items.findIndex(
        (item) => item.menuId === removeItemDto.menuId,
      );
    }

    if (itemIndex < 0) {
      throw new NotFoundException('Item not found in cart');
    }

    cart.items.splice(itemIndex, 1);

    // Recalculate total
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

    return await this.cartRepository.save(cart);
  }

  /**
   * Get cart
   */
  async getCart(
    tenantId: string,
    sessionId?: string,
    customerId?: string,
  ): Promise<FoodCourtCart> {
    const cart = await this.getOrCreateCart(tenantId, sessionId, customerId);

    // Enrich cart items with addon details (name, price)
    for (const item of cart.items) {
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        const enrichedAddons = [];

        for (const selectedAddon of item.selectedAddons) {
          const addon = await this.addonRepository.findOne({
            where: { id: selectedAddon.addonId },
          });

          if (addon) {
            enrichedAddons.push({
              addonId: selectedAddon.addonId,
              name: addon.name,
              quantity: selectedAddon.quantity,
              unitPrice: Number(addon.unitPrice),
              totalPrice: Number(addon.unitPrice) * selectedAddon.quantity,
            });
          } else {
            // Addon not found, keep original data
            enrichedAddons.push(selectedAddon);
          }
        }

        item.selectedAddons = enrichedAddons as any;
      }
    }

    return cart;
  }

  /**
   * Clear cart
   */
  async clearCart(
    tenantId: string,
    sessionId?: string,
    customerId?: string,
  ): Promise<FoodCourtCart> {
    const cart = await this.getOrCreateCart(tenantId, sessionId, customerId);
    cart.items = [];
    cart.totalAmount = 0;
    return await this.cartRepository.save(cart);
  }

  /**
   * Get food court payment model from tenant settings
   * Returns 'pay_first' (consolidated payment) or 'pay_at_counter' (pay at each restaurant)
   */
  private getFoodCourtPaymentModel(tenant: Tenant): 'pay_first' | 'pay_at_counter' {
    // Check tenant settings for payment model
    const paymentModel = tenant.settings?.paymentModel || tenant.settings?.paymentTiming;
    if (paymentModel === 'pay_first' || paymentModel === 'pay_at_counter') {
      return paymentModel;
    }
    // Default to pay_at_counter if not specified
    return 'pay_at_counter';
  }

  /**
   * Get food court payment model info
   */
  async getFoodCourtPaymentModelInfo(tenantId: string): Promise<{
    paymentModel: 'pay_first' | 'pay_at_counter';
    allowConsolidatedBilling: boolean;
    description: string;
  }> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.type !== TenantType.FOOD_COURT) {
      throw new BadRequestException('This endpoint is only available for food court tenants');
    }

    const paymentModel = this.getFoodCourtPaymentModel(tenant);
    const allowConsolidatedBilling = tenant.settings?.allowConsolidatedBilling ?? true;

    return {
      paymentModel,
      allowConsolidatedBilling,
      description: paymentModel === 'pay_first'
        ? 'Pay once by card, system automatically splits orders to restaurants. Orders go to kitchen immediately after payment.'
        : 'Pay at each restaurant counter. Orders stay pending until payment is processed at the counter.',
    };
  }

  /**
   * Create orders from cart (one order per restaurant)
   * Handles both payment models:
   * - pay_first: Process consolidated payment, auto-confirm all orders
   * - pay_at_counter: Create orders in PENDING, wait for payment at each counter
   */
  async createOrdersFromCart(
    tenantId: string,
    createOrderDto: CreateOrderFromCartDto,
    sessionId?: string,
    customerId?: string,
  ): Promise<{
    orders: Array<{
      id: string;
      orderNumber: string;
      restaurantId: string;
      restaurantName: string;
      status: string;
      subtotal: number;
      serviceCharge: number;
      tax: number;
      discount: number;
      totalAmount: number;
      paymentMethod: string | null;
      paymentStatus: string | null;
      orderType: string;
      itemCount: number;
      items: any[];
      createdAt: Date;
    }>;
    customer: {
      phone: string;
      name: string;
    };
    totalAmount: number;
    paymentModel: string;
    consolidatedPaymentId?: string;
    paymentStatus: string;
    message: string;
  }> {
    const cart = await this.getCart(tenantId, sessionId, customerId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Get tenant and payment model
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const paymentModel = this.getFoodCourtPaymentModel(tenant);

    // Group items by restaurant
    const itemsByRestaurant = new Map<string, typeof cart.items>();
    for (const item of cart.items) {
      if (!itemsByRestaurant.has(item.restaurantId)) {
        itemsByRestaurant.set(item.restaurantId, []);
      }
      itemsByRestaurant.get(item.restaurantId)!.push(item);
    }

    // Create separate order for each restaurant
    const orders = [];
    let grandTotal = 0;

    // Validate payment method based on food court payment model
    // For pay_first model, payment method is required and must be card/qr/cash (not cashier)
    // For pay_at_counter model, payment method is optional:
    //   - If provided (card/qr/cash): payment happens immediately, order confirmed
    //   - If not provided or cashier: payment at counter, order pending
    if (paymentModel === 'pay_first') {
      if (!createOrderDto.paymentMethod) {
        throw new BadRequestException('Payment method is required for pay_first model');
      }
      if (createOrderDto.paymentMethod === 'cashier') {
        throw new BadRequestException('Cashier payment method is not allowed for pay_first model. Use card, qr, or cash.');
      }
    }

    for (const [restaurantId, items] of itemsByRestaurant.entries()) {
      // Get restaurant to check its payment timing
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw new NotFoundException(`Restaurant ${restaurantId} not found`);
      }

      // Determine payment method based on food court payment model and what customer provided
      // - pay_first: always use provided payment method (card, qr, cash)
      // - pay_at_counter with payment method provided: use provided method (card, qr, cash) - order will be auto-confirmed
      // - pay_at_counter without payment method: use 'cashier' (payment at counter) - order stays pending
      const orderPaymentMethod = createOrderDto.paymentMethod || 'cashier';

      // Prepare order DTO for this restaurant
      const orderDto: CreateCustomerPortalOrderDto = {
        restaurantId,
        phone: createOrderDto.phone,
        customerName: createOrderDto.customerName,
        tableNo: createOrderDto.tableNo || cart.tableNo,
        tableId: createOrderDto.tableId || cart.tableId,
        qrCodeId: createOrderDto.qrCodeId || cart.qrCodeId,
        orderType: createOrderDto.orderType || cart.orderType || 'dine_in',
        paymentMethod: orderPaymentMethod as any,
        // Vehicle info for parking orders
        vehicleModel: createOrderDto.vehicleModel,
        vehicleNumber: createOrderDto.vehicleNumber,
        orderItems: items.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          selectedAddons: item.selectedAddons,
        })),
      };

      // Create order using existing customer portal service
      const order = await this.customerPortalService.createOrder(orderDto);

      // Enhance order with restaurant info and item details
      const enhancedOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        status: order.status,
        subtotal: order.subtotal,
        serviceCharge: order.serviceCharge,
        tax: order.tax,
        discount: order.discount,
        totalAmount: parseFloat(order.totalAmount.toString()),
        paymentMethod: order.paymentMethod || null,
        paymentStatus: order.paymentStatus || null,
        orderType: order.orderType || 'dine_in',
        itemCount: order.itemsByCategory?.reduce((sum: number, cat: any) => sum + cat.items.length, 0) || 0,
        items: order.itemsByCategory || [],
        createdAt: order.createdAt,
      };

      orders.push(enhancedOrder);
      grandTotal += parseFloat(order.totalAmount.toString());
    }

    // For pay_first model: Process consolidated payment and auto-confirm all orders
    let consolidatedPaymentId: string | undefined;
    let overallPaymentStatus = 'pending';

    if (paymentModel === 'pay_first' && createOrderDto.paymentMethod) {
      // Process consolidated payment for all orders
      const payment = this.paymentRepository.create({
        orderId: orders[0].id, // Use first order ID as reference (or create a consolidated payment record)
        method: createOrderDto.paymentMethod as PaymentMethod,
        amount: grandTotal,
        status: PaymentStatus.PAID,
      });
      const savedPayment = await this.paymentRepository.save(payment);
      consolidatedPaymentId = savedPayment.id;
      overallPaymentStatus = 'paid';

      // Create payment records for each order and auto-confirm them
      for (const order of orders) {
        // Create payment for this order
        const orderPayment = this.paymentRepository.create({
          orderId: order.id,
          method: createOrderDto.paymentMethod as PaymentMethod,
          amount: parseFloat(order.totalAmount.toString()),
          status: PaymentStatus.PAID,
        });
        await this.paymentRepository.save(orderPayment);

        // Update order object with payment info
        order.paymentMethod = createOrderDto.paymentMethod;
        order.paymentStatus = 'paid';

        // Auto-confirm order (send to kitchen)
        if (order.status === OrderStatusEnum.PENDING) {
          order.status = OrderStatusEnum.CONFIRMED;
          await this.orderRepository.save(await this.orderRepository.findOne({ where: { id: order.id } }));
          this.logger.log(`Order ${order.orderNumber} auto-confirmed after consolidated payment (pay_first model)`);
        }
      }
    } else if (createOrderDto.paymentMethod && createOrderDto.paymentMethod !== 'cashier') {
      // pay_at_counter with immediate payment
      overallPaymentStatus = 'paid';
    } else {
      // pay_at_counter without payment or with cashier method
      overallPaymentStatus = 'pending';
    }

    // Clear cart after successful order creation
    await this.clearCart(tenantId, sessionId, customerId);

    // Generate success message based on payment model
    let message = '';
    if (paymentModel === 'pay_first') {
      message = `Orders created and payment processed successfully. All orders sent to kitchen.`;
    } else if (overallPaymentStatus === 'paid') {
      message = `Orders created and payment processed successfully. Orders sent to kitchen.`;
    } else {
      message = `Orders created successfully. Please proceed to each restaurant counter for payment.`;
    }

    return {
      orders,
      customer: {
        phone: createOrderDto.phone,
        name: createOrderDto.customerName,
      },
      totalAmount: grandTotal,
      paymentModel,
      consolidatedPaymentId,
      paymentStatus: overallPaymentStatus,
      message,
    };
  }

  /**
   * Calculate cart total (preview before checkout)
   */
  async calculateCartTotal(
    tenantId: string,
    sessionId?: string,
    customerId?: string,
  ): Promise<{
    itemsByRestaurant: Array<{
      restaurantId: string;
      restaurantName: string;
      items: any[];
      subtotal: number;
      serviceCharge: number;
      total: number;
    }>;
    totalAmount: number;
    subtotal: number;
    serviceCharge: number;
    itemCount: number;
  }> {
    const cart = await this.getCart(tenantId, sessionId, customerId);

    // Group items by restaurant
    const itemsByRestaurant = new Map<string, { restaurantName: string; items: any[] }>();

    for (const item of cart.items) {
      if (!itemsByRestaurant.has(item.restaurantId)) {
        itemsByRestaurant.set(item.restaurantId, {
          restaurantName: item.restaurantName,
          items: [],
        });
      }
      itemsByRestaurant.get(item.restaurantId)!.items.push(item);
    }

    // Calculate subtotals and service charges
    const restaurantGroups = [];
    let grandSubtotal = 0;
    let grandServiceCharge = 0;

    for (const [restaurantId, data] of itemsByRestaurant.entries()) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: restaurantId },
      });

      const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const serviceCharge = restaurant ? this.calculateServiceCharge(subtotal, restaurant) : 0;
      const total = parseFloat((subtotal + serviceCharge).toFixed(2));

      restaurantGroups.push({
        restaurantId,
        restaurantName: data.restaurantName,
        items: data.items,
        subtotal,
        serviceCharge,
        total,
      });

      grandSubtotal += subtotal;
      grandServiceCharge += serviceCharge;
    }

    const grandTotal = parseFloat((grandSubtotal + grandServiceCharge).toFixed(2));

    return {
      itemsByRestaurant: restaurantGroups,
      subtotal: grandSubtotal,
      serviceCharge: grandServiceCharge,
      totalAmount: grandTotal,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  /**
   * Get order status dashboard grouped by restaurant
   * Returns all orders for a customer in a food court, grouped by restaurant
   */
  async getOrderStatusDashboard(
    tenantId: string,
    phone: string,
    activeOnly: boolean = true,
  ): Promise<{
    ordersByRestaurant: Array<{
      restaurantId: string;
      restaurantName: string;
      orders: Array<{
        id: string;
        orderNumber: string;
        status: string;
        totalAmount: number;
        itemCount: number;
        createdAt: Date;
        estimatedReadyTime?: Date;
      }>;
      overallStatus: string; // 'not_started' | 'preparing' | 'ready' | 'completed'
    }>;
    totalOrders: number;
    totalAmount: number;
  }> {
    // Validate tenant
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.type !== TenantType.FOOD_COURT) {
      throw new BadRequestException('This endpoint is only available for food court tenants');
    }

    // Get all restaurants in this food court
    const restaurants = await this.restaurantRepository.find({
      where: { tenantId },
    });

    // Get customer by phone - handle both old and new customers
    const normalizedInputPhone = this.normalizePhone(phone);
    const restaurantIds = restaurants.map(r => r.id);

    // Get all orders for this phone number across all restaurants in this tenant
    // This handles restaurant-scoped customers (each restaurant has its own customer record)
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .where('restaurant.tenantId = :tenantId', { tenantId })
      .andWhere('customer.phone = :phone', { phone })
      .orderBy('order.createdAt', 'DESC')
      .getMany();

    // If no orders found with exact phone match, try normalized phone matching
    let finalOrders = orders;
    if (orders.length === 0) {
      const allOrders = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.customer', 'customer')
        .leftJoinAndSelect('order.restaurant', 'restaurant')
        .leftJoinAndSelect('order.orderItems', 'orderItems')
        .where('restaurant.tenantId = :tenantId', { tenantId })
        .orderBy('order.createdAt', 'DESC')
        .getMany();

      finalOrders = allOrders.filter(order =>
        order.customer && this.normalizePhone(order.customer.phone) === normalizedInputPhone
      );
    }

    // Filter orders based on activeOnly flag
    const filteredOrders = activeOnly
      ? finalOrders.filter(
        order => order.status !== OrderStatusEnum.COMPLETED &&
          order.status !== OrderStatusEnum.CANCELLED &&
          order.status !== OrderStatusEnum.ABANDONED
      )
      : finalOrders;

    // Group orders by restaurant
    const ordersByRestaurant = new Map<string, {
      restaurantName: string;
      orders: any[];
    }>();

    for (const order of filteredOrders) {
      const restaurantId = order.restaurantId;
      if (!ordersByRestaurant.has(restaurantId)) {
        const restaurant = restaurants.find(r => r.id === restaurantId);
        ordersByRestaurant.set(restaurantId, {
          restaurantName: restaurant?.name || 'Unknown Restaurant',
          orders: [],
        });
      }
      ordersByRestaurant.get(restaurantId)!.orders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount.toString()),
        itemCount: order.orderItems?.length || 0,
        createdAt: order.createdAt,
      });
    }

    // Determine overall status for each restaurant
    const restaurantGroups = Array.from(ordersByRestaurant.entries()).map(([restaurantId, data]) => {
      const orderStatuses = data.orders.map(o => o.status);
      let overallStatus = 'not_started';

      if (orderStatuses.some(s => s === OrderStatusEnum.READY || s === OrderStatusEnum.SERVED)) {
        overallStatus = 'ready';
      } else if (orderStatuses.some(s => s === OrderStatusEnum.PREPARING || s === OrderStatusEnum.CONFIRMED)) {
        overallStatus = 'preparing';
      } else if (orderStatuses.some(s => s === OrderStatusEnum.PENDING)) {
        overallStatus = 'not_started';
      }

      return {
        restaurantId,
        restaurantName: data.restaurantName,
        orders: data.orders,
        overallStatus,
      };
    });

    const totalAmount = filteredOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0);

    return {
      ordersByRestaurant: restaurantGroups,
      totalOrders: filteredOrders.length,
      totalAmount,
    };
  }

  /**
   * Process payment at counter for a specific order (pay_at_counter model)
   */
  async processPaymentAtCounter(
    orderId: string,
    paymentMethod: PaymentMethod,
    amount: number,
  ): Promise<{ order: Order; payment: Payment }> {
    // Get order
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant', 'customer'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate payment amount
    if (Math.abs(parseFloat(amount.toString()) - parseFloat(order.totalAmount.toString())) > 0.01) {
      throw new BadRequestException(`Payment amount ${amount} does not match order total ${order.totalAmount}`);
    }

    // Create payment
    const payment = this.paymentRepository.create({
      orderId: order.id,
      method: paymentMethod,
      amount: parseFloat(amount.toString()),
      status: PaymentStatus.PAID,
    });
    const savedPayment = await this.paymentRepository.save(payment);

    // Auto-complete based on order status
    if (order.status === OrderStatusEnum.PENDING) {
      // Pay-first: Confirm order and send to kitchen
      order.status = OrderStatusEnum.CONFIRMED;
      await this.orderRepository.save(order);
      this.logger.log(`Order ${order.orderNumber} confirmed after payment at counter (pay-first)`);
    } else if (order.status === OrderStatusEnum.SERVED) {
      // Pay-last: Order is served, mark as completed
      order.status = OrderStatusEnum.COMPLETED;
      await this.orderRepository.save(order);
      this.logger.log(`Order ${order.orderNumber} auto-completed after payment (SERVED + PAID → COMPLETED)`);
    }

    return {
      order,
      payment: savedPayment,
    };
  }

  /**
   * Helper method to calculate item price including variants
   * Matches restaurant order calculation logic exactly
   * Supports both food court format and restaurant format
   */
  private calculateItemPrice(menu: Menu, specialInstructions: any): number {
    let finalPrice = Number(menu.price);
    const discountPercentage = menu.discount || 0;

    // Validate base price
    if (isNaN(finalPrice) || finalPrice < 0) {
      throw new BadRequestException(`Invalid base price for menu item ${menu.name} (${menu.price})`);
    }

    // If no special instructions, return base price with discount
    if (!specialInstructions) {
      this.logger.log(`No special instructions for ${menu.name}, using base price: ${finalPrice}`);
      if (discountPercentage > 0) {
        const discountAmount = (finalPrice * discountPercentage) / 100;
        finalPrice = parseFloat((finalPrice - discountAmount).toFixed(2));
        this.logger.log(`Applied ${discountPercentage}% discount: ${finalPrice}`);
      }
      return finalPrice;
    }

    let instructions = specialInstructions;

    // Handle JSON string input
    if (typeof specialInstructions === 'string') {
      try {
        instructions = JSON.parse(specialInstructions);
      } catch (e) {
        this.logger.warn(`Failed to parse specialInstructions for ${menu.name}, using base price`);
        // Return base price with discount if parsing fails
        if (discountPercentage > 0) {
          const discountAmount = (finalPrice * discountPercentage) / 100;
          finalPrice = parseFloat((finalPrice - discountAmount).toFixed(2));
        }
        return finalPrice;
      }
    }

    // If instructions is an object, check for variant pricing
    if (instructions && typeof instructions === 'object') {
      // Food court format: { variantName: "Size", options: [{name: "Large", price: 2000}] }
      if (instructions.options && Array.isArray(instructions.options) && instructions.options.length > 0) {
        const selectedOption = instructions.options[0];
        if (selectedOption.price !== undefined) {
          finalPrice = Number(selectedOption.price);
          this.logger.log(`[Food Court Format] Using variant price for ${menu.name}: ${finalPrice} (variant: ${selectedOption.name})`);
        }
      }
      // Restaurant format: { portion: "Large" } or { "Variant Name": "Option" }
      else if (menu.variantOptions && Array.isArray(menu.variantOptions)) {
        const instructionsObj = instructions as Record<string, any>;

        // Process each variant option to find price overrides
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
            this.logger.log(`Using variant price for ${menu.name}: ${finalPrice} (variant: ${variantOption.name}, value: ${selectedVariantValue})`);
            break; // Stop at first price override
          }
        }
      } else {
        this.logger.log(`No variant options available for ${menu.name}, using base price`);
      }
    }

    // Apply discount if any
    if (discountPercentage > 0) {
      const discountAmount = (finalPrice * discountPercentage) / 100;
      const priceBeforeDiscount = finalPrice;
      finalPrice = parseFloat((finalPrice - discountAmount).toFixed(2));
      this.logger.log(`Applied ${discountPercentage}% discount to ${menu.name}: ${priceBeforeDiscount} → ${finalPrice}`);
    }

    return finalPrice;
  }

  /**
   * Calculate service charge based on restaurant settings
   */
  private calculateServiceCharge(subtotal: number, restaurant: Restaurant): number {
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
