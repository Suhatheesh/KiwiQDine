import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table, Restaurant, Order } from '../infrastructure/database/entities';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { PaginationDto, PaginationResponse } from '../shared/dto/pagination.dto';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly subscriptionService: SubscriptionService,
  ) { }

  async createTable(createTableDto: CreateTableDto): Promise<Table> {
    // Check subscription limits
    const canCreate = await this.subscriptionService.canCreateTable(createTableDto.restaurantId);
    if (!canCreate.allowed) {
      throw new BadRequestException(canCreate.reason);
    }

    // Validate restaurant exists
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: createTableDto.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Check if table with same name already exists in this restaurant
    const existingTable = await this.tableRepository.findOne({
      where: { name: createTableDto.name, restaurantId: createTableDto.restaurantId },
    });
    if (existingTable) {
      throw new ConflictException('Table with this name already exists in this restaurant');
    }

    // Create table (qrCode is optional, can be set later if needed)
    const table = this.tableRepository.create({
      restaurantId: createTableDto.restaurantId,
      name: createTableDto.name,
      tableNumber: createTableDto.tableNumber,
      capacity: createTableDto.capacity,
      location: createTableDto.location || null,
    });

    const savedTable = await this.tableRepository.save(table);

    // Update order usage userCount and overageUserCount
    if (createTableDto.restaurantId) {
      await this.subscriptionService.incrementOrderUsageTableCount(createTableDto.restaurantId);
    }

    // Reload table with relations
    return this.tableRepository.findOne({
      where: { id: savedTable.id },
      relations: ['restaurant'],
    });
  }

  async findAll(restaurantId: string, pagination: PaginationDto = { page: 1, limit: 10 }): Promise<PaginationResponse<any>> {
    if (!restaurantId) {
      throw new BadRequestException('Restaurant ID is required');
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Get restaurant settings to check waiter confirmation requirement
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId },
      select: ['id', 'paymentTiming', 'requireWaiterConfirmation'],
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const [tables, total] = await this.tableRepository.findAndCount({
      where: { restaurantId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Enrich each table with order status information
    const enrichedTables = await Promise.all(
      tables.map(async (table) => {
        // Get all active orders for this table (not completed, cancelled, or abandoned)
        const orders = await this.orderRepository.find({
          where: {
            tableId: table.id,
          },
          relations: ['customer', 'orderItems'],
          order: { createdAt: 'DESC' },
        });

        // Filter active orders (exclude completed, cancelled, abandoned)
        const activeOrders = orders.filter(
          (order) =>
            order.status !== 'completed' &&
            order.status !== 'cancelled' &&
            order.status !== 'abandoned'
        );

        // Count pending orders that ACTUALLY need waiter confirmation
        // CRITICAL: Only pay-last dine-in orders with requireWaiterConfirmation=true need waiter action
        // Parking/Takeaway/Pay-first orders do NOT need waiter confirmation
        const pendingOrders = activeOrders.filter((order) => {
          if (order.status !== 'pending') return false;
          if (order.createdByType !== 'customer') return false; // Staff orders don't need confirmation

          // Parking and Takeaway orders never need waiter confirmation
          if (order.orderType === 'parking' || order.orderType === 'takeaway') return false;

          // Only pay-last dine-in orders with waiter confirmation enabled need action
          if (restaurant.paymentTiming === 'pay_at_last' && restaurant.requireWaiterConfirmation) {
            return true;
          }

          return false;
        });

        // Get the most recent order for this table
        const latestOrder = orders.length > 0 ? orders[0] : null;

        return {
          id: table.id,
          name: table.name,
          tableNumber: table.tableNumber,
          capacity: table.capacity,
          status: table.status,
          location: table.location,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
          orderStatus: {
            // Total active orders on this table
            activeOrdersCount: activeOrders.length,
            // Pending orders that ACTUALLY need waiter confirmation
            pendingOrdersCount: pendingOrders.length,
            // Flag to highlight tables with pending orders
            hasPendingOrders: pendingOrders.length > 0,
            // Latest order info for quick reference
            latestOrder: latestOrder
              ? {
                id: latestOrder.id,
                orderNumber: latestOrder.orderNumber,
                status: latestOrder.status,
                orderType: latestOrder.orderType,
                customerName: latestOrder.customer?.name || 'Customer',
                totalAmount: latestOrder.totalAmount,
                itemCount: latestOrder.orderItems?.length || 0,
                createdAt: latestOrder.createdAt,
                createdByType: latestOrder.createdByType, // 'customer' or 'staff'
              }
              : null,
            // List of all active orders for this table
            activeOrders: activeOrders.map((order) => ({
              id: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
              orderType: order.orderType,
              customerName: order.customer?.name || 'Customer',
              totalAmount: order.totalAmount,
              itemCount: order.orderItems?.length || 0,
              createdAt: order.createdAt,
              createdByType: order.createdByType,
            })),
          },
        };
      })
    );

    return {
      data: enrichedTables,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, restaurantId: string): Promise<Table> {
    if (!restaurantId) {
      throw new BadRequestException('Restaurant ID is required');
    }

    const table = await this.tableRepository.findOne({
      where: { id, restaurantId },
      relations: ['restaurant'],
    });

    if (!table) {
      throw new NotFoundException('Table not found for this restaurant');
    }

    return table;
  }

  async updateTable(id: string, restaurantId: string, updateTableDto: UpdateTableDto): Promise<Table> {
    const table = await this.findOne(id, restaurantId);

    // If name is being updated, check for uniqueness
    if (updateTableDto.name && updateTableDto.name !== table.name) {
      const existingTable = await this.tableRepository.findOne({
        where: { name: updateTableDto.name, restaurantId },
      });
      if (existingTable && existingTable.id !== id) {
        throw new ConflictException('Table with this name already exists in this restaurant');
      }
    }

    // Update table fields
    if (updateTableDto.name !== undefined) {
      table.name = updateTableDto.name;
    }
    if (updateTableDto.tableNumber !== undefined) {
      table.tableNumber = updateTableDto.tableNumber;
    }
    if (updateTableDto.capacity !== undefined) {
      table.capacity = updateTableDto.capacity;
    }
    if (updateTableDto.location !== undefined) {
      table.location = updateTableDto.location;
    }
    if (updateTableDto.status !== undefined) {
      table.status = updateTableDto.status;
    }

    const savedTable = await this.tableRepository.save(table);

    // Reload table with relations
    return this.tableRepository.findOne({
      where: { id: savedTable.id },
      relations: ['restaurant'],
    });
  }

  async deleteTable(id: string, restaurantId: string): Promise<void> {
    const table = await this.findOne(id, restaurantId);

    // Check if table has any orders
    const ordersCount = await this.orderRepository.count({
      where: { tableId: id },
    });

    if (ordersCount > 0) {
      throw new ConflictException(
        `Cannot delete table. This table has ${ordersCount} order(s). Please remove or reassign orders first.`
      );
    }

    await this.tableRepository.remove(table);

    // Reduce table count in order usage only if table was created more than 5 days ago
    if (restaurantId && table.createdAt) {
      const now = new Date();
      const createdAt = new Date(table.createdAt);
      const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 5) {
        await this.subscriptionService.decrementOrderUsageTableCount(restaurantId);
      }
    }
  }
}
