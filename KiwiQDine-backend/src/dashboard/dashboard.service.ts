import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not, In } from 'typeorm';
import {
  Order,
  OrderItem,
  Restaurant,
  Table,
  Payment,
  PaymentMethod,
  Menu,
  Category,
  TableStatus,
} from '../infrastructure/database/entities';
import { OrderStatus as OrderStatusEnum } from '../infrastructure/database/entities/order.entity';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) { }

  /**
   * Get dashboard summary data (4 summary cards)
   */
  async getDashboardSummary(
    restaurantId: string | undefined,
    user: any,
  ): Promise<any> {
    // Apply restaurant filter
    const restaurantFilter = this.getRestaurantFilter(restaurantId, user);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get yesterday's date range for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 1. Today's Sales (COMPLETED orders only - actual revenue)
    // CRITICAL FIX: Only count COMPLETED orders for revenue calculation
    // Pending/Preparing orders should NOT be included in revenue
    const todayCompletedOrders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        createdAt: Between(today, tomorrow),
        status: OrderStatusEnum.COMPLETED, // Only completed orders
      },
      relations: ['payments'],
    });

    const todayRevenue = todayCompletedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const yesterdayCompletedOrders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        createdAt: Between(yesterday, today),
        status: OrderStatusEnum.COMPLETED, // Only completed orders
      },
    });

    const yesterdayRevenue = yesterdayCompletedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const revenueChange =
      yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : todayRevenue > 0
          ? 100
          : 0;

    // 2. Total Orders Today (ALL active orders - exclude cancelled and abandoned)
    const todayAllOrders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        createdAt: Between(today, tomorrow),
        status: Not(In([OrderStatusEnum.CANCELLED, OrderStatusEnum.ABANDONED])),
      },
    });

    const totalOrdersToday = todayAllOrders.length;
    const dineInOrders = todayAllOrders.filter(
      (order) => order.tableId || order.tableNo,
    ).length;
    const takeawayOrders = totalOrdersToday - dineInOrders;

    // 3. Active Tables
    const totalTables = await this.tableRepository.count({
      where: restaurantFilter,
    });

    const occupiedTables = await this.tableRepository.count({
      where: {
        ...restaurantFilter,
        status: TableStatus.OCCUPIED,
      },
    });

    // 4. Top Selling Item (from ALL non-cancelled orders today)
    const todayOrderIds = todayAllOrders.map((o) => o.id);

    const todayOrderItems = todayOrderIds.length > 0
      ? await this.orderItemRepository.find({
        where: {
          orderId: In(todayOrderIds),
        },
        relations: ['menu', 'order'],
      })
      : [];

    // Group by menu item and sum quantities
    const itemSales = new Map<string, { name: string; quantity: number }>();
    todayOrderItems.forEach((item) => {
      const menuId = item.menuId;
      const menuName = item.menu?.name || 'Unknown';
      const existing = itemSales.get(menuId) || { name: menuName, quantity: 0 };
      existing.quantity += item.quantity;
      itemSales.set(menuId, existing);
    });

    let topSellingItem = { name: 'N/A', quantity: 0 };
    if (itemSales.size > 0) {
      const sorted = Array.from(itemSales.values()).sort(
        (a, b) => b.quantity - a.quantity,
      );
      topSellingItem = sorted[0];
    }

    return {
      todaysSales: {
        totalRevenue: Number(todayRevenue.toFixed(2)),
        changePercent: Number(revenueChange.toFixed(2)),
        trend: revenueChange >= 0 ? 'up' : 'down',
        completedOrders: todayCompletedOrders.length, // Show how many orders contributed to revenue
      },
      totalOrdersToday: {
        count: totalOrdersToday,
        dineIn: dineInOrders,
        takeaway: takeawayOrders,
        completed: todayCompletedOrders.length, // Breakdown
        pending: totalOrdersToday - todayCompletedOrders.length, // Breakdown
      },
      activeTables: {
        occupied: occupiedTables,
        total: totalTables,
        available: totalTables - occupiedTables,
      },
      topSellingItem: {
        name: topSellingItem.name,
        quantity: topSellingItem.quantity,
      },
    };
  }

  /**
   * Get sales overview (hourly or daily trend)
   */
  async getSalesOverview(
    restaurantId: string | undefined,
    user: any,
    period: 'today' | 'week' | 'month' | 'year' = 'today',
  ): Promise<any> {
    const restaurantFilter = this.getRestaurantFilter(restaurantId, user);

    // Get date range using the existing helper
    const { startDate, endDate } = this.getDateRangeForPeriod(period);

    // Only count COMPLETED orders for revenue
    const orders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        createdAt: Between(startDate, endDate),
        status: OrderStatusEnum.COMPLETED, // Only COMPLETED orders count for revenue
      },
      order: { createdAt: 'ASC' },
    });

    if (period === 'today') {
      // Hourly (0-23) - Use IST timezone
      const hourlyData = new Map<number, number>();
      for (let hour = 0; hour < 24; hour++) {
        hourlyData.set(hour, 0);
      }

      orders.forEach((order) => {
        // Extract hour in IST timezone (not UTC)
        const istDate = new Date(order.createdAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const hour = istDate.getHours();
        const current = hourlyData.get(hour) || 0;
        hourlyData.set(hour, current + Number(order.totalAmount));
      });

      return Array.from(hourlyData.entries()).map(([hour, revenue]) => ({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
        revenue: Number(revenue.toFixed(2)),
      }));
    } else if (period === 'year') {
      // Monthly (YYYY-MM)
      const monthlyData = new Map<string, number>();

      orders.forEach((order) => {
        const date = new Date(order.createdAt);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const current = monthlyData.get(key) || 0;
        monthlyData.set(key, current + Number(order.totalAmount));
      });

      // Sort by date key
      return Array.from(monthlyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, revenue]) => ({
          date,
          revenue: Number(revenue.toFixed(2)),
        }));
    } else {
      // Daily (Week/Month) -> YYYY-MM-DD
      const dailyData = new Map<string, number>();

      orders.forEach((order) => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        const current = dailyData.get(date) || 0;
        dailyData.set(date, current + Number(order.totalAmount));
      });

      return Array.from(dailyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, revenue]) => ({
          date,
          revenue: Number(revenue.toFixed(2)),
        }));
    }
  }

  /**
   * Get orders by category (Bar Chart)
   */
  async getOrdersByCategory(
    restaurantId: string | undefined,
    user: any,
    period: 'today' | 'week' | 'month' | 'year' = 'today',
  ): Promise<any> {
    this.logger.log(`========== GET ORDERS BY CATEGORY ==========`);
    this.logger.log(`Period: ${period}`);

    const restaurantFilter = this.getRestaurantFilter(restaurantId, user);
    this.logger.log(`Restaurant Filter: ${JSON.stringify(restaurantFilter)}`);

    // Get date range based on period
    const { startDate, endDate } = this.getDateRangeForPeriod(period);
    this.logger.log(`Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // First get order IDs for the period (COMPLETED orders only)
    const orderIds = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        createdAt: Between(startDate, endDate),
        status: OrderStatusEnum.COMPLETED, // Only COMPLETED orders count
      },
      select: ['id'],
    });

    this.logger.log(`Found ${orderIds.length} completed orders in period`);

    const orderItems = orderIds.length > 0
      ? await this.orderItemRepository.find({
        where: {
          orderId: In(orderIds.map((o) => o.id)),
        },
        relations: ['menu', 'menu.category'],
      })
      : [];

    this.logger.log(`Found ${orderItems.length} order items`);

    // Group by category
    const categoryCounts = new Map<string, number>();
    orderItems.forEach((item) => {
      const categoryName = item.menu?.category?.name || 'Uncategorized';
      const current = categoryCounts.get(categoryName) || 0;
      categoryCounts.set(categoryName, current + item.quantity);
    });

    this.logger.log(`Categories found: ${Array.from(categoryCounts.keys()).join(', ')}`);

    // Only return categories that actually have data
    // Do NOT show hardcoded categories with 0 count
    const result = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    this.logger.log(`Returning ${result.length} categories`);
    this.logger.log(`========================================`);

    return result;
  }

  /**
   * Get payment methods distribution (Pie Chart)
   */
  async getPaymentMethods(
    restaurantId: string | undefined,
    user: any,
    period: 'today' | 'week' | 'month' | 'year' = 'today',
  ): Promise<any> {
    this.logger.log(`========== GET PAYMENT METHODS ==========`);
    this.logger.log(`Period: ${period}`);

    const restaurantFilter = this.getRestaurantFilter(restaurantId, user);
    this.logger.log(`Restaurant Filter: ${JSON.stringify(restaurantFilter)}`);

    // Get date range based on period
    const { startDate, endDate } = this.getDateRangeForPeriod(period);
    this.logger.log(`Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const orders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        status: OrderStatusEnum.COMPLETED,
        createdAt: Between(startDate, endDate),
      },
      relations: ['payments'],
    });

    this.logger.log(`Found ${orders.length} completed orders in period`);

    const paymentCounts = new Map<string, number>();
    const paymentAmounts = new Map<string, number>();

    orders.forEach((order) => {
      const latestPayment = order.payments && order.payments.length > 0
        ? order.payments.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        )[0]
        : null;

      const method = latestPayment
        ? latestPayment.method
        : 'unknown';

      // Map payment methods to display names using helper
      const displayName = this.getPaymentMethodDisplayName(method);

      const currentCount = paymentCounts.get(displayName) || 0;
      paymentCounts.set(displayName, currentCount + 1);

      const currentAmount = paymentAmounts.get(displayName) || 0;
      paymentAmounts.set(
        displayName,
        currentAmount + Number(order.totalAmount),
      );
    });

    this.logger.log(`Payment methods found: ${Array.from(paymentCounts.keys()).join(', ')}`);

    const totalAmount = Array.from(paymentAmounts.values()).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    const result = Array.from(paymentCounts.keys()).map((method) => ({
      method,
      count: paymentCounts.get(method) || 0,
      amount: Number((paymentAmounts.get(method) || 0).toFixed(2)),
      percentage:
        totalAmount > 0
          ? Number(
            (((paymentAmounts.get(method) || 0) / totalAmount) * 100).toFixed(
              2,
            ),
          )
          : 0,
    }));

    this.logger.log(`Returning ${result.length} payment methods`);
    this.logger.log(`========================================`);

    return result;
  }

  /**
   * Get table occupancy trend (Area/Line Chart)
   */
  async getTableOccupancyTrend(
    restaurantId: string | undefined,
    user: any,
    period: 'today' | 'week' | 'month' | 'year' = 'today',
  ): Promise<any> {
    const restaurantFilter = this.getRestaurantFilter(restaurantId, user);

    // Get date range 
    const { startDate, endDate } = this.getDateRangeForPeriod(period);

    // Get all orders with tableId (ACTIVE orders, not just completed)
    const orders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        createdAt: Between(startDate, endDate),
        status: Not(In([OrderStatusEnum.CANCELLED, OrderStatusEnum.ABANDONED])),
        tableId: Not(IsNull()),
      },
      order: { createdAt: 'ASC' },
    });

    const totalTables = await this.tableRepository.count({
      where: restaurantFilter,
    });

    if (period === 'today') {
      // Hourly (0-23) - Use IST timezone
      // Show actual table occupancy duration, not just when orders were created
      const bucketMap = new Map<number, Set<string>>();
      for (let hour = 0; hour < 24; hour++) {
        bucketMap.set(hour, new Set());
      }

      orders.forEach((order) => {
        // Get start hour (when order created) in IST
        const startDate = new Date(order.createdAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const startHour = startDate.getHours();

        // Get end hour (when order completed/updated) in IST
        // If order is still active (not completed), use current time
        const endDate = order.updatedAt
          ? new Date(order.updatedAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
          : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const endHour = endDate.getHours();

        // Mark table as occupied for all hours from start to end
        // This shows actual table occupancy duration
        const minHour = Math.min(startHour, endHour);
        const maxHour = Math.max(startHour, endHour);

        for (let hour = minHour; hour <= maxHour; hour++) {
          const tableSet = bucketMap.get(hour);
          if (tableSet && order.tableId) {
            tableSet.add(order.tableId);
          }
        }
      });

      return Array.from(bucketMap.entries()).map(([hour, tableSet]) => ({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
        occupied: tableSet.size,
        total: totalTables,
        occupancyRate:
          totalTables > 0
            ? Number(((tableSet.size / totalTables) * 100).toFixed(2))
            : 0,
      }));
    } else {
      // Daily/Monthly buckets
      const bucketMap = new Map<string, Set<string>>();

      orders.forEach((order) => {
        let key: string;
        const d = new Date(order.createdAt);
        if (period === 'year') {
          // Monthly keys YYYY-MM
          key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        } else {
          // Daily keys YYYY-MM-DD
          key = d.toISOString().split('T')[0];
        }

        if (!bucketMap.has(key)) bucketMap.set(key, new Set());
        bucketMap.get(key).add(order.tableId);
      });

      return Array.from(bucketMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, tableSet]) => ({
          time: date, // Using 'time' field to carry date string for compatibility
          occupied: tableSet.size,
          total: totalTables,
          occupancyRate: totalTables > 0 ? Number(((tableSet.size / totalTables) * 100).toFixed(2)) : 0
        }));
    }
  }

  /**
   * Get recent orders table
   */
  async getRecentOrders(
    restaurantId: string | undefined,
    user: any,
    limit: number = 10,
  ): Promise<any> {
    const restaurantFilter = this.getRestaurantFilter(restaurantId, user);

    // Get today's date range - only show TODAY's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        createdAt: Between(today, tomorrow), // Only today's orders
      },
      relations: ['orderItems', 'orderItems.menu', 'orderItems.menu.category', 'table', 'customer', 'payments'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return orders.map((order) => {
      // Get payment method from the most recent payment
      const latestPayment = order.payments && order.payments.length > 0
        ? order.payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;

      // Safely handle totalAmount (can be null/undefined or a decimal type)
      const totalAmount = order.totalAmount != null
        ? Number(Number(order.totalAmount).toFixed(2))
        : 0;

      return {
        orderId: order.id,
        orderNumber: order.orderNumber || null,
        tableNo: order.tableNo || order.table?.name || 'N/A',
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
        itemsCount: order.orderItems?.length || 0,
        totalAmount: totalAmount,
        paymentMethod: latestPayment?.method || null,
        paymentStatus: latestPayment?.status || null,
        orderTime: order.createdAt,
        orderStatus: order.status,
        isOnHold: order.isOnHold || false,
        holdReason: order.holdReason || null,
      };
    });
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(
    restaurantId: string | undefined,
    user: any,
    options?: {
      salesPeriod?: 'today' | 'week' | 'month' | 'year';
      recentOrdersLimit?: number;
    },
  ): Promise<any> {
    const [
      summary,
      salesOverview,
      ordersByCategory,
      paymentMethods,
      tableOccupancy,
      recentOrders,
    ] = await Promise.all([
      this.getDashboardSummary(restaurantId, user),
      this.getSalesOverview(
        restaurantId,
        user,
        options?.salesPeriod || 'today',
      ),
      this.getOrdersByCategory(
        restaurantId,
        user,
        options?.salesPeriod || 'today',
      ),
      this.getPaymentMethods(
        restaurantId,
        user,
        options?.salesPeriod || 'today',
      ),
      this.getTableOccupancyTrend(
        restaurantId,
        user,
        options?.salesPeriod || 'today',
      ),
      this.getRecentOrders(
        restaurantId,
        user,
        options?.recentOrdersLimit || 10,
      ),
    ]);

    return {
      summary,
      charts: {
        salesOverview,
        ordersByCategory,
        paymentMethods,
        tableOccupancy,
      },
      recentOrders,
    };
  }

  /**
   * Get Restaurant Analytics (Top 6 Analytics)
   * Returns comprehensive analytics for restaurant owners/admins
   */
  async getRestaurantAnalytics(
    restaurantId: string | undefined,
    user: any,
    period: 'today' | 'week' | 'month' | 'year' = 'today',
  ): Promise<any> {
    const restaurantFilter = this.getRestaurantFilter(restaurantId, user);

    // Get date range based on period
    const { startDate, endDate } = this.getDateRangeForPeriod(period);

    // Calculate comparison dates
    const comparisonStartDate = new Date(startDate);
    const comparisonEndDate = new Date(endDate);

    if (period === 'today') {
      comparisonStartDate.setDate(startDate.getDate() - 1);
      comparisonEndDate.setDate(endDate.getDate() - 1);
    } else if (period === 'week') {
      comparisonStartDate.setDate(startDate.getDate() - 7);
      comparisonEndDate.setDate(endDate.getDate() - 7);
    } else if (period === 'month') {
      comparisonStartDate.setMonth(startDate.getMonth() - 1);
      comparisonEndDate.setMonth(endDate.getMonth() - 1);
    } else if (period === 'year') {
      comparisonStartDate.setFullYear(startDate.getFullYear() - 1);
      comparisonEndDate.setFullYear(endDate.getFullYear() - 1);
    }

    // 1. Daily/Weekly Sales Overview (COMPLETED orders only for revenue)
    const currentPeriodOrders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        createdAt: Between(startDate, endDate),
        status: OrderStatusEnum.COMPLETED, // Only COMPLETED orders count for revenue
      },
    });

    const comparisonPeriodOrders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        status: OrderStatusEnum.COMPLETED, // Only COMPLETED orders count for revenue
        createdAt: Between(comparisonStartDate, comparisonEndDate),
      },
    });

    const currentRevenue = currentPeriodOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const comparisonRevenue = comparisonPeriodOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const trendPercent =
      comparisonRevenue > 0
        ? ((currentRevenue - comparisonRevenue) / comparisonRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0;

    // Find peak revenue day
    const dailyRevenue = new Map<string, number>();
    currentPeriodOrders.forEach((order) => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      const current = dailyRevenue.get(dateKey) || 0;
      dailyRevenue.set(dateKey, current + Number(order.totalAmount));
    });

    let peakRevenueDay = null;
    let peakRevenue = 0;
    dailyRevenue.forEach((revenue, date) => {
      if (revenue > peakRevenue) {
        peakRevenue = revenue;
        peakRevenueDay = date;
      }
    });

    // 2. Top Selling Items
    const orderIds = currentPeriodOrders.map((o) => o.id);
    const orderItems =
      orderIds.length > 0
        ? await this.orderItemRepository.find({
          where: {
            orderId: In(orderIds),
          },
          relations: ['menu', 'menu.category'],
        })
        : [];

    const itemStats = new Map<
      string,
      { name: string; quantity: number; revenue: number; image: string | null; category: string }
    >();

    orderItems.forEach((item) => {
      const menuId = item.menuId;
      const menuName = item.menu?.name || 'Unknown';
      const menuImage = item.menu?.image || null;
      const categoryName = item.menu?.category?.name || 'Uncategorized';

      const existing = itemStats.get(menuId) || {
        name: menuName,
        quantity: 0,
        revenue: 0,
        image: menuImage,
        category: categoryName,
      };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.totalPrice);
      itemStats.set(menuId, existing);
    });

    const topSellingItems = Array.from(itemStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((item) => ({
        name: item.name,
        image: item.image,
        category: item.category,
        quantity: item.quantity,
        revenue: Number(item.revenue.toFixed(2)),
        revenueContribution:
          currentRevenue > 0
            ? Number(((item.revenue / currentRevenue) * 100).toFixed(2))
            : 0,
      }));

    // 3. Orders by Category (only show actual categories with data)
    const categoryStats = new Map<string, number>();
    orderItems.forEach((item) => {
      const categoryName = item.menu?.category?.name || 'Uncategorized';
      const current = categoryStats.get(categoryName) || 0;
      categoryStats.set(categoryName, current + item.quantity);
    });

    // Only return categories that have data, sorted by count
    const ordersByCategory = Array.from(categoryStats.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 4. Table Occupancy Rate
    const totalTables = await this.tableRepository.count({
      where: restaurantFilter,
    });

    const ordersWithTables = currentPeriodOrders.filter(
      (order) => order.tableId,
    );
    const uniqueTables = new Set(
      ordersWithTables.map((order) => order.tableId).filter(Boolean),
    );

    // Hourly occupancy for the period
    const hourlyOccupancy = new Map<number, Set<string>>();
    for (let hour = 0; hour < 24; hour++) {
      hourlyOccupancy.set(hour, new Set());
    }

    ordersWithTables.forEach((order) => {
      // Get start hour (when order created) in IST
      const startDate = new Date(order.createdAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const startHour = startDate.getHours();

      // Get end hour (when order completed/updated) in IST
      // If order is still active (not completed), use current time
      const endDate = order.updatedAt
        ? new Date(order.updatedAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
        : new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const endHour = endDate.getHours();

      // Mark table as occupied for all hours from start to end
      // This shows actual table occupancy duration
      const minHour = Math.min(startHour, endHour);
      const maxHour = Math.max(startHour, endHour);

      for (let hour = minHour; hour <= maxHour; hour++) {
        const tableSet = hourlyOccupancy.get(hour);
        if (tableSet && order.tableId) {
          tableSet.add(order.tableId);
        }
      }
    });

    const tableOccupancyData = Array.from(hourlyOccupancy.entries()).map(
      ([hour, tableSet]) => ({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
        occupied: tableSet.size,
        total: totalTables,
        occupancyRate:
          totalTables > 0
            ? Number(((tableSet.size / totalTables) * 100).toFixed(2))
            : 0,
      }),
    );

    // 5. Payment Methods Breakdown (COMPLETED orders only)
    const ordersWithPayments = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        createdAt: Between(startDate, endDate),
        status: OrderStatusEnum.COMPLETED,
      },
      relations: ['payments'],
    });

    const paymentStats = new Map<
      string,
      { count: number; amount: number }
    >();

    ordersWithPayments.forEach((order) => {
      const latestPayment =
        order.payments && order.payments.length > 0
          ? order.payments.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          )[0]
          : null;

      let method = 'Unknown';
      if (latestPayment) {
        method = this.getPaymentMethodDisplayName(latestPayment.method);
      }

      const existing = paymentStats.get(method) || { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += Number(order.totalAmount);
      paymentStats.set(method, existing);
    });

    const totalPaymentAmount = Array.from(paymentStats.values()).reduce(
      (sum, stat) => sum + stat.amount,
      0,
    );

    const paymentMethods = Array.from(paymentStats.entries()).map(
      ([method, stat]) => ({
        method,
        count: stat.count,
        amount: Number(stat.amount.toFixed(2)),
        percentage:
          totalPaymentAmount > 0
            ? Number(((stat.amount / totalPaymentAmount) * 100).toFixed(2))
            : 0,
      }),
    );

    // 6. Peak Hours Analytics
    const hourlyStats = new Map<
      number,
      { orders: number; revenue: number; items: number }
    >();

    for (let hour = 0; hour < 24; hour++) {
      hourlyStats.set(hour, { orders: 0, revenue: 0, items: 0 });
    }

    currentPeriodOrders.forEach((order) => {
      // Extract hour in IST timezone
      const istDate = new Date(order.createdAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hour = istDate.getHours();
      const stats = hourlyStats.get(hour);
      if (stats) {
        stats.orders += 1;
        stats.revenue += Number(order.totalAmount);
      }
    });

    // Count items per hour
    orderItems.forEach((item) => {
      const order = currentPeriodOrders.find((o) => o.id === item.orderId);
      if (order) {
        // Extract hour in IST timezone
        const istDate = new Date(order.createdAt.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const hour = istDate.getHours();
        const stats = hourlyStats.get(hour);
        if (stats) {
          stats.items += item.quantity;
        }
      }
    });

    const peakHours = Array.from(hourlyStats.entries()).map(
      ([hour, stats]) => ({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour,
        orders: stats.orders,
        revenue: Number(stats.revenue.toFixed(2)),
        items: stats.items,
      }),
    );

    // 7. Revenue by Category
    const categoryRevenue = new Map<string, { revenue: number; orders: number }>();
    orderItems.forEach((item) => {
      const categoryName = item.menu?.category?.name || 'Uncategorized';
      const existing = categoryRevenue.get(categoryName) || { revenue: 0, orders: 0 };
      existing.revenue += Number(item.totalPrice);
      existing.orders += 1;
      categoryRevenue.set(categoryName, existing);
    });

    const totalCategoryRevenue = Array.from(categoryRevenue.values()).reduce(
      (sum, cat) => sum + cat.revenue,
      0,
    );

    const revenueByCategory = Array.from(categoryRevenue.entries())
      .map(([category, stats]) => ({
        category,
        revenue: Number(stats.revenue.toFixed(2)),
        orders: stats.orders,
        percentage:
          totalCategoryRevenue > 0
            ? Number(((stats.revenue / totalCategoryRevenue) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 8. Customer Insights
    const uniqueCustomers = new Set(
      currentPeriodOrders.map((o) => o.customerId).filter(Boolean),
    );

    // Get new customers (first order in this period)
    const customerFirstOrders = new Map<string, Date>();
    const allOrders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        status: Not(In([OrderStatusEnum.CANCELLED, OrderStatusEnum.ABANDONED])),
      },
      select: ['customerId', 'createdAt'],
      order: { createdAt: 'ASC' },
    });

    allOrders.forEach((order) => {
      if (order.customerId && !customerFirstOrders.has(order.customerId)) {
        customerFirstOrders.set(order.customerId, order.createdAt);
      }
    });

    let newCustomers = 0;
    uniqueCustomers.forEach((customerId) => {
      const firstOrderDate = customerFirstOrders.get(customerId);
      if (firstOrderDate && firstOrderDate >= startDate && firstOrderDate <= endDate) {
        newCustomers++;
      }
    });

    const returningCustomers = uniqueCustomers.size - newCustomers;

    // Calculate average orders per customer
    const customerOrderCounts = new Map<string, number>();
    currentPeriodOrders.forEach((order) => {
      if (order.customerId) {
        const current = customerOrderCounts.get(order.customerId) || 0;
        customerOrderCounts.set(order.customerId, current + 1);
      }
    });

    const avgOrdersPerCustomer =
      uniqueCustomers.size > 0
        ? Number((currentPeriodOrders.length / uniqueCustomers.size).toFixed(2))
        : 0;

    const customerInsights = {
      totalCustomers: uniqueCustomers.size,
      newCustomers,
      returningCustomers,
      avgOrdersPerCustomer,
      customerRetentionRate:
        uniqueCustomers.size > 0
          ? Number(((returningCustomers / uniqueCustomers.size) * 100).toFixed(2))
          : 0,
    };

    return {
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      salesOverview: {
        totalRevenue: Number(currentRevenue.toFixed(2)),
        trendPercent: Number(trendPercent.toFixed(2)),
        trend: trendPercent >= 0 ? 'up' : 'down',
        comparisonPeriod:
          period === 'today'
            ? 'yesterday'
            : period === 'week'
              ? 'last week'
              : period === 'month'
                ? 'last month'
                : 'last year',
        peakRevenueDay,
        peakRevenue: peakRevenueDay ? Number(peakRevenue.toFixed(2)) : 0,
        period: period,
      },
      topSellingItems,
      ordersByCategory,
      revenueByCategory,
      top5Foods: topSellingItems.slice(0, 5), // Top 5 most popular foods
      paymentMethods,
      peakHours,
      customerInsights,
    };
  }

  /**
   * Get Top 10 Foods
   * Returns top 10 most popular food items with images, categories, and sales data
   */
  async getTop10Foods(
    restaurantId: string | undefined,
    user: any,
    period: 'today' | 'week' | 'month' | 'year' = 'today',
  ): Promise<any> {
    const restaurantFilter = this.getRestaurantFilter(restaurantId, user);

    // Get date range
    const { startDate, endDate } = this.getDateRangeForPeriod(period);

    // Get completed orders
    const orders = await this.orderRepository.find({
      where: {
        ...restaurantFilter,
        createdAt: Between(startDate, endDate),
        status: OrderStatusEnum.COMPLETED,
      },
    });

    const orderIds = orders.map((o) => o.id);
    const orderItems =
      orderIds.length > 0
        ? await this.orderItemRepository.find({
          where: {
            orderId: In(orderIds),
          },
          relations: ['menu', 'menu.category'],
        })
        : [];

    // Calculate item statistics
    const itemStats = new Map<
      string,
      {
        menuId: string;
        name: string;
        image: string | null;
        category: string;
        quantity: number;
        revenue: number;
      }
    >();

    orderItems.forEach((item) => {
      const menuId = item.menuId;
      const menuName = item.menu?.name || 'Unknown';
      const menuImage = item.menu?.image || null;
      const categoryName = item.menu?.category?.name || 'Uncategorized';

      const existing = itemStats.get(menuId) || {
        menuId,
        name: menuName,
        image: menuImage,
        category: categoryName,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.totalPrice);
      itemStats.set(menuId, existing);
    });

    const totalRevenue = Array.from(itemStats.values()).reduce(
      (sum, item) => sum + item.revenue,
      0,
    );

    // Return top 10 foods sorted by quantity sold
    const top10Foods = Array.from(itemStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((item, index) => ({
        rank: index + 1,
        menuId: item.menuId,
        name: item.name,
        image: item.image,
        category: item.category,
        quantitySold: item.quantity,
        revenue: Number(item.revenue.toFixed(2)),
        revenueContribution:
          totalRevenue > 0
            ? Number(((item.revenue / totalRevenue) * 100).toFixed(2))
            : 0,
      }));

    return {
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalItems: itemStats.size,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      top10Foods,
    };
  }

  /**
   * Helper method to get restaurant filter
   */
  private getRestaurantFilter(restaurantId: string | undefined, user: any): any {
    const filter: any = {};

    if (restaurantId) {
      filter.restaurantId = restaurantId;
    } else if (user.restaurantId) {
      filter.restaurantId = user.restaurantId;
    } else if (user.role !== 'super_admin') {
      throw new BadRequestException(
        'Restaurant ID is required for non-admin users',
      );
    }

    return filter;
  }

  /**
   * Helper method to get date range for a given period
   */
  private getDateRangeForPeriod(period: 'today' | 'week' | 'month' | 'year'): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    let startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'week':
        // Last 7 days
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'month':
        // Last 30 days
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'year':
        // Last 365 days
        startDate.setDate(now.getDate() - 365);
        startDate.setHours(0, 0, 0, 0);
        break;

      default:
        // Default to today
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }

  /**
   * Helper to map payment method enum to human-readable display names
   * Groups cashier payment methods with their primary counterparts
   */
  private getPaymentMethodDisplayName(method: string): string {
    switch (method) {
      case PaymentMethod.CASH:
      case PaymentMethod.CASHIER_CASH:
        return 'Cash';
      case PaymentMethod.CARD:
      case PaymentMethod.CASHIER_CARD:
        return 'Card';
      case PaymentMethod.QR:
      case PaymentMethod.CASHIER_QR:
        return 'QR';
      case PaymentMethod.CASHIER:
        return 'Cashier';
      default:
        // Handle cases where method might be 'unknown' or other strings
        if (method?.toLowerCase().includes('cash')) return 'Cash';
        if (method?.toLowerCase().includes('card')) return 'Card';
        if (method?.toLowerCase().includes('qr')) return 'QR';
        return 'Unknown';
    }
  }
}
