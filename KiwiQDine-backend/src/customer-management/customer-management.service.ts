import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { Customer, Order, Restaurant, Tenant, UserRole } from '../infrastructure/database/entities';
import { PaginationDto, PaginationResponse } from '../shared/dto/pagination.dto';
import { CreateOrFindCustomerDto } from './dto/create-or-find-customer.dto';

@Injectable()
export class CustomerManagementService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) { }

  async findAll(
    user: any,
    pagination: PaginationDto = { page: 1, limit: 10 },
    filters?: { tenantId?: string; restaurantId?: string; search?: string },
  ): Promise<PaginationResponse<any>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    let customerIds: string[] = [];
    let whereCondition: any = {};

    // Role-based filtering
    if (user.role === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN: Get all customers
      // If filters are provided, apply them
      if (filters?.tenantId) {
        // Get all restaurants for this tenant
        const restaurants = await this.restaurantRepository.find({
          where: { tenantId: filters.tenantId },
          select: ['id'],
        });
        const restaurantIds = restaurants.map((r) => r.id);

        if (restaurantIds.length > 0) {
          // Get customer IDs from orders in these restaurants
          const orders = await this.orderRepository.find({
            where: { restaurantId: In(restaurantIds) },
            select: ['customerId'],
          });
          customerIds = [...new Set(orders.map((o) => o.customerId))];
        }
      } else if (filters?.restaurantId) {
        // Get customer IDs from orders in this restaurant
        const orders = await this.orderRepository.find({
          where: { restaurantId: filters.restaurantId },
          select: ['customerId'],
        });
        customerIds = [...new Set(orders.map((o) => o.customerId))];
      }
      // If no filters, customerIds remains empty array, which means get all customers
    } else if (user.role === UserRole.TENANT_ADMIN) {
      // TENANT_ADMIN: Get customers from their tenant's restaurants
      if (!user.tenantId) {
        throw new ForbiddenException('Tenant ID is required for tenant admin');
      }

      // Get all restaurants for this tenant
      const restaurants = await this.restaurantRepository.find({
        where: { tenantId: user.tenantId },
        select: ['id'],
      });
      const restaurantIds = restaurants.map((r) => r.id);

      if (restaurantIds.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      // Get customer IDs from orders in these restaurants
      const orders = await this.orderRepository.find({
        where: { restaurantId: In(restaurantIds) },
        select: ['customerId'],
      });
      customerIds = [...new Set(orders.map((o) => o.customerId))];

      // Apply restaurant filter if provided
      if (filters?.restaurantId) {
        // Verify restaurant belongs to tenant
        const restaurant = await this.restaurantRepository.findOne({
          where: { id: filters.restaurantId, tenantId: user.tenantId },
        });
        if (!restaurant) {
          throw new ForbiddenException('Restaurant does not belong to your tenant');
        }

        const restaurantOrders = await this.orderRepository.find({
          where: { restaurantId: filters.restaurantId },
          select: ['customerId'],
        });
        const filteredCustomerIds = [...new Set(restaurantOrders.map((o) => o.customerId))];
        customerIds = customerIds.filter((id) => filteredCustomerIds.includes(id));
      }
    } else if (user.role === UserRole.MANAGER || user.role === UserRole.WAITER || user.role === UserRole.KITCHEN_STAFF) {
      // Restaurant staff: Get customers from their restaurant
      if (!user.restaurantId) {
        throw new ForbiddenException('Restaurant ID is required for this role');
      }

      // Get customer IDs from orders in this restaurant
      const orders = await this.orderRepository.find({
        where: { restaurantId: user.restaurantId },
        select: ['customerId'],
      });
      customerIds = [...new Set(orders.map((o) => o.customerId))];
    } else {
      throw new ForbiddenException('Insufficient permissions to view customers');
    }

    // Build query
    if (customerIds.length > 0) {
      whereCondition.id = In(customerIds);
    } else if (user.role !== UserRole.SUPER_ADMIN) {
      // If no customers found for tenant/restaurant, return empty
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
    // For SUPER_ADMIN with no filters, whereCondition remains empty, which means get all customers

    // Apply search filter (phone number only)
    if (filters?.search) {
      // If we have customerIds filter, include it with phone search
      if (customerIds.length > 0) {
        whereCondition = {
          ...whereCondition,
          phone: ILike(`%${filters.search}%`),
        };
      } else {
        // No customerIds filter (SUPER_ADMIN case), just search by phone
        whereCondition = {
          phone: ILike(`%${filters.search}%`),
        };
      }
    }

    // Get customers with pagination
    const [customers, total] = await this.customerRepository.findAndCount({
      where: whereCondition,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    // Get orders for these customers to extract tenant and restaurant info
    const customerIdsList = customers.map((c) => c.id);
    const orders = await this.orderRepository.find({
      where: { customerId: In(customerIdsList) },
      relations: ['restaurant', 'restaurant.tenant'],
      select: ['customerId', 'restaurantId', 'restaurant'],
    });

    // Group orders by customer and get unique tenant/restaurant info
    const customerData = customers.map((customer) => {
      const customerOrders = orders.filter((o) => o.customerId === customer.id);
      const uniqueRestaurants = new Map();
      const uniqueTenants = new Map();

      customerOrders.forEach((order) => {
        if (order.restaurant) {
          uniqueRestaurants.set(order.restaurant.id, {
            id: order.restaurant.id,
            name: order.restaurant.name,
            tenantId: order.restaurant.tenantId,
          });

          if (order.restaurant.tenant) {
            uniqueTenants.set(order.restaurant.tenant.id, {
              id: order.restaurant.tenant.id,
              name: order.restaurant.tenant.name,
              subdomain: order.restaurant.tenant.subdomain,
            });
          }
        }
      });

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        restaurants: Array.from(uniqueRestaurants.values()),
        tenants: Array.from(uniqueTenants.values()),
        totalOrders: customerOrders.length,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      };
    });

    return {
      data: customerData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: any): Promise<any> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Verify access based on role
    let hasAccess = false;

    if (user.role === UserRole.SUPER_ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.TENANT_ADMIN) {
      // Check if customer has orders in tenant's restaurants
      const restaurants = await this.restaurantRepository.find({
        where: { tenantId: user.tenantId },
        select: ['id'],
      });
      const restaurantIds = restaurants.map((r) => r.id);

      if (restaurantIds.length > 0) {
        const order = await this.orderRepository.findOne({
          where: { customerId: id, restaurantId: In(restaurantIds) },
        });
        hasAccess = !!order;
      }
    } else if (user.role === UserRole.MANAGER || user.role === UserRole.WAITER || user.role === UserRole.KITCHEN_STAFF) {
      // Check if customer has orders in user's restaurant
      if (user.restaurantId) {
        const order = await this.orderRepository.findOne({
          where: { customerId: id, restaurantId: user.restaurantId },
        });
        hasAccess = !!order;
      }
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this customer');
    }

    // Get customer orders with restaurant and tenant info
    const orders = await this.orderRepository.find({
      where: { customerId: id },
      relations: ['restaurant', 'restaurant.tenant', 'orderItems'],
      order: { createdAt: 'DESC' },
    });

    const uniqueRestaurants = new Map();
    const uniqueTenants = new Map();

    orders.forEach((order) => {
      if (order.restaurant) {
        uniqueRestaurants.set(order.restaurant.id, {
          id: order.restaurant.id,
          name: order.restaurant.name,
          tenantId: order.restaurant.tenantId,
        });

        if (order.restaurant.tenant) {
          uniqueTenants.set(order.restaurant.tenant.id, {
            id: order.restaurant.tenant.id,
            name: order.restaurant.tenant.name,
            subdomain: order.restaurant.tenant.subdomain,
          });
        }
      }
    });

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      restaurants: Array.from(uniqueRestaurants.values()),
      tenants: Array.from(uniqueTenants.values()),
      totalOrders: orders.length,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        restaurantId: order.restaurantId,
        restaurant: order.restaurant
          ? {
            id: order.restaurant.id,
            name: order.restaurant.name,
          }
          : null,
        status: order.status,
        totalAmount: order.totalAmount,
        tableNo: order.tableNo,
        createdAt: order.createdAt,
      })),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  /**
   * Find customer by phone number with role-based access control
   * Returns customer details with orders, restaurants, and tenants
   * @param phone - Customer phone number
   * @param user - Current user for access control
   * @returns Customer details
   */
  async findByPhone(phone: string, user: any): Promise<any> {
    const customer = await this.customerRepository.findOne({
      where: { phone },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found with the provided phone number');
    }

    // Verify access based on role (same logic as findOne)
    let hasAccess = false;

    if (user.role === UserRole.SUPER_ADMIN) {
      hasAccess = true;
    } else if (user.role === UserRole.TENANT_ADMIN) {
      // Check if customer has orders in tenant's restaurants
      const restaurants = await this.restaurantRepository.find({
        where: { tenantId: user.tenantId },
        select: ['id'],
      });
      const restaurantIds = restaurants.map((r) => r.id);

      if (restaurantIds.length > 0) {
        const order = await this.orderRepository.findOne({
          where: { customerId: customer.id, restaurantId: In(restaurantIds) },
        });
        hasAccess = !!order;
      }
    } else if (user.role === UserRole.MANAGER || user.role === UserRole.WAITER || user.role === UserRole.KITCHEN_STAFF) {
      // Check if customer has orders in user's restaurant
      if (user.restaurantId) {
        const order = await this.orderRepository.findOne({
          where: { customerId: customer.id, restaurantId: user.restaurantId },
        });
        hasAccess = !!order;
      }
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this customer');
    }

    // Get customer orders with restaurant and tenant info
    const orders = await this.orderRepository.find({
      where: { customerId: customer.id },
      relations: ['restaurant', 'restaurant.tenant', 'orderItems'],
      order: { createdAt: 'DESC' },
    });

    const uniqueRestaurants = new Map();
    const uniqueTenants = new Map();

    orders.forEach((order) => {
      if (order.restaurant) {
        uniqueRestaurants.set(order.restaurant.id, {
          id: order.restaurant.id,
          name: order.restaurant.name,
          tenantId: order.restaurant.tenantId,
        });

        if (order.restaurant.tenant) {
          uniqueTenants.set(order.restaurant.tenant.id, {
            id: order.restaurant.tenant.id,
            name: order.restaurant.tenant.name,
            subdomain: order.restaurant.tenant.subdomain,
          });
        }
      }
    });

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      restaurants: Array.from(uniqueRestaurants.values()),
      tenants: Array.from(uniqueTenants.values()),
      totalOrders: orders.length,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        restaurantId: order.restaurantId,
        restaurant: order.restaurant
          ? {
            id: order.restaurant.id,
            name: order.restaurant.name,
          }
          : null,
        status: order.status,
        totalAmount: order.totalAmount,
        tableNo: order.tableNo,
        createdAt: order.createdAt,
      })),
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  /**
   * Create or find customer by phone number
   * If customer exists with the phone number, return it
   * If not, create a new customer with the provided phone and name
   * @param createOrFindDto - Customer data (phone and name)
   * @returns Customer entity
   */
  async createOrFind(createOrFindDto: CreateOrFindCustomerDto): Promise<Customer> {
    const { phone, name } = createOrFindDto;

    // Try to find existing customer by phone
    let customer = await this.customerRepository.findOne({
      where: { phone },
    });

    if (customer) {
      // Customer exists, update name if provided and different
      if (name && customer.name !== name) {
        customer.name = name;
        customer = await this.customerRepository.save(customer);
      }
      return customer;
    }

    // Customer doesn't exist, create new one
    customer = this.customerRepository.create({
      phone,
      name,
    });

    return await this.customerRepository.save(customer);
  }
}

