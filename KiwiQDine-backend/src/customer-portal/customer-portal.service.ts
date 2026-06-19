import { Injectable, NotFoundException, BadRequestException, Inject, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { QRCode, Restaurant, Menu, Order, OrderItem, Customer, Table, TableStatus, Payment, PaymentMethod, PaymentStatus, Tenant, TenantType, OrderAction, Addon, OrderItemAddon, Category } from '../infrastructure/database/entities';
import { OrderActivityLogService } from '../order-status/order-activity-log.service';
import { OrderStatus as OrderStatusEnum } from '../infrastructure/database/entities/order.entity';
import { OrderStatusGateway } from '../order-status/order-status.gateway';
import { TYPES } from '../application/constants';
import { ISubscriptionService } from '../subscription/subscription-service.interface';
import { CreateCustomerPortalOrderDto } from './dto/create-customer-portal-order.dto';
import { UpdateRestaurantWalletDto } from './dto/update-restaurant-wallet.dto';
import { CustomerVerificationDto } from './dto/customer-verification.dto';
import { PaginationDto, PaginationResponse } from '../shared/dto/pagination.dto';
import { BadgeService } from '../badge/badge.service';
import { MenuService } from '../menu/menu.service';

@Injectable()
export class CustomerPortalService {
  private readonly logger = new Logger(CustomerPortalService.name);
  constructor(
    @InjectRepository(QRCode)
    private qrCodeRepository: Repository<QRCode>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Addon)
    private addonRepository: Repository<Addon>,
    @InjectRepository(OrderItemAddon)
    private orderItemAddonRepository: Repository<OrderItemAddon>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @Inject(TYPES.ISubscriptionService)
    private readonly subscriptionService: ISubscriptionService,
    private readonly orderStatusGateway: OrderStatusGateway,
    private readonly orderActivityLogService: OrderActivityLogService,
    private readonly badgeService: BadgeService,
    private readonly menuService: MenuService,
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

  async getQRCodeInfo(code: string) {
    // Note: QRCode entity now uses qrUrl instead of code
    // This method may need to be updated based on requirements
    const qrCode = await this.qrCodeRepository.findOne({
      where: { id: code },
      relations: ['restaurant', 'restaurant.tenant'],
    });

    if (!qrCode || qrCode.status !== 'active') {
      throw new NotFoundException('QR code not found or inactive');
    }

    if (qrCode.restaurant) {
      // Map QR code type to suggested order type
      let suggestedOrderType: 'takeaway' | 'dine_in' | 'parking' = 'dine_in';
      if (qrCode.type === 'PARKING') {
        suggestedOrderType = 'parking';
      } else if (qrCode.type === 'TAKE_AWAY') {
        suggestedOrderType = 'takeaway';
      }

      return {
        type: 'restaurant',
        qrCode: {
          id: qrCode.id,
          type: qrCode.type, // QR code type: TABLE, FOOD_COURT, TAKE_AWAY, PARKING
          suggestedOrderType, // Suggested order type based on QR code type
        },
        restaurant: {
          id: qrCode.restaurant.id,
          name: qrCode.restaurant.name,
          logo: qrCode.restaurant.logo,
          address: qrCode.restaurant.address,
          contactEmail: qrCode.restaurant.contactEmail,
          contactPhoneNumber: qrCode.restaurant.contactPhoneNumber,
          openTime: qrCode.restaurant.openTime,
          closeTime: qrCode.restaurant.closeTime,
          openHours: qrCode.restaurant.openHours,
          paymentTiming: qrCode.restaurant.paymentTiming, // pay_at_first or pay_at_last
          tenantId: qrCode.restaurant.tenantId,
          serviceChargePercentage: qrCode.restaurant.serviceChargePercentage,
          applyServiceCharge: qrCode.restaurant.applyServiceCharge,
          serviceChargeType: qrCode.restaurant.serviceChargeType,
          fixedServiceCharge: qrCode.restaurant.fixedServiceCharge,
          tenant: qrCode.restaurant.tenant ? {
            id: qrCode.restaurant.tenant.id,
            name: qrCode.restaurant.tenant.name,
            type: qrCode.restaurant.tenant.type,
          } : null,
        },
      };
    }

    throw new NotFoundException('Invalid QR code');
  }

  async getQRCodeMenu(qrCodeId: string, badgesFilter?: string) {
    const qrCode = await this.qrCodeRepository.findOne({
      where: { id: qrCodeId },
      relations: ['restaurant', 'restaurant.tenant'],
    });

    if (!qrCode || qrCode.status !== 'active') {
      throw new NotFoundException('QR code not found or inactive');
    }

    if (!qrCode.restaurant) {
      throw new NotFoundException('Restaurant not found for this QR code');
    }

    // Try to find associated table by name or ID (qrCode.name might be table name or table ID)
    let table: Table | null = null;
    let tableStatusMessage: string | null = null;
    let tableAvailable = true;

    if (qrCode.name) {
      // Try to find table by name first
      table = await this.tableRepository.findOne({
        where: { name: qrCode.name, restaurantId: qrCode.restaurant.id },
      });

      // If not found by name, try by ID (in case qrCode.name is actually a table ID)
      if (!table) {
        try {
          table = await this.tableRepository.findOne({
            where: { id: qrCode.name, restaurantId: qrCode.restaurant.id },
          });
        } catch (error) {
          // If qrCode.name is not a valid UUID, ignore the error
        }
      }

      if (table) {
        // Check table status and set appropriate message
        if (table.status === TableStatus.MAINTENANCE) {
          tableAvailable = false;
          tableStatusMessage = 'This table is currently under maintenance and is not available for orders.';
        } else if (table.status === TableStatus.RESERVED) {
          tableAvailable = false;
          tableStatusMessage = 'This table is currently reserved and is not available for orders.';
        }
      }
    }

    let menus = await this.menuRepository.find({
      where: { restaurantId: qrCode.restaurant.id },
      relations: ['category'],
    });

    // Check for active badges
    const activeBadges = await this.badgeService.findActive(qrCode.restaurant.id);
    let filteredBadges = [];

    // Only process filtering if restaurant has active badges
    if (activeBadges.length > 0) {
      filteredBadges = activeBadges;

      if (badgesFilter) {
        const badgeCodes = badgesFilter.split(',').map(b => b.trim());
        if (badgeCodes.length > 0) {
          menus = menus.filter(menu =>
            menu.badges &&
            menu.badges.some(badge => badgeCodes.includes(badge))
          );
        }
      }
    }

    // Log tracking
    await this.orderActivityLogService.logAction(null, OrderAction.QR_SCANNED, undefined, `QR Code scanned: ${qrCodeId}`, null, {
      restaurantId: qrCode.restaurant.id,
      tenantId: qrCode.restaurant.tenantId,
      entityId: qrCodeId,
    });

    return {
      qrCode: {
        id: qrCode.id,
        tableId: qrCode.name, // Table ID/name from QR code
        type: qrCode.type,
      },
      table: table ? {
        id: table.id,
        name: table.name,
        tableNumber: table.tableNumber,
        status: table.status,
        available: tableAvailable,
        message: tableStatusMessage,
      } : null,
      restaurant: {
        id: qrCode.restaurant.id,
        name: qrCode.restaurant.name,
        logo: qrCode.restaurant.logo,
        address: qrCode.restaurant.address,
        contactEmail: qrCode.restaurant.contactEmail,
        contactPhoneNumber: qrCode.restaurant.contactPhoneNumber,
        openTime: qrCode.restaurant.openTime,
        closeTime: qrCode.restaurant.closeTime,
        openHours: qrCode.restaurant.openHours,
        paymentTiming: qrCode.restaurant.paymentTiming, // pay_at_first or pay_at_last
        tenantId: qrCode.restaurant.tenantId,
        serviceChargePercentage: qrCode.restaurant.serviceChargePercentage,
        applyServiceCharge: qrCode.restaurant.applyServiceCharge,
        serviceChargeType: qrCode.restaurant.serviceChargeType,
        fixedServiceCharge: qrCode.restaurant.fixedServiceCharge,
        tenant: qrCode.restaurant.tenant ? {
          id: qrCode.restaurant.tenant.id,
          name: qrCode.restaurant.tenant.name,
          type: qrCode.restaurant.tenant.type,
        } : null,
      },
      menus: menus.map(menu => ({
        id: menu.id,
        category: menu.category ? {
          id: menu.category.id,
          name: menu.category.name,
          code: menu.category.code,
          description: menu.category.description || null,
          image: menu.category.image || null,
          imageKey: menu.category.imageKey || null,
        } : null,
        name: menu.name,
        price: menu.price,
        image: menu.image,
        description: menu.description,
        note: menu.note,
        discount: menu.discount,
        quantityAvailable: menu.quantityAvailable,
        preparationTime: menu.preparationTime,
        isAvailable: menu.isAvailable,
        availableFrom: menu.availableFrom,
        availableTo: menu.availableTo,
        badges: menu.badges || [],
        variantOptions: menu.variantOptions || null,
      })),
      availableBadges: activeBadges.length > 0 ? activeBadges : undefined,
    };
  }

  async getRestaurantInfo(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
      relations: ['menus'],
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return {
      id: restaurant.id,
      name: restaurant.name,
      logo: restaurant.logo,
      address: restaurant.address,
      openHours: restaurant.openHours,
      serviceChargePercentage: restaurant.serviceChargePercentage,
      applyServiceCharge: restaurant.applyServiceCharge,
      serviceChargeType: restaurant.serviceChargeType,
      fixedServiceCharge: restaurant.fixedServiceCharge,
    };
  }

  async getRestaurantMenu(restaurantId: string, badgesFilter?: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    let menus = await this.menuRepository.find({
      where: { restaurantId: restaurant.id },
      relations: ['category'],
    });

    // Check for active badges
    const activeBadges = await this.badgeService.findActive(restaurant.id);
    let filteredBadges = [];

    // Only process filtering if restaurant has active badges
    if (activeBadges.length > 0) {
      filteredBadges = activeBadges;

      if (badgesFilter) {
        const badgeCodes = badgesFilter.split(',').map(b => b.trim());
        if (badgeCodes.length > 0) {
          menus = menus.filter(menu =>
            menu.badges &&
            menu.badges.some(badge => badgeCodes.includes(badge))
          );
        }
      }
    }

    // Log tracking
    await this.orderActivityLogService.logAction(null, OrderAction.MENU_VIEWED, undefined, `Restaurant menu viewed via direct link`, null, {
      restaurantId: restaurant.id,
      tenantId: restaurant.tenantId,
    });

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
      menus: menus.map(menu => ({
        id: menu.id,
        category: menu.category ? {
          id: menu.category.id,
          name: menu.category.name,
          code: menu.category.code,
          description: menu.category.description || null,
          image: menu.category.image || null,
          imageKey: menu.category.imageKey || null,
        } : null,
        name: menu.name,
        price: menu.price,
        image: menu.image,
        description: menu.description,
        note: menu.note,
        discount: menu.discount,
        quantityAvailable: menu.quantityAvailable,
        preparationTime: menu.preparationTime,
        isAvailable: menu.isAvailable,
        availableFrom: menu.availableFrom,
        availableTo: menu.availableTo,
        badges: menu.badges || [],
        variantOptions: menu.variantOptions || null,
      })),
      availableBadges: activeBadges.length > 0 ? activeBadges : undefined,
    };
  }

  async getRestaurantMenuWithFilters(
    restaurantId: string,
    filters: {
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
      hasDiscount?: boolean;
      badges?: string;
      sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'discount_desc' | 'best_match';
      page?: number;
      limit?: number;
    }
  ) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const { items, pagination } = await this.menuService.getMenusWithFilters(restaurantId, filters);

    // Get active badges for the response metadata so frontend can render filter options
    const activeBadges = await this.badgeService.findActive(restaurantId);

    // Get active categories for the response metadata
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .innerJoin('category.menus', 'menu')
      .where('menu.restaurantId = :restaurantId', { restaurantId })
      .andWhere('category.isActive = :isActive', { isActive: true })
      .select(['category.id', 'category.name', 'category.code', 'category.displayOrder'])
      .distinct(true)
      .orderBy('category.displayOrder', 'ASC')
      .getMany();

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        serviceChargePercentage: restaurant.serviceChargePercentage,
        applyServiceCharge: restaurant.applyServiceCharge,
        serviceChargeType: restaurant.serviceChargeType,
        fixedServiceCharge: restaurant.fixedServiceCharge,
        // currency: restaurant.currency || 'USD', // Fallback - removed as it doesn't exist on entity
      },
      menus: items,
      pagination,
      filters: {
        availableBadges: activeBadges,
        availableCategories: categories,
      }
    };
  }

  async getRestaurantBadges(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const activeBadges = await this.badgeService.findActive(restaurantId);

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
      badges: activeBadges,
    };
  }

  async getRestaurantCategories(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Get all unique categories that have menu items for this restaurant
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .innerJoin('category.menus', 'menu')
      .where('menu.restaurantId = :restaurantId', { restaurantId: restaurant.id })
      .select([
        'category.id',
        'category.name',
        'category.code',
        'category.description',
        'category.image',
        'category.imageKey',
        'category.displayOrder',
        'category.isShowcase',
        'category.isActive',
      ])
      .where('menu.restaurantId = :restaurantId', { restaurantId: restaurant.id })
      .andWhere('category.isActive = :isActive', { isActive: true })
      .distinct(true)
      .orderBy('category.displayOrder', 'ASC')
      .getMany();

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        code: category.code,
        description: category.description || null,
        image: category.image || null,
        imageKey: category.imageKey || null,
        displayOrder: category.displayOrder,
        isShowcase: category.isShowcase,
        isActive: category.isActive,
      })),
    };
  }

  async getFoodCourtRestaurants(tenantId: string) {
    // Validate tenant exists and is a food court
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.type !== TenantType.FOOD_COURT) {
      throw new BadRequestException('This endpoint is only available for food court tenants');
    }

    // Get all active restaurants for this food court tenant
    const restaurants = await this.restaurantRepository.find({
      where: {
        tenantId: tenantId,
        status: 'active',
        isActive: true,
      },
      order: {
        name: 'ASC',
      },
    });

    return restaurants.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      logo: restaurant.logo,
      address: restaurant.address,
      contactEmail: restaurant.contactEmail,
      contactPhoneNumber: restaurant.contactPhoneNumber,
      openTime: restaurant.openTime,
      closeTime: restaurant.closeTime,
      openHours: restaurant.openHours,
      status: restaurant.status,
      isActive: restaurant.isActive,
      paymentTiming: restaurant.paymentTiming,
      serviceChargePercentage: restaurant.serviceChargePercentage,
      applyServiceCharge: restaurant.applyServiceCharge,
      serviceChargeType: restaurant.serviceChargeType,
      fixedServiceCharge: restaurant.fixedServiceCharge,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    }));
  }

  async checkTableAvailability(tableId: string, restaurantId: string): Promise<{ available: boolean; table?: Table; message?: string }> {
    const table = await this.tableRepository.findOne({
      where: { id: tableId, restaurantId },
    });

    if (!table) {
      return {
        available: false,
        message: 'Table not found for this restaurant',
      };
    }

    // Allow orders from AVAILABLE and OCCUPIED tables (multiple orders per table allowed)
    // Block orders from MAINTENANCE and RESERVED tables
    if (table.status === TableStatus.MAINTENANCE) {
      return {
        available: false,
        table,
        message: 'This table is currently under maintenance and is not available for orders.',
      };
    }

    if (table.status === TableStatus.RESERVED) {
      return {
        available: false,
        table,
        message: 'This table is currently reserved and is not available for orders.',
      };
    }

    // AVAILABLE and OCCUPIED tables can accept orders
    return {
      available: true,
      table,
    };
  }

  async createOrder(createOrderDto: CreateCustomerPortalOrderDto) {
    try {
      const { restaurantId, phone, customerName, tableNo, tableId, qrCodeId, orderItems, paymentMethod, orderType, notes, vehicleModel, vehicleNumber } = createOrderDto;

      this.logger.log(`Creating order for restaurant ${restaurantId}, customer ${phone}, ${orderItems.length} items`);

      // DEBUG: Log the entire DTO to see what we're receiving
      this.logger.log(`[CustomerPortal] Full createOrderDto: ${JSON.stringify(createOrderDto)}`);
      this.logger.log(`[CustomerPortal] Order items received: ${orderItems.length}`);
      orderItems.forEach((item, index) => {
        this.logger.log(`[CustomerPortal] Item ${index}: menuId=${item.menuId}, hasSelectedAddons=${!!item.selectedAddons}, addonsCount=${item.selectedAddons?.length || 0}`);
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          this.logger.log(`[CustomerPortal] Item ${index} addons: ${JSON.stringify(item.selectedAddons)}`);
        }
      });

      // Validate required fields
      if (!phone || !customerName) {
        throw new BadRequestException('Phone number and customer name are required');
      }

      if (!orderItems || orderItems.length === 0) {
        throw new BadRequestException('Order must contain at least one item');
      }

      // Get restaurant to check payment timing
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      // DEBUG: Log restaurant settings
      this.logger.log(`[DEBUG] Restaurant ${restaurantId} settings:`);
      this.logger.log(`  - paymentTiming: ${restaurant.paymentTiming}`);
      this.logger.log(`  - requireWaiterConfirmation: ${restaurant.requireWaiterConfirmation}`);
      this.logger.log(`  - requireWaiterConfirmation type: ${typeof restaurant.requireWaiterConfirmation}`);

      // Check subscription limits before creating order
      const subscriptionCheck = await this.subscriptionService.canRestaurantCreateOrder(restaurantId);
      if (!subscriptionCheck.allowed) {
        this.logger.warn(`Order creation blocked for restaurant ${restaurantId}: ${subscriptionCheck.reason}`);
        throw new ForbiddenException(
          subscriptionCheck.reason || 'Order limit reached for current subscription plan'
        );
      }

      // Determine final payment method
      const finalPaymentMethod = paymentMethod;
      if (!finalPaymentMethod && restaurant.paymentTiming === 'pay_at_first') {
        throw new BadRequestException('Payment method is required for this restaurant');
      }

      // Determine initial order status based on payment method, restaurant timing, and order type
      // CRITICAL RULES:
      // 1. Parking/Takeaway with PAID payment (card/cash/qr): Auto-confirm immediately
      // 2. Parking/Takeaway with CASHIER payment: Stay PENDING until cashier processes
      // 3. Dine-in at pay-last restaurants: ONLY case where requireWaiterConfirmation matters
      // 4. Dine-in at pay-first restaurants: Auto-confirm if payment is PAID
      let initialStatus = OrderStatusEnum.PENDING;

      // Get tableNo from multiple sources with priority:
      // 1. tableNo directly provided in request (highest priority)
      // 2. tableId - fetch table name from database
      // 3. qrCodeId - fetch table name from QR code
      // Normalize empty strings to null for consistent checking
      let finalTableNo = tableNo && tableNo.trim() !== '' ? tableNo : null;

      this.logger.log(`[TableNo Debug] Initial tableNo from request: "${tableNo}"`);
      this.logger.log(`[TableNo Debug] tableId from request: "${tableId}"`);
      this.logger.log(`[TableNo Debug] qrCodeId from request: "${qrCodeId}"`);
      this.logger.log(`[TableNo Debug] Normalized finalTableNo: "${finalTableNo}"`);

      // Determine actual order type with fallback
      const actualOrderType = orderType || (tableId || finalTableNo ? 'dine_in' : 'takeaway');

      // Special handling for Parking and Takeaway orders
      // Auto-confirm if payment method is NOT cashier (i.e., customer already paid)
      if (actualOrderType === 'parking' || actualOrderType === 'takeaway') {
        if (finalPaymentMethod && finalPaymentMethod !== PaymentMethod.CASHIER) {
          // Customer paid by card/cash/qr → Auto-confirm
          initialStatus = OrderStatusEnum.CONFIRMED;
          this.logger.log(`${actualOrderType} order with ${finalPaymentMethod} payment - auto-confirmed immediately`);
        } else {
          // Cashier payment or no payment method → Stay PENDING
          initialStatus = OrderStatusEnum.PENDING;
          this.logger.log(`${actualOrderType} order with cashier payment - staying PENDING until cashier processes payment`);
        }
      }
      // Dine-in orders - check restaurant payment timing
      else if (restaurant.paymentTiming === 'pay_at_first') {
        // For pay_at_first dine-in restaurants:
        // - Auto-confirm if payment is PAID (not cashier)
        // - Stay PENDING if cashier payment
        if (finalPaymentMethod && finalPaymentMethod !== PaymentMethod.CASHIER) {
          initialStatus = OrderStatusEnum.CONFIRMED;
          this.logger.log(`Dine-in order at pay_at_first restaurant - ${finalPaymentMethod} payment received, auto-confirmed`);
        } else {
          initialStatus = OrderStatusEnum.PENDING;
          this.logger.log(`Dine-in order at pay_at_first restaurant - cashier payment, staying PENDING until payment processed`);
        }
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

      // Priority 1: Use provided tableNo if available
      if (finalTableNo) {
        this.logger.log(`[TableNo Debug] Using tableNo from request: "${finalTableNo}"`);
      }
      // Priority 2: If tableNo not provided but tableId is, fetch table name from database
      else if (tableId) {
        this.logger.log(`[TableNo Debug] tableNo not provided, fetching from tableId: ${tableId}`);
        const table = await this.tableRepository.findOne({
          where: { id: tableId },
        });
        if (table && table.name) {
          finalTableNo = table.name;
          this.logger.log(`[TableNo Debug] Got tableNo from table database: "${finalTableNo}"`);
        } else {
          this.logger.warn(`[TableNo Debug] Table with ID ${tableId} not found in database`);
        }
      }
      // Priority 3: If neither tableNo nor tableId provided, try qrCodeId
      else if (qrCodeId) {
        this.logger.log(`[TableNo Debug] tableNo and tableId not provided, fetching from qrCodeId: ${qrCodeId}`);
        const qrCode = await this.qrCodeRepository.findOne({
          where: { id: qrCodeId },
        });
        if (qrCode && qrCode.name) {
          finalTableNo = qrCode.name;
          this.logger.log(`[TableNo Debug] Got tableNo from QR code: "${finalTableNo}"`);
        } else {
          this.logger.warn(`[TableNo Debug] QR code with ID ${qrCodeId} not found in database`);
        }
      }

      this.logger.log(`[TableNo Debug] Final tableNo to be used: "${finalTableNo}"`);


      // Find or create customer using phone number
      // This is where customer details are stored during order verification
      let customer = await this.customerRepository.findOne({
        where: { phone: phone },
      });

      if (!customer) {
        // Create customer account from verification page (name + phone)
        this.logger.log(`Creating new customer account for phone: ${phone}, name: ${customerName}`);
        customer = this.customerRepository.create({
          phone: phone,
          name: customerName,
        });
        customer = await this.customerRepository.save(customer);
        this.logger.log(`Customer account created with ID: ${customer.id}`);
      } else {
        // Update customer name if provided (in case it changed)
        if (customerName && customer.name !== customerName) {
          customer.name = customerName;
          await this.customerRepository.save(customer);
        }
      }

      // Calculate total with variant pricing support
      let totalAmount = 0;
      for (const item of orderItems) {
        const menu = await this.menuRepository.findOne({
          where: { id: item.menuId },
        });
        if (!menu || menu.restaurantId !== restaurantId) {
          throw new BadRequestException(`Menu item ${item.menuId} is invalid for this restaurant`);
        }
        if (!menu.isAvailable) {
          throw new BadRequestException(`Menu item ${menu.name} is currently unavailable`);
        }

        // Calculate price using helper method
        const itemPrice = this.calculateItemPrice(menu, item.specialInstructions);
        this.logger.log(`Calculated price for item ${menu.name}: ${itemPrice} (Base: ${menu.price})`);

        // Calculate addon prices
        let itemAddonsTotal = 0;
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          for (const addonSelection of item.selectedAddons) {
            const addon = await this.addonRepository.findOne({
              where: { id: addonSelection.addonId },
            });

            if (!addon) {
              this.logger.warn(`Addon with ID ${addonSelection.addonId} not found during total calculation. Skipping.`);
              continue;
            }

            const addonUnitPrice = Number(addon.unitPrice);
            const addonQuantity = addonSelection.quantity || 1;
            const addonTotalPrice = addonUnitPrice * addonQuantity;
            itemAddonsTotal += addonTotalPrice;
          }
        }

        // Total for this item = (item price * quantity) + addons total
        const itemTotal = (itemPrice * item.quantity) + itemAddonsTotal;
        totalAmount += itemTotal;

        this.logger.log(`Item ${menu.name}: ${itemPrice} x ${item.quantity} + Addons: ${itemAddonsTotal} = ${itemTotal}`);
      }

      // Validate table availability if tableId is provided and update status to OCCUPIED
      let table: Table | null = null;
      if (tableId) {
        const tableCheck = await this.checkTableAvailability(tableId, restaurantId);
        if (!tableCheck.available) {
          throw new BadRequestException(tableCheck.message || 'Table is not available');
        }
        table = tableCheck.table;

        // Update table status to OCCUPIED when customer places an order
        if (table && table.status === TableStatus.AVAILABLE) {
          table.status = TableStatus.OCCUPIED;
          await this.tableRepository.save(table);
          this.logger.log(`Table ${table.name} (ID: ${tableId}) status updated to OCCUPIED for new order`);
        }
      }

      // Calculate order totals with service charge
      const subtotal = totalAmount; // Items total before service charge
      const serviceCharge = this.calculateServiceCharge(subtotal, restaurant);
      const tax = 0; // For future use
      const discount = 0; // For future use
      const finalTotal = parseFloat((subtotal + serviceCharge + tax - discount).toFixed(2));

      this.logger.log(`Order pricing - Subtotal: ${subtotal}, Service Charge: ${serviceCharge}, Total: ${finalTotal}`);

      // Generate unique order number with retry logic to handle race conditions
      let savedOrder: Order;
      let retries = 0;
      const maxRetries = 10; // Increased from 5 to handle race conditions better

      while (retries < maxRetries) {
        try {
          // Generate unique order number for this restaurant
          const orderNumber = await this.generateOrderNumber(restaurantId);

          // Ensure orderNumber is generated
          if (!orderNumber) {
            throw new BadRequestException('Failed to generate order number');
          }

          this.logger.log(`Generated order number: ${orderNumber} for restaurant ${restaurantId} (attempt ${retries + 1})`);

          const order = this.orderRepository.create({
            restaurantId,
            customerId: customer.id,
            tableNo: finalTableNo || null,
            tableId: tableId || null,
            orderType: orderType || (tableId || finalTableNo ? 'dine_in' : 'takeaway'), // Default: dine_in if table provided, otherwise takeaway
            status: initialStatus,
            subtotal,
            serviceCharge,
            tax,
            discount,
            totalAmount: finalTotal,
            orderNumber,
            notes: notes || null, // Add customer notes to order
            vehicleModel: vehicleModel || null, // Add vehicle model for parking orders
            vehicleNumber: vehicleNumber || null, // Add vehicle number for parking orders
            createdBy: customer.id, // Customer ID
            createdByType: 'customer', // Order created by customer via customer portal
          });

          savedOrder = await this.orderRepository.save(order);
          break; // Success, exit retry loop
        } catch (error: any) {
          // Check if it's a duplicate key error for orderNumber
          if (error?.code === '23505' || error?.message?.includes('duplicate key') || error?.message?.includes('unique constraint')) {
            retries++;
            if (retries >= maxRetries) {
              this.logger.error(`Failed to generate unique order number after ${maxRetries} attempts`);
              throw new BadRequestException('Failed to create order: Unable to generate unique order number. Please try again.');
            }
            // Wait a bit before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
            this.logger.warn(`Order number collision detected, retrying... (attempt ${retries + 1}/${maxRetries})`);
          } else {
            // Not a duplicate key error, re-throw
            throw error;
          }
        }
      }

      // Log saved order number for debugging
      this.logger.log(`Saved order with orderNumber: ${savedOrder.orderNumber} (ID: ${savedOrder.id})`);

      // try {
      //   await this.subscriptionService.recordOrderUsage(
      //     restaurantId,
      //     savedOrder.createdAt ?? new Date(),
      //     1,
      //   );
      // } catch (error) {
      //   const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      //   this.logger.warn(
      //     `Failed to record subscription usage for restaurant ${restaurantId}: ${errorMessage}`,
      //   );
      // }

      // Create order items
      const orderItemsToCreate = [];
      for (const item of orderItems) {
        // DEBUG: Log what we received
        this.logger.log(`[CustomerPortal] Processing order item: ${item.menuId}`);
        this.logger.log(`[CustomerPortal] Item has selectedAddons: ${!!item.selectedAddons}`);
        this.logger.log(`[CustomerPortal] selectedAddons length: ${item.selectedAddons?.length || 0}`);
        this.logger.log(`[CustomerPortal] selectedAddons data: ${JSON.stringify(item.selectedAddons)}`);

        const menu = await this.menuRepository.findOne({
          where: { id: item.menuId },
          relations: ['category'],
        });

        if (!menu) {
          this.logger.error(`Menu item ${item.menuId} not found when creating order items`);
          throw new BadRequestException(`Menu item ${item.menuId} not found`);
        }

        if (menu.restaurantId !== restaurantId) {
          throw new BadRequestException(`Menu item ${item.menuId} does not belong to restaurant ${restaurantId}`);
        }

        // Handle specialInstructions: serialize objects to JSON string, keep strings as-is
        let specialInstructionsValue: string | object | null = null;
        if (item.specialInstructions !== undefined && item.specialInstructions !== null) {
          if (typeof item.specialInstructions === 'object') {
            // Serialize object to JSON string - transformer will handle deserialization when reading
            specialInstructionsValue = JSON.stringify(item.specialInstructions);
          } else {
            // It's already a string, pass as-is
            specialInstructionsValue = item.specialInstructions;
          }
        }

        // Calculate correct price including variants using helper method
        const itemUnitPrice = this.calculateItemPrice(menu, item.specialInstructions);

        // Handle Addons - Independent quantity pricing
        let itemAddonsTotal = 0;
        const itemSelectedAddons = [];

        if (item.selectedAddons && item.selectedAddons.length > 0) {
          this.logger.log(`[CustomerPortal] Processing ${item.selectedAddons.length} addons for item ${menu.name}`);
          for (const addonSelection of item.selectedAddons) {
            const addon = await this.addonRepository.findOne({
              where: { id: addonSelection.addonId },
            });

            if (!addon) {
              this.logger.warn(`[CustomerPortal] Addon with ID ${addonSelection.addonId} not found. Skipping.`);
              continue;
            }

            this.logger.log(`[CustomerPortal] Found addon: ${addon.name} (Price: ${addon.unitPrice})`);

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
          this.logger.log(`[CustomerPortal] No addons to process for item ${menu.name}`);
        }

        // Addon logic: Addons are independent of item quantity
        // Example: 1 Kothu ($500) + 2 Eggs ($50 each) = $500 + $100 = $600
        // Example: 2 Kothu ($500) + 2 Eggs ($50 each) = $1000 + $100 = $1100
        const recalculatedItemTotal = (itemUnitPrice * item.quantity) + itemAddonsTotal;

        this.logger.log(`[CustomerPortal] Item total: ${itemUnitPrice} x ${item.quantity} + Addons: ${itemAddonsTotal} = ${recalculatedItemTotal}`);

        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          menuId: menu.id,
          quantity: item.quantity,
          unitPrice: itemUnitPrice,
          totalPrice: recalculatedItemTotal,
          specialInstructions: specialInstructionsValue,
          status: 'pending',
          estimatedPreparationTime: menu.preparationTime || 0,
          originalPreparationTime: menu.preparationTime || 0,
        });

        const savedOrderItem = await this.orderItemRepository.save(orderItem);

        // Save addons for this order item
        if (itemSelectedAddons && itemSelectedAddons.length > 0) {
          this.logger.log(`[CustomerPortal] Saving ${itemSelectedAddons.length} addons for order item ${savedOrderItem.id}`);
          for (const addonData of itemSelectedAddons) {
            const orderItemAddon = this.orderItemAddonRepository.create({
              orderItemId: savedOrderItem.id,
              orderItem: savedOrderItem,
              addonId: addonData.addonId,
              quantity: addonData.quantity,
              unitPrice: addonData.unitPrice,
              totalPrice: addonData.totalPrice,
            });
            const savedAddon = await this.orderItemAddonRepository.save(orderItemAddon);
            this.logger.log(`[CustomerPortal] Saved addon ${addonData.name} (ID: ${savedAddon.id}) for order item ${savedOrderItem.id}`);
          }
        } else {
          this.logger.warn(`[CustomerPortal] No addons to save for order item ${savedOrderItem.id}`);
        }

        orderItemsToCreate.push(savedOrderItem);
      }

      if (orderItemsToCreate.length === 0) {
        throw new BadRequestException('No valid order items to create');
      }

      // Create Payment entity with the selected payment method (if provided)
      // If payment method is CASHIER, payment status is PENDING (cashier will mark as paid later)
      // For other methods (CASH, CARD, QR), payment status is PAID
      if (finalPaymentMethod) {
        const paymentStatus = finalPaymentMethod === PaymentMethod.CASHIER
          ? PaymentStatus.PENDING
          : PaymentStatus.PAID;

        const payment = this.paymentRepository.create({
          orderId: savedOrder.id,
          method: finalPaymentMethod,
          amount: finalTotal,
          status: paymentStatus,
        });
        await this.paymentRepository.save(payment);
      }


      //process payment based on restaurant payment timing settings
      if (restaurant.paymentTiming === 'pay_at_first' || actualOrderType === 'parking' || actualOrderType === 'takeaway') {
        // Record subscription usage for the restaurant
        await this.subscriptionService.recordOrderUsage(restaurantId);

        // Update restaurant wallet balance
        if (paymentMethod === PaymentMethod.CARD) {
          const updateWallet: UpdateRestaurantWalletDto = {
            restaurantId: restaurantId,
            totalBalance: finalTotal,
          };
          await this.updateRestaurantWallet(updateWallet);
        }
      }

      // Reload order with all relations for formatted response
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

      // If order not found after save, something went wrong
      if (!fullOrder) {
        this.logger.error(`Order ${savedOrder.id} not found after save. Using savedOrder data.`);
        // Fallback to savedOrder with minimal data
        const fallbackOrder = {
          ...savedOrder,
          orderItems: orderItemsToCreate,
          customer: customer,
          restaurant: await this.restaurantRepository.findOne({ where: { id: restaurantId } }),
        };
        return this.formatOrderWithGroupedItems(fallbackOrder as Order);
      }

      // Debug: Log addon data for each order item
      if (fullOrder.orderItems) {
        fullOrder.orderItems.forEach(item => {
          const addonCount = item.orderItemAddons?.length || 0;
          this.logger.log(`[CustomerPortal] Order item ${item.id} (${item.menu?.name}) has ${addonCount} addons loaded`);
          if (addonCount > 0) {
            item.orderItemAddons.forEach(addon => {
              this.logger.log(`  - Addon: ${addon.addon?.name || addon.addonId} (Qty: ${addon.quantity}, Price: ${addon.totalPrice})`);
            });
          }
        });
      }

      // Ensure orderNumber is present (fallback to savedOrder.orderNumber if fullOrder doesn't have it)
      if (!fullOrder.orderNumber && savedOrder.orderNumber) {
        fullOrder.orderNumber = savedOrder.orderNumber;
        this.logger.warn(`Order ${fullOrder.id} missing orderNumber, using savedOrder.orderNumber: ${savedOrder.orderNumber}`);
      }

      // Final check - if still no orderNumber, generate one (shouldn't happen, but safety check)
      if (!fullOrder.orderNumber) {
        this.logger.error(`Order ${fullOrder.id} has no orderNumber! Generating new one...`);
        fullOrder.orderNumber = await this.generateOrderNumber(restaurantId);
        await this.orderRepository.update(fullOrder.id, { orderNumber: fullOrder.orderNumber });
      }

      const formattedOrder = this.formatOrderWithGroupedItems(fullOrder);

      // Broadcast new order to restaurant/food court via WebSocket
      await this.orderStatusGateway.broadcastNewOrder(fullOrder);

      // Broadcast order update to all subscribed clients (customer, waiters, kitchen)
      await this.orderStatusGateway.broadcastOrderUpdate(fullOrder);

      this.logger.log(`[Customer Portal] Order ${fullOrder.orderNumber} created and broadcasted via WebSocket`);

      return formattedOrder;
    } catch (error) {
      this.logger.error(`Error creating order: ${error instanceof Error ? error.message : JSON.stringify(error)}`, error instanceof Error ? error.stack : '');
      // Re-throw BadRequestException and NotFoundException as-is
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Wrap other errors in BadRequestException with more context
      throw new BadRequestException(
        `Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Public endpoint logic to update a restaurant wallet.
   * This method can be called from the frontend (via controller) to update
   * the restaurant's wallet balance using an amount provided by the client.
   */
  async updateRestaurantWallet(updateDto: UpdateRestaurantWalletDto) {
    const { restaurantId, totalBalance } = updateDto;

    // Basic validation
    if (!restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }
    if (totalBalance === undefined || totalBalance === null || isNaN(Number(totalBalance))) {
      throw new BadRequestException('totalBalance must be a valid number');
    }

    try {
      const restaurant = await this.restaurantRepository.findOne({ where: { id: restaurantId } });
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      const current = Number(restaurant.walletTotalEarned) || 0;
      restaurant.walletTotalEarned = current + Number(totalBalance);
      restaurant.walletBalance = (Number(restaurant.walletTotalEarned) - Number(restaurant.walletTotalWithdrawn)) || 0;
      await this.restaurantRepository.save(restaurant);
      this.logger.log(`Updated DB walletBalance for ${restaurantId} -> ${restaurant.walletBalance}`);
      return { success: true, walletBalance: restaurant.walletBalance };
    }
    catch (err: any) {
      this.logger.error(`Failed to update restaurant wallet: ${err?.message || String(err)}`);
      throw new BadRequestException('Failed to update restaurant wallet');
    }
  }

  /**
   * Verify and store customer details (name + phone)
   * This is called from the verification page before showing order total
   */
  async verifyCustomer(customerVerificationDto: CustomerVerificationDto) {
    const { phone, customerName } = customerVerificationDto;

    // Find or create customer
    let customer = await this.customerRepository.findOne({
      where: { phone: phone },
    });

    if (!customer) {
      // Create new customer account
      this.logger.log(`Creating new customer account for phone: ${phone}, name: ${customerName}`);
      customer = this.customerRepository.create({
        phone: phone,
        name: customerName,
      });
      customer = await this.customerRepository.save(customer);
      this.logger.log(`Customer account created with ID: ${customer.id}`);
    } else {
      // Update customer name if provided (in case it changed)
      if (customerName && customer.name !== customerName) {
        customer.name = customerName;
        await this.customerRepository.save(customer);
      }
    }

    return {
      customerId: customer.id,
      phone: customer.phone,
      customerName: customer.name,
      message: 'Customer details verified and stored successfully',
    };
  }

  /**
   * Calculate order total and show final order breakdown
   * This is called after customer verification to show the final order details
   */
  async calculateOrderTotal(createOrderDto: CreateCustomerPortalOrderDto) {
    const { restaurantId, phone, customerName, orderItems } = createOrderDto;

    // Validate customer details are provided
    if (!phone || !customerName) {
      throw new BadRequestException('Phone number and customer name are required');
    }

    // Verify customer exists (should be created via verifyCustomer endpoint first)
    const customer = await this.customerRepository.findOne({
      where: { phone: phone },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found. Please verify your details first.');
    }

    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Calculate total
    let totalAmount = 0;
    const itemsBreakdown = [];

    for (const item of orderItems) {
      const menu = await this.menuRepository.findOne({
        where: { id: item.menuId, restaurantId },
        relations: ['category'],
      });

      if (!menu) {
        throw new NotFoundException(`Menu item with ID ${item.menuId} not found for this restaurant`);
      }

      if (!menu.isAvailable) {
        throw new BadRequestException(`Menu item ${menu.name} is currently unavailable`);
      }

      const unitPrice = this.calculateItemPrice(menu, item.specialInstructions);
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      itemsBreakdown.push({
        menuId: menu.id,
        menuName: menu.name,
        category: menu.category?.name || 'Uncategorized',
        quantity: item.quantity,
        unitPrice: unitPrice,
        totalPrice: itemTotal,
        specialInstructions: item.specialInstructions || null,
      });
    }

    // Calculate totals with service charge
    const subtotal = totalAmount;
    const serviceCharge = this.calculateServiceCharge(subtotal, restaurant);
    const tax = 0;
    const discount = 0;
    const finalTotal = parseFloat((subtotal + serviceCharge + tax - discount).toFixed(2));

    return {
      customer: {
        id: customer.id,
        phone: customer.phone,
        customerName: customer.name,
      },
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.address,
        serviceChargePercentage: restaurant.serviceChargePercentage,
        applyServiceCharge: restaurant.applyServiceCharge,
      },
      orderItems: itemsBreakdown,
      subtotal,
      serviceCharge,
      tax,
      discount,
      totalAmount: finalTotal,
      itemsBreakdown,
    };
  }

  /**
   * Process payment for an order
   */
  async processPayment(phone: string, orderId: string, paymentData: { paymentMethod: string; amount: number }) {
    // Normalize phone number
    const normalizedPhone = this.normalizePhone(phone);

    // Fetch order with customer relation
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant', 'customer'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.customer) {
      throw new NotFoundException('Order has no associated customer');
    }

    // Verify phone number matches
    const orderCustomerPhone = this.normalizePhone(order.customer.phone);
    if (orderCustomerPhone !== normalizedPhone && order.customer.phone !== phone) {
      throw new NotFoundException('Order not found for this customer. Phone number does not match.');
    }

    // Validate payment amount matches order total
    if (Number(paymentData.amount) !== Number(order.totalAmount)) {
      throw new BadRequestException(`Payment amount (${paymentData.amount}) does not match order total (${order.totalAmount})`);
    }

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(paymentData.paymentMethod as PaymentMethod)) {
      throw new BadRequestException(`Invalid payment method. Must be one of: ${Object.values(PaymentMethod).join(', ')}`);
    }

    // Determine payment status based on payment method
    // - cashier: PENDING (needs cashier confirmation before marking as paid)
    // - card/cash/qr: PAID (direct payment, immediately confirmed)
    const paymentStatus = paymentData.paymentMethod === PaymentMethod.CASHIER
      ? PaymentStatus.PENDING
      : PaymentStatus.PAID;

    // Create payment record
    const payment = this.paymentRepository.create({
      orderId: order.id,
      method: paymentData.paymentMethod as PaymentMethod,
      amount: paymentData.amount,
      status: paymentStatus,
    });

    await this.paymentRepository.save(payment);

    // Handle order status update based on payment timing and current status
    if (payment.status === PaymentStatus.PAID) {
      // Scenario 1: Pay at First or Cashier Payment - Order is PENDING, confirm it after payment
      // CRITICAL RULES:
      // - Parking/Takeaway: ALWAYS auto-confirm (no waiter confirmation)
      // - Pay-first dine-in: ALWAYS auto-confirm after payment (no waiter confirmation)
      // - Pay-last dine-in: Check requireWaiterConfirmation setting
      if (order.status === OrderStatusEnum.PENDING) {
        // Check if this is a parking or takeaway order - these ALWAYS auto-confirm
        const isParkingOrTakeaway =
          order.orderType === 'parking' ||
          order.orderType === 'takeaway';

        if (isParkingOrTakeaway) {
          // Auto-confirm - no waiter verification needed
          order.status = OrderStatusEnum.CONFIRMED;
          await this.orderRepository.save(order);
          this.logger.log(`Order ${order.orderNumber} (${order.orderType}) auto-confirmed after payment - no waiter confirmation needed`);
        }
        // Pay-first dine-in: ALWAYS auto-confirm after payment
        else if (order.restaurant.paymentTiming === 'pay_at_first') {
          order.status = OrderStatusEnum.CONFIRMED;
          await this.orderRepository.save(order);
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
            this.logger.log(`Order ${order.orderNumber} (dine-in, pay-last) auto-confirmed after payment`);
          }
        }
      }
      // Scenario 2: Pay at Last - Order is SERVED, complete it after payment
      else if (order.status === OrderStatusEnum.SERVED) {
        order.status = OrderStatusEnum.COMPLETED;
        await this.orderRepository.save(order);
        this.logger.log(`Order ${order.orderNumber} marked as COMPLETED after successful ${paymentData.paymentMethod} payment (pay_at_last)`);

        // Release table if order had a table assigned
        if (order.tableId) {
          const table = await this.tableRepository.findOne({
            where: { id: order.tableId },
          });

          if (table) {
            // Check if there are any other active orders for this table
            const activeOrdersOnTable = await this.orderRepository
              .createQueryBuilder('order')
              .where('order.tableId = :tableId', { tableId: order.tableId })
              .andWhere('order.id != :orderId', { orderId: order.id })
              .andWhere('order.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: [OrderStatusEnum.CANCELLED, OrderStatusEnum.COMPLETED, OrderStatusEnum.ABANDONED],
              })
              .getCount();

            // If no other active orders, set table back to AVAILABLE
            if (activeOrdersOnTable === 0 && table.status === TableStatus.OCCUPIED) {
              table.status = TableStatus.AVAILABLE;
              await this.tableRepository.save(table);
              this.logger.log(`Table ${table.name} (ID: ${order.tableId}) status updated to AVAILABLE after order completion and payment`);
            }
          }
        }
      }
    }

    // Record subscription usage for the restaurant
    await this.subscriptionService.recordOrderUsage(order.restaurantId);

    // Update restaurant wallet balance
    if (payment.method === PaymentMethod.CARD) {
      const updateWallet: UpdateRestaurantWalletDto = {
        restaurantId: order.restaurantId,
        totalBalance: order.totalAmount,
      };
      await this.updateRestaurantWallet(updateWallet);
    }


    return {
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        method: payment.method,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
      },
    };
  }

  /**
   * Format order with items grouped by category
   */
  private formatOrderWithGroupedItems(order: Order | null): any {
    if (!order) {
      this.logger.error('formatOrderWithGroupedItems called with null order');
      throw new BadRequestException('Order not found');
    }

    // Get payment method from the most recent payment
    const latestPayment = order.payments && order.payments.length > 0
      ? order.payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null;

    if (!order.orderItems || order.orderItems.length === 0) {
      const isReviewed = order.ratings && order.ratings.length > 0;
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
        subtotal: order.subtotal || order.totalAmount, // Fallback for old orders
        serviceCharge: order.serviceCharge || 0,
        tax: order.tax || 0,
        discount: order.discount || 0,
        totalAmount: order.totalAmount,
        paymentMethod: latestPayment?.method || null,
        paymentStatus: latestPayment?.status || null,
        amountTendered: latestPayment?.amountTendered || null,
        changeReturned: latestPayment?.changeReturned || null,
        restaurant: order.restaurant ? {
          id: order.restaurant.id,
          name: order.restaurant.name,
        } : null,
        itemsByCategory: [],
        isReviewed,
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

    // Check if order has been reviewed
    const isReviewed = order.ratings && order.ratings.length > 0;

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
      subtotal: order.subtotal || order.totalAmount, // Fallback for old orders
      serviceCharge: order.serviceCharge || 0,
      tax: order.tax || 0,
      discount: order.discount || 0,
      totalAmount: order.totalAmount,
      paymentMethod: latestPayment?.method || null,
      paymentStatus: latestPayment?.status || null,
      amountTendered: latestPayment?.amountTendered || null,
      changeReturned: latestPayment?.changeReturned || null,
      restaurant: order.restaurant ? {
        id: order.restaurant.id,
        name: order.restaurant.name,
      } : null,
      itemsByCategory: categoryGroups,
      isReviewed, // Add isReviewed property
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async getUserOrders(
    customerId: string,
    pagination: PaginationDto = { page: 1, limit: 10 },
    filters?: { restaurantId?: string; tenantId?: string; activeOnly?: boolean }
  ): Promise<PaginationResponse<any>> {
    // Normalize the input phone number
    const normalizedInputPhone = this.normalizePhone(customerId);

    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 10, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    // Calculate today's date range (start and end of today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Calculate 2 hours ago for completed orders
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

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
      .leftJoinAndSelect('order.payments', 'payments')
      .leftJoinAndSelect('order.ratings', 'ratings')
      .where('customer.phone = :phone', { phone: customerId });

    // Apply restaurant filter (IMPORTANT: Only show orders for the specific restaurant)
    if (filters?.restaurantId) {
      queryBuilder.andWhere('order.restaurantId = :restaurantId', { restaurantId: filters.restaurantId });
    }

    // Apply tenant filter
    if (filters?.tenantId) {
      queryBuilder.andWhere('restaurant.tenantId = :tenantId', { tenantId: filters.tenantId });
    }

    // Only show TODAY's orders
    queryBuilder.andWhere('order.createdAt >= :todayStart', { todayStart });
    queryBuilder.andWhere('order.createdAt <= :todayEnd', { todayEnd });

    // Apply activeOnly filter with improved logic
    if (filters?.activeOnly) {
      // Show:
      // 1. All pending orders (even if not prepared yet)
      // 2. All confirmed, preparing, ready, served orders
      // 3. Completed orders from the last 2 hours (so customers can review)
      // Exclude: cancelled, abandoned, and completed orders older than 2 hours
      queryBuilder.andWhere(
        '(order.status IN (:...activeStatuses) OR (order.status = :completedStatus AND order.updatedAt >= :twoHoursAgo))',
        {
          activeStatuses: ['pending', 'confirmed', 'preparing', 'ready', 'served'],
          completedStatus: 'completed',
          twoHoursAgo,
        }
      );
    }

    // Apply ordering and pagination
    queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    let [orders, total] = await queryBuilder.getManyAndCount();

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
        .leftJoinAndSelect('order.payments', 'payments')
        .leftJoinAndSelect('order.ratings', 'ratings');

      // Apply filters
      if (filters?.restaurantId) {
        allOrdersQuery.where('order.restaurantId = :restaurantId', { restaurantId: filters.restaurantId });
      }
      if (filters?.tenantId) {
        allOrdersQuery.andWhere('restaurant.tenantId = :tenantId', { tenantId: filters.tenantId });
      }

      // Date filters
      allOrdersQuery.andWhere('order.createdAt >= :todayStart', { todayStart });
      allOrdersQuery.andWhere('order.createdAt <= :todayEnd', { todayEnd });

      // Active only filter
      if (filters?.activeOnly) {
        allOrdersQuery.andWhere(
          '(order.status IN (:...activeStatuses) OR (order.status = :completedStatus AND order.updatedAt >= :twoHoursAgo))',
          {
            activeStatuses: ['pending', 'confirmed', 'preparing', 'ready', 'served'],
            completedStatus: 'completed',
            twoHoursAgo,
          }
        );
      }

      allOrdersQuery.orderBy('order.createdAt', 'DESC');

      const allOrders = await allOrdersQuery.getMany();

      const filteredOrders = allOrders.filter(order =>
        order.customer && this.normalizePhone(order.customer.phone) === normalizedInputPhone
      );

      // Apply pagination manually
      total = filteredOrders.length;
      orders = filteredOrders.slice(skip, skip + limit);
    }

    this.logger.log(`[getUserOrders] === QUERY RESULTS ===`);
    this.logger.log(`[getUserOrders] Found ${total} orders for phone ${customerId}`);

    if (orders.length > 0) {
      this.logger.log(`[getUserOrders] Order details:`);
      orders.forEach((order, index) => {
        this.logger.log(`  ${index + 1}. ${order.orderNumber} - Status: ${order.status}, CreatedBy: ${order.createdByType}, Restaurant: ${order.restaurant?.name || 'N/A'}, TenantId: ${order.restaurant?.tenantId || 'N/A'}, Created: ${order.createdAt}`);
      });
    } else {
      this.logger.warn(`[getUserOrders] ❌ No orders found matching the query criteria`);
      this.logger.log(`[getUserOrders] Query filters applied:`);
      this.logger.log(`  - phone: ${customerId}`);
      this.logger.log(`  - restaurantId: ${filters?.restaurantId || 'none'}`);
      this.logger.log(`  - tenantId: ${filters?.tenantId || 'none'}`);
      this.logger.log(`  - today only: ${todayStart.toISOString()} to ${todayEnd.toISOString()}`);
      this.logger.log(`  - activeOnly: ${filters?.activeOnly || false}`);
    }

    if (orders.length > 0) {
      this.logger.log(`[getUserOrders] Sample order: ${orders[0].orderNumber} (Status: ${orders[0].status}, CreatedBy: ${orders[0].createdByType})`);
    }

    // Format orders with items grouped by category
    const formattedOrders = orders.map(order => this.formatOrderWithGroupedItems(order));

    return {
      data: formattedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderDetails(customerId: string, orderId: string) {
    this.logger.log(`[getOrderDetails] Looking up order ${orderId} for customer phone: ${customerId}`);

    // Normalize the input phone number
    const normalizedInputPhone = this.normalizePhone(customerId);
    this.logger.log(`[getOrderDetails] Normalized phone: ${normalizedInputPhone}`);

    // STEP 1: Fetch the order with customer relation
    const orderLookup = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant', 'customer'],
    });

    if (!orderLookup) {
      this.logger.warn(`[getOrderDetails] Order ${orderId} not found`);
      throw new NotFoundException('Order not found');
    }

    if (!orderLookup.customer) {
      this.logger.error(`[getOrderDetails] Order ${orderId} has no associated customer`);
      throw new NotFoundException('Order has no associated customer');
    }

    this.logger.log(`[getOrderDetails] Found order for restaurant: ${orderLookup.restaurant?.name} (ID: ${orderLookup.restaurantId}), Customer: ${orderLookup.customer.phone}`);

    // STEP 2: Verify the phone number matches the customer on the order
    // Use flexible phone matching to handle different formats
    const orderCustomerPhone = this.normalizePhone(orderLookup.customer.phone);

    if (orderCustomerPhone !== normalizedInputPhone && orderLookup.customer.phone !== customerId) {
      this.logger.warn(`[getOrderDetails] Phone mismatch. Order customer phone: ${orderLookup.customer.phone} (normalized: ${orderCustomerPhone}), Input phone: ${customerId} (normalized: ${normalizedInputPhone})`);
      throw new NotFoundException('Order not found for this customer. Phone number does not match.');
    }

    this.logger.log(`[getOrderDetails] Phone verification successful for customer: ${orderLookup.customer.name} (ID: ${orderLookup.customer.id})`);

    const customer = orderLookup.customer;

    // STEP 4: Fetch full order with all relations
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
        'payments',
        'ratings',
      ],
    });

    this.logger.log(`[getOrderDetails] Found order: ${order.orderNumber} (Status: ${order.status}, CreatedBy: ${order.createdByType})`);

    return this.formatOrderWithGroupedItems(order);
  }

  async cancelOrder(customerId: string, orderId: string, reason?: string) {
    // Normalize phone number
    const normalizedPhone = this.normalizePhone(customerId);

    // Fetch order with customer relation
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['orderItems', 'customer', 'restaurant', 'table'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.customer) {
      throw new NotFoundException('Order has no associated customer');
    }

    // Verify phone number matches
    const orderCustomerPhone = this.normalizePhone(order.customer.phone);
    if (orderCustomerPhone !== normalizedPhone && order.customer.phone !== customerId) {
      throw new NotFoundException('Order not found for this customer. Phone number does not match.');
    }

    // Check if order can be cancelled (cannot cancel completed, served, or already cancelled orders)
    const nonCancellableStatuses = [
      OrderStatusEnum.COMPLETED,
      OrderStatusEnum.SERVED,
      OrderStatusEnum.CANCELLED,
    ];

    if (nonCancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order with status: ${order.status}. Only pending, confirmed, preparing, or ready orders can be cancelled.`
      );
    }

    // Update order status to cancelled
    order.status = OrderStatusEnum.CANCELLED;
    await this.orderRepository.save(order);

    // Release table if order had a table assigned
    if (order.tableId && order.table) {
      // Check if there are any other active orders for this table (excluding this cancelled order)
      const activeOrdersOnTable = await this.orderRepository
        .createQueryBuilder('order')
        .where('order.tableId = :tableId', { tableId: order.tableId })
        .andWhere('order.id != :orderId', { orderId: order.id })
        .andWhere('order.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: [OrderStatusEnum.CANCELLED, OrderStatusEnum.COMPLETED, OrderStatusEnum.ABANDONED],
        })
        .getCount();

      // If no other active orders, set table back to AVAILABLE
      if (activeOrdersOnTable === 0 && order.table.status === TableStatus.OCCUPIED) {
        order.table.status = TableStatus.AVAILABLE;
        await this.tableRepository.save(order.table);
        this.logger.log(`Table ${order.table.name} (ID: ${order.tableId}) status updated to AVAILABLE after order cancellation`);
      }
    }

    this.logger.log(
      `Order ${orderId} cancelled by customer ${order.customer.id}. Reason: ${reason || 'No reason provided'}`
    );

    // Reload order with all relations for formatted response
    const cancelledOrder = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['orderItems', 'orderItems.menu', 'orderItems.menu.category', 'customer', 'restaurant'],
    });

    // Return formatted order
    return this.formatOrderWithGroupedItems(cancelledOrder);
  }

  /**
   * Generate a unique readable order number per restaurant
   * Format: ORD followed by a 6-digit number (e.g., ORD000001, ORD000255)
   * Each restaurant has its own counter starting from 1
   * Uses the maximum existing order number for the restaurant + 1, or starts from 1 if no orders exist
   * Handles both old format (#0000001) and new format (ORD000001)
   * Includes retry-safe generation with timestamp component to reduce collisions
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
   * Generate order number with a specific starting number (used for retries)
   */
  private async generateOrderNumberWithIncrement(restaurantId: string, startNumber: number): Promise<string> {
    const paddedNumber = String(startNumber).padStart(6, '0');
    const orderNumber = `ORD${paddedNumber}`;

    // Check if this order number already exists for this restaurant
    const existingOrder = await this.orderRepository.findOne({
      where: {
        restaurantId: restaurantId,
        orderNumber
      },
    });

    if (existingOrder) {
      // If exists, try next number (limit to prevent infinite recursion)
      if (startNumber > 999999) {
        // Fallback: use timestamp-based number if we hit the limit
        const timestamp = Date.now().toString().slice(-6);
        return `ORD${timestamp}`;
      }
      return this.generateOrderNumberWithIncrement(restaurantId, startNumber + 1);
    }

    return orderNumber;
  }


  /**
   * Helper method to calculate item price including variants
   * Handles case-insensitive key lookup for specialInstructions
   * Distinguishes between price overrides (Size/Portion) and add-ons
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
        // Not a JSON string, treat as regular string (unlikely to match object keys, but safe)
        this.logger.warn(`Failed to parse specialInstructions string: ${specialInstructions}`);
      }
    }

    // If instructions is an object and menu has variants
    if (instructions && typeof instructions === 'object' && menu.variantOptions && Array.isArray(menu.variantOptions)) {
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
          break; // Stop at first price override
        }
      }
    }

    if (discountPercentage > 0) {
      const discountAmount = (finalPrice * discountPercentage) / 100;
      finalPrice = parseFloat((finalPrice - discountAmount).toFixed(2));
    }

    return finalPrice;
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