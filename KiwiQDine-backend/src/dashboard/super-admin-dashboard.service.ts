import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import {
    Order,
    OrderItem,
    Restaurant,
    Customer,
    User,
    Menu,
    Payment,
    Tenant,
} from '../infrastructure/database/entities';
import { RestaurantSubscription, RestaurantSubscriptionStatus } from '../infrastructure/database/entities/restaurant-subscription.entity';
import { SubscriptionPlanEntity, SubscriptionPlanStatus } from '../infrastructure/database/entities/subscription-plan.entity';
import { OrderStatus as OrderStatusEnum } from '../infrastructure/database/entities/order.entity';

@Injectable()
export class SuperAdminDashboardService {
    private readonly logger = new Logger(SuperAdminDashboardService.name);

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Restaurant)
        private restaurantRepository: Repository<Restaurant>,
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Menu)
        private menuRepository: Repository<Menu>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(RestaurantSubscription)
        private restaurantSubscriptionRepository: Repository<RestaurantSubscription>,
        @InjectRepository(SubscriptionPlanEntity)
        private subscriptionPlanRepository: Repository<SubscriptionPlanEntity>,
        @InjectRepository(Tenant)
        private tenantRepository: Repository<Tenant>,
    ) { }

    /**
     * SUPER ADMIN OVERVIEW with Growth Metrics
     */
    async getSuperAdminOverview(period: 'today' | 'week' | 'month' | 'year' = 'today') {
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        // Current period data
        const orders = await this.orderRepository.find({
            where: {
                createdAt: Between(startDate, endDate),
                status: OrderStatusEnum.COMPLETED,
            },
        });

        const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const newCustomers = await this.customerRepository.count({
            where: { createdAt: Between(startDate, endDate) },
        });
        const newUsers = await this.userRepository.count({
            where: { createdAt: Between(startDate, endDate) },
        });

        // Previous period data
        const prevOrders = await this.orderRepository.find({
            where: {
                createdAt: Between(previousPeriod.startDate, previousPeriod.endDate),
                status: OrderStatusEnum.COMPLETED,
            },
        });

        const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const prevCustomers = await this.customerRepository.count({
            where: { createdAt: Between(previousPeriod.startDate, previousPeriod.endDate) },
        });
        const prevUsers = await this.userRepository.count({
            where: { createdAt: Between(previousPeriod.startDate, previousPeriod.endDate) },
        });

        // Calculate growth
        const revenueGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : revenue > 0 ? 100 : 0;
        const orderGrowth = prevOrders.length > 0 ? ((orders.length - prevOrders.length) / prevOrders.length) * 100 : orders.length > 0 ? 100 : 0;
        const customerGrowth = prevCustomers > 0 ? ((newCustomers - prevCustomers) / prevCustomers) * 100 : newCustomers > 0 ? 100 : 0;
        const userGrowth = prevUsers > 0 ? ((newUsers - prevUsers) / prevUsers) * 100 : newUsers > 0 ? 100 : 0;

        const totalRestaurants = await this.restaurantRepository.count();
        const activeRestaurants = await this.restaurantRepository.count({ where: { isActive: true } });

        return {
            period,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            overview: {
                totalRestaurants,
                activeRestaurants,
                totalRevenue: Number(revenue.toFixed(2)),
                previousRevenue: Number(prevRevenue.toFixed(2)),
                revenueGrowth: Number(revenueGrowth.toFixed(2)),
                totalOrders: orders.length,
                previousOrders: prevOrders.length,
                orderGrowth: Number(orderGrowth.toFixed(2)),
                newCustomers,
                previousNewCustomers: prevCustomers,
                customerGrowth: Number(customerGrowth.toFixed(2)),
                newUsers,
                previousNewUsers: prevUsers,
                userGrowth: Number(userGrowth.toFixed(2)),
                averageOrderValue: orders.length > 0 ? Number((revenue / orders.length).toFixed(2)) : 0,
            },
        };
    }

    /**
     * 4 SUMMARY CARDS with Growth - Platform Metrics (Subscription Revenue)
     * Super Admin cares about platform revenue (subscriptions), not order revenue
     */
    async getSummaryCards(period: 'today' | 'week' | 'month' | 'year' = 'today') {
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        // 1. SUBSCRIPTION REVENUE - Platform's actual income
        const currentSubscriptions = await this.restaurantSubscriptionRepository
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.plan', 'plan')
            .where('subscription.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('subscription.status = :status', { status: RestaurantSubscriptionStatus.ACTIVE })
            .getMany();

        const previousSubscriptions = await this.restaurantSubscriptionRepository
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.plan', 'plan')
            .where('subscription.createdAt BETWEEN :startDate AND :endDate', {
                startDate: previousPeriod.startDate,
                endDate: previousPeriod.endDate,
            })
            .andWhere('subscription.status = :status', { status: RestaurantSubscriptionStatus.ACTIVE })
            .getMany();

        const currentSubscriptionRevenue = currentSubscriptions.reduce((sum, sub) => {
            const price = sub.billingCycle === 'monthly'
                ? Number(sub.plan?.priceMonthly || 0)
                : Number(sub.plan?.priceYearly || 0);
            return sum + price;
        }, 0);

        const previousSubscriptionRevenue = previousSubscriptions.reduce((sum, sub) => {
            const price = sub.billingCycle === 'monthly'
                ? Number(sub.plan?.priceMonthly || 0)
                : Number(sub.plan?.priceYearly || 0);
            return sum + price;
        }, 0);

        const subscriptionRevenueGrowth = previousSubscriptionRevenue > 0
            ? ((currentSubscriptionRevenue - previousSubscriptionRevenue) / previousSubscriptionRevenue) * 100
            : currentSubscriptionRevenue > 0 ? 100 : 0;

        // 2. ACTIVE TENANTS - Number of paying customers
        const currentActiveTenants = await this.restaurantRepository
            .createQueryBuilder('restaurant')
            .select('DISTINCT restaurant.tenantId')
            .where('restaurant.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('restaurant.isActive = :isActive', { isActive: true })
            .getRawMany();

        const previousActiveTenants = await this.restaurantRepository
            .createQueryBuilder('restaurant')
            .select('DISTINCT restaurant.tenantId')
            .where('restaurant.createdAt BETWEEN :startDate AND :endDate', {
                startDate: previousPeriod.startDate,
                endDate: previousPeriod.endDate,
            })
            .andWhere('restaurant.isActive = :isActive', { isActive: true })
            .getRawMany();

        const tenantGrowth = previousActiveTenants.length > 0
            ? ((currentActiveTenants.length - previousActiveTenants.length) / previousActiveTenants.length) * 100
            : currentActiveTenants.length > 0 ? 100 : 0;

        // 3. ACTIVE RESTAURANTS - Total restaurants across all tenants
        const currentActiveRestaurants = await this.restaurantRepository.count({
            where: {
                createdAt: Between(startDate, endDate),
                isActive: true,
            },
        });

        const previousActiveRestaurants = await this.restaurantRepository.count({
            where: {
                createdAt: Between(previousPeriod.startDate, previousPeriod.endDate),
                isActive: true,
            },
        });

        const restaurantGrowth = previousActiveRestaurants > 0
            ? ((currentActiveRestaurants - previousActiveRestaurants) / previousActiveRestaurants) * 100
            : currentActiveRestaurants > 0 ? 100 : 0;

        // 4. TOTAL USERS - Platform-wide user count
        const currentUsers = await this.userRepository.count({
            where: { createdAt: Between(startDate, endDate) },
        });

        const previousUsers = await this.userRepository.count({
            where: { createdAt: Between(previousPeriod.startDate, previousPeriod.endDate) },
        });

        const userGrowth = previousUsers > 0
            ? ((currentUsers - previousUsers) / previousUsers) * 100
            : currentUsers > 0 ? 100 : 0;

        return {
            period,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            cards: {
                subscriptionRevenue: {
                    value: Number(currentSubscriptionRevenue.toFixed(2)),
                    previousValue: Number(previousSubscriptionRevenue.toFixed(2)),
                    growth: Number(subscriptionRevenueGrowth.toFixed(2)),
                    trend: subscriptionRevenueGrowth >= 0 ? 'up' : 'down',
                    label: 'Subscription Revenue',
                    description: 'Platform income from subscriptions',
                    icon: 'currency',
                    type: 'currency',
                },
                activeTenants: {
                    value: currentActiveTenants.length,
                    previousValue: previousActiveTenants.length,
                    growth: Number(tenantGrowth.toFixed(2)),
                    trend: tenantGrowth >= 0 ? 'up' : 'down',
                    label: 'Active Tenants',
                    description: 'Number of paying tenants',
                    icon: 'building',
                    type: 'number',
                },
                activeRestaurants: {
                    value: currentActiveRestaurants,
                    previousValue: previousActiveRestaurants,
                    growth: Number(restaurantGrowth.toFixed(2)),
                    trend: restaurantGrowth >= 0 ? 'up' : 'down',
                    label: 'Active Restaurants',
                    description: 'Total restaurants across all tenants',
                    icon: 'store',
                    type: 'number',
                },
                totalUsers: {
                    value: currentUsers,
                    previousValue: previousUsers,
                    growth: Number(userGrowth.toFixed(2)),
                    trend: userGrowth >= 0 ? 'up' : 'down',
                    label: 'Total Users',
                    description: 'Platform-wide user count',
                    icon: 'users',
                    type: 'number',
                },
            },
        };
    }

    /**
     * GROWTH TRENDS GRAPH - Multi-metric over time
     */
    async getGrowthTrends(
        period: 'week' | 'month' | 'quarter' | 'year' = 'month',
        granularity: 'daily' | 'weekly' | 'monthly' = 'daily',
    ) {
        const { startDate, endDate } = this.getDateRange(period);

        const orders = await this.orderRepository.find({
            where: { createdAt: Between(startDate, endDate), status: OrderStatusEnum.COMPLETED },
            order: { createdAt: 'ASC' },
        });

        const customers = await this.customerRepository.find({
            where: { createdAt: Between(startDate, endDate) },
            order: { createdAt: 'ASC' },
        });

        const users = await this.userRepository.find({
            where: { createdAt: Between(startDate, endDate) },
            order: { createdAt: 'ASC' },
        });

        const revenueData = this.groupByPeriod(orders, granularity, 'order');
        const customerData = this.groupByPeriod(customers, granularity, 'customer');
        const userData = this.groupByPeriod(users, granularity, 'user');

        const allPeriods = new Set([
            ...revenueData.map(d => d.period),
            ...customerData.map(d => d.period),
            ...userData.map(d => d.period),
        ]);

        const trends = Array.from(allPeriods).sort().map(period => {
            const rev = revenueData.find(d => d.period === period);
            const cust = customerData.find(d => d.period === period);
            const usr = userData.find(d => d.period === period);

            return {
                period,
                revenue: rev?.revenue || 0,
                orders: rev?.count || 0,
                newCustomers: cust?.count || 0,
                newUsers: usr?.count || 0,
            };
        });

        return {
            period,
            granularity,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            trends,
            summary: {
                totalRevenue: trends.reduce((sum, t) => sum + t.revenue, 0),
                totalOrders: trends.reduce((sum, t) => sum + t.orders, 0),
                totalNewCustomers: trends.reduce((sum, t) => sum + t.newCustomers, 0),
                totalNewUsers: trends.reduce((sum, t) => sum + t.newUsers, 0),
            },
        };
    }


    // Helper methods
    private getDateRange(period: string): { startDate: Date; endDate: Date } {
        // Get current date/time in IST timezone
        const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const endDate = new Date(nowIST);
        const startDate = new Date(nowIST);

        switch (period) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate.setDate(startDate.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'quarter':
                startDate.setDate(startDate.getDate() - 90);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                startDate.setHours(0, 0, 0, 0);
                break;
        }

        return { startDate, endDate };
    }

    private getPreviousPeriod(startDate: Date, endDate: Date): { startDate: Date; endDate: Date } {
        const duration = endDate.getTime() - startDate.getTime();
        const previousEndDate = new Date(startDate.getTime() - 1);
        const previousStartDate = new Date(previousEndDate.getTime() - duration);
        return { startDate: previousStartDate, endDate: previousEndDate };
    }

    private groupByPeriod(items: any[], granularity: string, type: 'order' | 'customer' | 'user'): any[] {
        const grouped = new Map<string, any>();

        items.forEach(item => {
            const date = new Date(item.createdAt);
            let key: string;

            switch (granularity) {
                case 'daily':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }

            const existing = grouped.get(key) || { period: key, count: 0, revenue: 0 };
            existing.count++;
            if (type === 'order') {
                existing.revenue += Number(item.totalAmount);
            }
            grouped.set(key, existing);
        });

        return Array.from(grouped.values())
            .map(d => ({
                ...d,
                revenue: Number(d.revenue.toFixed(2)),
            }))
            .sort((a, b) => a.period.localeCompare(b.period));
    }

    /**
     * RESTAURANTS PERFORMANCE - Individual restaurant metrics
     */
    async getRestaurantsPerformance(period: 'today' | 'week' | 'month' | 'year' = 'today') {
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        const restaurants = await this.restaurantRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });

        const performanceData = await Promise.all(
            restaurants.map(async (restaurant) => {
                const currentOrders = await this.orderRepository.find({
                    where: {
                        restaurantId: restaurant.id,
                        createdAt: Between(startDate, endDate),
                        status: OrderStatusEnum.COMPLETED,
                    },
                });

                const previousOrders = await this.orderRepository.find({
                    where: {
                        restaurantId: restaurant.id,
                        createdAt: Between(previousPeriod.startDate, previousPeriod.endDate),
                        status: OrderStatusEnum.COMPLETED,
                    },
                });

                const currentRevenue = currentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
                const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

                const revenueGrowth = previousRevenue > 0
                    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
                    : currentRevenue > 0 ? 100 : 0;

                const orderGrowth = previousOrders.length > 0
                    ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
                    : currentOrders.length > 0 ? 100 : 0;

                const avgOrderValue = currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0;
                const avgPrepTime = 18; // Default value

                return {
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    revenue: Number(currentRevenue.toFixed(2)),
                    previousRevenue: Number(previousRevenue.toFixed(2)),
                    revenueGrowth: Number(revenueGrowth.toFixed(2)),
                    orders: currentOrders.length,
                    previousOrders: previousOrders.length,
                    orderGrowth: Number(orderGrowth.toFixed(2)),
                    avgOrderValue: Number(avgOrderValue.toFixed(2)),
                    avgPrepTime: Math.round(avgPrepTime),
                    activeCustomers: new Set(currentOrders.map(o => o.customerId)).size,
                };
            })
        );

        performanceData.sort((a, b) => b.revenue - a.revenue);

        return {
            period,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            restaurants: performanceData,
            summary: {
                totalRestaurants: performanceData.length,
                totalRevenue: Number(performanceData.reduce((sum, r) => sum + r.revenue, 0).toFixed(2)),
                totalOrders: performanceData.reduce((sum, r) => sum + r.orders, 0),
                avgRevenuePerRestaurant: performanceData.length > 0 ? Number((performanceData.reduce((sum, r) => sum + r.revenue, 0) / performanceData.length).toFixed(2)) : 0,
            },
        };
    }

    /**
     * RESTAURANT STATUS - Simple status summary (Active, Inactive, Suspended)
     */
    async getRestaurantStatus() {
        // Count all restaurants
        const totalRestaurants = await this.restaurantRepository.count();

        // Count active restaurants
        const activeRestaurants = await this.restaurantRepository.count({
            where: { isActive: true },
        });

        // Count inactive restaurants
        const inactiveRestaurants = await this.restaurantRepository.count({
            where: { isActive: false },
        });

        // For suspended, we'll need to check if there's a suspended status
        // Since the Restaurant entity doesn't have a suspended field, we'll return 0
        // You can modify this if you add a status field to Restaurant entity
        const suspendedRestaurants = 0;

        return {
            total: totalRestaurants,
            active: activeRestaurants,
            inactive: inactiveRestaurants,
            suspended: suspendedRestaurants,
            breakdown: {
                activePercentage: totalRestaurants > 0
                    ? Number(((activeRestaurants / totalRestaurants) * 100).toFixed(2))
                    : 0,
                inactivePercentage: totalRestaurants > 0
                    ? Number(((inactiveRestaurants / totalRestaurants) * 100).toFixed(2))
                    : 0,
                suspendedPercentage: 0,
            }
        };
    }

    /**
     * TOP SELLING ITEMS - Across all restaurants
     */
    async getTopSellingItems(period: 'today' | 'week' | 'month' | 'year' = 'week', limit: number = 10) {
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        const orderItems = await this.orderItemRepository
            .createQueryBuilder('orderItem')
            .leftJoinAndSelect('orderItem.menu', 'menu')
            .leftJoinAndSelect('orderItem.order', 'order')
            .leftJoinAndSelect('order.restaurant', 'restaurant')
            .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('order.status = :status', { status: OrderStatusEnum.COMPLETED })
            .getMany();

        const previousOrderItems = await this.orderItemRepository
            .createQueryBuilder('orderItem')
            .leftJoinAndSelect('orderItem.order', 'order')
            .where('order.createdAt BETWEEN :startDate AND :endDate', {
                startDate: previousPeriod.startDate,
                endDate: previousPeriod.endDate,
            })
            .andWhere('order.status = :status', { status: OrderStatusEnum.COMPLETED })
            .getMany();

        const itemsMap = new Map<string, any>();

        orderItems.forEach((item) => {
            const key = item.menuId;
            if (!itemsMap.has(key)) {
                itemsMap.set(key, {
                    menuId: item.menuId,
                    menuName: item.menu?.name || 'Unknown Item',
                    restaurantName: item.order?.restaurant?.name || 'Unknown Restaurant',
                    quantity: 0,
                    revenue: 0,
                    previousQuantity: 0,
                });
            }
            const existing = itemsMap.get(key);
            existing.quantity += item.quantity;
            existing.revenue += Number(item.totalPrice);
        });

        previousOrderItems.forEach((item) => {
            const key = item.menuId;
            if (itemsMap.has(key)) {
                itemsMap.get(key).previousQuantity += item.quantity;
            }
        });

        const topItems = Array.from(itemsMap.values())
            .map((item) => {
                const growth = item.previousQuantity > 0
                    ? ((item.quantity - item.previousQuantity) / item.previousQuantity) * 100
                    : item.quantity > 0 ? 100 : 0;

                return {
                    ...item,
                    revenue: Number(item.revenue.toFixed(2)),
                    growth: Number(growth.toFixed(2)),
                    trend: growth >= 0 ? 'up' : 'down',
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);

        return {
            period,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            topItems,
            summary: {
                totalItems: itemsMap.size,
                totalRevenue: Number(topItems.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)),
                totalQuantitySold: topItems.reduce((sum, item) => sum + item.quantity, 0),
            },
        };
    }

    /**
     * TOP SELLING ITEMS BY RESTAURANT - Top items for each restaurant
     */
    async getTopItemsByRestaurant(period: 'today' | 'week' | 'month' | 'year' = 'week', itemsPerRestaurant: number = 5) {
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        // Get all active restaurants
        const restaurants = await this.restaurantRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });

        const restaurantData = await Promise.all(
            restaurants.map(async (restaurant) => {
                // Get order items for this restaurant
                const orderItems = await this.orderItemRepository
                    .createQueryBuilder('orderItem')
                    .leftJoinAndSelect('orderItem.menu', 'menu')
                    .leftJoinAndSelect('orderItem.order', 'order')
                    .where('order.restaurantId = :restaurantId', { restaurantId: restaurant.id })
                    .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
                    .andWhere('order.status = :status', { status: OrderStatusEnum.COMPLETED })
                    .getMany();

                // Get previous period data for growth calculation
                const previousOrderItems = await this.orderItemRepository
                    .createQueryBuilder('orderItem')
                    .leftJoinAndSelect('orderItem.order', 'order')
                    .where('order.restaurantId = :restaurantId', { restaurantId: restaurant.id })
                    .andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
                        startDate: previousPeriod.startDate,
                        endDate: previousPeriod.endDate,
                    })
                    .andWhere('order.status = :status', { status: OrderStatusEnum.COMPLETED })
                    .getMany();

                // Group items by menuId
                const itemsMap = new Map<string, any>();

                orderItems.forEach((item) => {
                    const key = item.menuId;
                    if (!itemsMap.has(key)) {
                        itemsMap.set(key, {
                            menuId: item.menuId,
                            menuName: item.menu?.name || 'Unknown Item',
                            quantity: 0,
                            revenue: 0,
                            previousQuantity: 0,
                        });
                    }
                    const existing = itemsMap.get(key);
                    existing.quantity += item.quantity;
                    existing.revenue += Number(item.totalPrice);
                });

                // Add previous period data
                previousOrderItems.forEach((item) => {
                    const key = item.menuId;
                    if (itemsMap.has(key)) {
                        itemsMap.get(key).previousQuantity += item.quantity;
                    }
                });

                // Get top items for this restaurant
                const topItems = Array.from(itemsMap.values())
                    .map((item) => {
                        const growth = item.previousQuantity > 0
                            ? ((item.quantity - item.previousQuantity) / item.previousQuantity) * 100
                            : item.quantity > 0 ? 100 : 0;

                        return {
                            ...item,
                            revenue: Number(item.revenue.toFixed(2)),
                            growth: Number(growth.toFixed(2)),
                            trend: growth >= 0 ? 'up' : 'down',
                            averagePrice: item.quantity > 0 ? Number((item.revenue / item.quantity).toFixed(2)) : 0,
                        };
                    })
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, itemsPerRestaurant);

                const totalRevenue = topItems.reduce((sum, item) => sum + item.revenue, 0);
                const totalQuantity = topItems.reduce((sum, item) => sum + item.quantity, 0);

                return {
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    topItems,
                    summary: {
                        totalItems: itemsMap.size,
                        topItemsRevenue: Number(totalRevenue.toFixed(2)),
                        topItemsQuantity: totalQuantity,
                        revenuePercentage: 0, // Will calculate after we have total restaurant revenue
                    },
                };
            })
        );

        // Filter out restaurants with no items
        const restaurantsWithItems = restaurantData.filter(r => r.topItems.length > 0);

        // Sort by total revenue of top items
        restaurantsWithItems.sort((a, b) => b.summary.topItemsRevenue - a.summary.topItemsRevenue);

        return {
            period,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            itemsPerRestaurant,
            restaurants: restaurantsWithItems,
            summary: {
                totalRestaurants: restaurantsWithItems.length,
                totalRevenue: Number(restaurantsWithItems.reduce((sum, r) => sum + r.summary.topItemsRevenue, 0).toFixed(2)),
                totalQuantity: restaurantsWithItems.reduce((sum, r) => sum + r.summary.topItemsQuantity, 0),
            },
        };
    }

    /**
     * ORDER SOURCES - Distribution by order type
     */
    async getOrderSources(period: 'today' | 'week' | 'month' | 'year' = 'today') {
        const { startDate, endDate } = this.getDateRange(period);

        const orders = await this.orderRepository.find({
            where: {
                createdAt: Between(startDate, endDate),
                status: OrderStatusEnum.COMPLETED,
            },
        });

        const sourceMap = new Map<string, { count: number; revenue: number }>();

        orders.forEach((order) => {
            const source = order.orderType || 'dine_in';
            if (!sourceMap.has(source)) {
                sourceMap.set(source, { count: 0, revenue: 0 });
            }
            const existing = sourceMap.get(source);
            existing.count++;
            existing.revenue += Number(order.totalAmount);
        });

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

        const sources = Array.from(sourceMap.entries()).map(([source, data]) => ({
            source,
            orders: data.count,
            revenue: Number(data.revenue.toFixed(2)),
            percentage: totalOrders > 0 ? Number(((data.count / totalOrders) * 100).toFixed(2)) : 0,
            revenuePercentage: totalRevenue > 0 ? Number(((data.revenue / totalRevenue) * 100).toFixed(2)) : 0,
        }));

        sources.sort((a, b) => b.orders - a.orders);

        return {
            period,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            sources,
            summary: {
                totalOrders,
                totalRevenue: Number(totalRevenue.toFixed(2)),
            },
        };
    }

    /**
     * SUBSCRIPTION REVENUE - Platform revenue from subscriptions
     */
    async getSubscriptionRevenue(period: 'today' | 'week' | 'month' | 'year' = 'month') {
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        // Get all active subscriptions in the period
        const currentSubscriptions = await this.restaurantSubscriptionRepository
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.plan', 'plan')
            .leftJoinAndSelect('subscription.restaurant', 'restaurant')
            .where('subscription.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('subscription.status = :status', { status: RestaurantSubscriptionStatus.ACTIVE })
            .getMany();

        const previousSubscriptions = await this.restaurantSubscriptionRepository
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.plan', 'plan')
            .where('subscription.createdAt BETWEEN :startDate AND :endDate', {
                startDate: previousPeriod.startDate,
                endDate: previousPeriod.endDate,
            })
            .andWhere('subscription.status = :status', { status: RestaurantSubscriptionStatus.ACTIVE })
            .getMany();

        // Calculate revenue by plan
        const planRevenueMap = new Map<string, any>();
        let totalRevenue = 0;

        currentSubscriptions.forEach((sub) => {
            const planName = sub.plan?.name || 'Unknown Plan';
            const price = sub.billingCycle === 'monthly'
                ? Number(sub.plan?.priceMonthly || 0)
                : Number(sub.plan?.priceYearly || 0);

            totalRevenue += price;

            if (!planRevenueMap.has(planName)) {
                planRevenueMap.set(planName, {
                    planName,
                    subscriptions: 0,
                    revenue: 0,
                    monthly: 0,
                    yearly: 0,
                });
            }

            const planData = planRevenueMap.get(planName);
            planData.subscriptions++;
            planData.revenue += price;

            if (sub.billingCycle === 'monthly') {
                planData.monthly++;
            } else {
                planData.yearly++;
            }
        });

        // Calculate previous period revenue
        let previousRevenue = 0;
        previousSubscriptions.forEach((sub) => {
            const price = sub.billingCycle === 'monthly'
                ? Number(sub.plan?.priceMonthly || 0)
                : Number(sub.plan?.priceYearly || 0);
            previousRevenue += price;
        });

        const revenueGrowth = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
            : totalRevenue > 0 ? 100 : 0;

        const subscriptionGrowth = previousSubscriptions.length > 0
            ? ((currentSubscriptions.length - previousSubscriptions.length) / previousSubscriptions.length) * 100
            : currentSubscriptions.length > 0 ? 100 : 0;

        // Format plan breakdown
        const planBreakdown = Array.from(planRevenueMap.values())
            .map((plan) => ({
                ...plan,
                revenue: Number(plan.revenue.toFixed(2)),
                percentage: totalRevenue > 0 ? Number(((plan.revenue / totalRevenue) * 100).toFixed(2)) : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue);

        // Billing cycle breakdown
        const monthlyCount = currentSubscriptions.filter(s => s.billingCycle === 'monthly').length;
        const yearlyCount = currentSubscriptions.filter(s => s.billingCycle === 'yearly').length;

        const monthlyRevenue = currentSubscriptions
            .filter(s => s.billingCycle === 'monthly')
            .reduce((sum, s) => sum + Number(s.plan?.priceMonthly || 0), 0);

        const yearlyRevenue = currentSubscriptions
            .filter(s => s.billingCycle === 'yearly')
            .reduce((sum, s) => sum + Number(s.plan?.priceYearly || 0), 0);

        // Get all plans for overview
        const allPlans = await this.subscriptionPlanRepository.find({
            where: { status: SubscriptionPlanStatus.ACTIVE },
            order: { order: 'ASC' },
        });

        return {
            period,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            summary: {
                totalRevenue: Number(totalRevenue.toFixed(2)),
                previousRevenue: Number(previousRevenue.toFixed(2)),
                revenueGrowth: Number(revenueGrowth.toFixed(2)),
                totalSubscriptions: currentSubscriptions.length,
                previousSubscriptions: previousSubscriptions.length,
                subscriptionGrowth: Number(subscriptionGrowth.toFixed(2)),
                avgRevenuePerSubscription: currentSubscriptions.length > 0
                    ? Number((totalRevenue / currentSubscriptions.length).toFixed(2))
                    : 0,
            },
            planBreakdown,
            billingCycleBreakdown: [
                {
                    cycle: 'monthly',
                    subscriptions: monthlyCount,
                    revenue: Number(monthlyRevenue.toFixed(2)),
                    percentage: totalRevenue > 0 ? Number(((monthlyRevenue / totalRevenue) * 100).toFixed(2)) : 0,
                },
                {
                    cycle: 'yearly',
                    subscriptions: yearlyCount,
                    revenue: Number(yearlyRevenue.toFixed(2)),
                    percentage: totalRevenue > 0 ? Number(((yearlyRevenue / totalRevenue) * 100).toFixed(2)) : 0,
                },
            ],
            availablePlans: allPlans.map(plan => ({
                id: plan.id,
                name: plan.name,
                code: plan.code,
                priceMonthly: plan.priceMonthly,
                priceYearly: plan.priceYearly,
                activeSubscriptions: currentSubscriptions.filter(s => s.planId === plan.id).length,
            })),
        };
    }

    /**
     * SUBSCRIPTION REVENUE TRENDS - Track subscription revenue over time
     */
    async getSubscriptionRevenueTrends(
        period: 'week' | 'month' | 'quarter' | 'year' = 'month',
        granularity: 'daily' | 'weekly' | 'monthly' = 'daily',
    ) {
        const { startDate, endDate } = this.getDateRange(period);

        // Get all subscriptions created in the period
        const subscriptions = await this.restaurantSubscriptionRepository
            .createQueryBuilder('subscription')
            .leftJoinAndSelect('subscription.plan', 'plan')
            .where('subscription.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('subscription.status = :status', { status: RestaurantSubscriptionStatus.ACTIVE })
            .orderBy('subscription.createdAt', 'ASC')
            .getMany();

        // Group subscriptions by period
        const grouped = new Map<string, any>();

        subscriptions.forEach(sub => {
            const date = new Date(sub.createdAt);
            let key: string;

            switch (granularity) {
                case 'daily':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }

            if (!grouped.has(key)) {
                grouped.set(key, {
                    period: key,
                    revenue: 0,
                    subscriptions: 0,
                    monthly: 0,
                    yearly: 0,
                    byPlan: new Map<string, { count: number; revenue: number }>(),
                });
            }

            const periodData = grouped.get(key);
            const price = sub.billingCycle === 'monthly'
                ? Number(sub.plan?.priceMonthly || 0)
                : Number(sub.plan?.priceYearly || 0);

            periodData.revenue += price;
            periodData.subscriptions++;

            if (sub.billingCycle === 'monthly') {
                periodData.monthly++;
            } else {
                periodData.yearly++;
            }

            // Track by plan
            const planName = sub.plan?.name || 'Unknown';
            if (!periodData.byPlan.has(planName)) {
                periodData.byPlan.set(planName, { count: 0, revenue: 0 });
            }
            const planData = periodData.byPlan.get(planName);
            planData.count++;
            planData.revenue += price;
        });

        // Format the trends data
        const trends = Array.from(grouped.values())
            .map(data => ({
                period: data.period,
                revenue: Number(data.revenue.toFixed(2)),
                subscriptions: data.subscriptions,
                monthly: data.monthly,
                yearly: data.yearly,
                planBreakdown: Array.from(data.byPlan.entries()).map(([planName, planData]) => ({
                    planName,
                    subscriptions: planData.count,
                    revenue: Number(planData.revenue.toFixed(2)),
                })),
            }))
            .sort((a, b) => a.period.localeCompare(b.period));

        const totalRevenue = trends.reduce((sum, t) => sum + t.revenue, 0);
        const totalSubscriptions = trends.reduce((sum, t) => sum + t.subscriptions, 0);

        return {
            period,
            granularity,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            trends,
            summary: {
                totalRevenue: Number(totalRevenue.toFixed(2)),
                totalSubscriptions,
                avgRevenuePerPeriod: trends.length > 0 ? Number((totalRevenue / trends.length).toFixed(2)) : 0,
                avgSubscriptionsPerPeriod: trends.length > 0 ? Number((totalSubscriptions / trends.length).toFixed(2)) : 0,
            },
        };
    }

    /**
     * USER GROWTH - Track user growth over time
     */
    async getUserGrowth(
        period: 'week' | 'month' | 'quarter' | 'year' = 'month',
        granularity: 'daily' | 'weekly' | 'monthly' = 'daily',
    ) {
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        // Get users in current period
        const users = await this.userRepository.find({
            where: { createdAt: Between(startDate, endDate) },
            order: { createdAt: 'ASC' },
        });

        // Get users in previous period for comparison
        const previousUsers = await this.userRepository.find({
            where: { createdAt: Between(previousPeriod.startDate, previousPeriod.endDate) },
        });

        // Group users by period
        const grouped = new Map<string, any>();

        users.forEach(user => {
            const date = new Date(user.createdAt);
            let key: string;

            switch (granularity) {
                case 'daily':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }

            if (!grouped.has(key)) {
                grouped.set(key, {
                    period: key,
                    newUsers: 0,
                    byRole: new Map<string, number>(),
                });
            }

            const periodData = grouped.get(key);
            periodData.newUsers++;

            // Track by role
            const role = user.role || 'UNKNOWN';
            periodData.byRole.set(role, (periodData.byRole.get(role) || 0) + 1);
        });

        // Format the trends data
        const trends = Array.from(grouped.values())
            .map(data => ({
                period: data.period,
                newUsers: data.newUsers,
                roleBreakdown: Array.from(data.byRole.entries()).map(([role, count]) => ({
                    role,
                    count,
                })),
            }))
            .sort((a, b) => a.period.localeCompare(b.period));

        const totalNewUsers = users.length;
        const growth = previousUsers.length > 0
            ? ((totalNewUsers - previousUsers.length) / previousUsers.length) * 100
            : totalNewUsers > 0 ? 100 : 0;

        // Get total users count
        const totalUsers = await this.userRepository.count();

        return {
            period,
            granularity,
            dateRange: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            trends,
            summary: {
                totalUsers,
                newUsers: totalNewUsers,
                previousNewUsers: previousUsers.length,
                growth: Number(growth.toFixed(2)),
                avgNewUsersPerPeriod: trends.length > 0 ? Number((totalNewUsers / trends.length).toFixed(2)) : 0,
            },
        };
    }

    /**
     * RESTAURANT SUMMARY CARDS - Comprehensive list view data
     */
    async getRestaurantSummaryCards(filters: {
        period: 'today' | 'week' | 'month' | 'year';
        status?: 'active' | 'inactive' | 'all';
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        search?: string;
        tenantId?: string;
    }) {
        const { period, status, sortBy, sortOrder, search, tenantId } = filters;
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        // Build query for restaurants
        let query = this.restaurantRepository.createQueryBuilder('restaurant')
            .leftJoinAndSelect('restaurant.tenant', 'tenant');

        // Apply status filter
        if (status && status !== 'all') {
            query = query.where('restaurant.isActive = :isActive', { isActive: status === 'active' });
        }

        // Apply tenant filter
        if (tenantId) {
            query = query.andWhere('restaurant.tenantId = :tenantId', { tenantId });
        }

        // Apply search
        if (search) {
            query = query.andWhere(
                '(restaurant.name LIKE :search OR restaurant.city LIKE :search OR restaurant.district LIKE :search)',
                { search: `%${search}%` }
            );
        }

        const restaurants = await query.getMany();

        // Calculate metrics for each restaurant
        const restaurantCards = await Promise.all(
            restaurants.map(async (restaurant) => {
                // Current period orders
                const currentOrders = await this.orderRepository.find({
                    where: {
                        restaurantId: restaurant.id,
                        createdAt: Between(startDate, endDate),
                        status: OrderStatusEnum.COMPLETED,
                    },
                });

                // Previous period orders
                const previousOrders = await this.orderRepository.find({
                    where: {
                        restaurantId: restaurant.id,
                        createdAt: Between(previousPeriod.startDate, previousPeriod.endDate),
                        status: OrderStatusEnum.COMPLETED,
                    },
                });

                // Calculate revenue
                const totalRevenue = currentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
                const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
                const revenueGrowth = previousRevenue > 0
                    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
                    : totalRevenue > 0 ? 100 : 0;

                // Calculate orders growth
                const ordersGrowth = previousOrders.length > 0
                    ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
                    : currentOrders.length > 0 ? 100 : 0;

                // Calculate customers
                const activeCustomers = new Set(currentOrders.map(o => o.customerId)).size;
                const previousCustomers = new Set(previousOrders.map(o => o.customerId)).size;
                const customerGrowth = previousCustomers > 0
                    ? ((activeCustomers - previousCustomers) / previousCustomers) * 100
                    : activeCustomers > 0 ? 100 : 0;

                // Get menu items count
                const totalMenuItems = await this.menuRepository.count({
                    where: { restaurantId: restaurant.id, isAvailable: true },
                });

                // Get top selling item
                const orderItems = await this.orderItemRepository
                    .createQueryBuilder('orderItem')
                    .leftJoinAndSelect('orderItem.menu', 'menu')
                    .leftJoinAndSelect('orderItem.order', 'order')
                    .where('order.restaurantId = :restaurantId', { restaurantId: restaurant.id })
                    .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
                    .andWhere('order.status = :status', { status: OrderStatusEnum.COMPLETED })
                    .getMany();

                const itemsMap = new Map<string, any>();
                orderItems.forEach((item) => {
                    const key = item.menuId;
                    if (!itemsMap.has(key)) {
                        itemsMap.set(key, {
                            name: item.menu?.name || 'Unknown',
                            revenue: 0,
                        });
                    }
                    itemsMap.get(key).revenue += Number(item.totalPrice);
                });

                const topItem = Array.from(itemsMap.values())
                    .sort((a, b) => b.revenue - a.revenue)[0];

                // Calculate payment methods breakdown
                const payments = await this.paymentRepository.find({
                    where: {
                        orderId: In(currentOrders.map(o => o.id)),
                    },
                });

                const paymentMethodsBreakdown: Record<string, number> = {};
                payments.forEach(p => {
                    const method = p.method || 'cash';
                    paymentMethodsBreakdown[method] = (paymentMethodsBreakdown[method] || 0) + 1;
                });

                // Order types breakdown
                const orderTypesBreakdown: Record<string, number> = {};
                currentOrders.forEach(o => {
                    const type = o.orderType || 'dine_in';
                    orderTypesBreakdown[type] = (orderTypesBreakdown[type] || 0) + 1;
                });

                // Calculate health score (0-100)
                let healthScore = 0;
                if (currentOrders.length > 0) healthScore += 30; // Has orders
                if (revenueGrowth > 0) healthScore += 20; // Revenue growing
                if (ordersGrowth > 0) healthScore += 20; // Orders growing
                if (customerGrowth > 0) healthScore += 15; // Customers growing
                if (totalMenuItems > 10) healthScore += 15; // Good menu variety

                // Get last order date
                const lastOrder = currentOrders.length > 0
                    ? currentOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
                    : null;

                return {
                    id: restaurant.id,
                    name: restaurant.name,
                    logo: restaurant.logo || null,
                    status: restaurant.isActive ? 'active' : 'inactive',
                    totalRevenue: Number(totalRevenue.toFixed(2)),
                    revenueGrowth: Number(revenueGrowth.toFixed(2)),
                    totalOrders: currentOrders.length,
                    ordersGrowth: Number(ordersGrowth.toFixed(2)),
                    averageOrderValue: currentOrders.length > 0 ? Number((totalRevenue / currentOrders.length).toFixed(2)) : 0,
                    activeCustomers,
                    customerGrowth: Number(customerGrowth.toFixed(2)),
                    totalMenuItems,
                    totalTables: 0, // Will need to add table count if available
                    tableOccupancyRate: 0, // Will need to calculate if table data available
                    topSellingItem: topItem?.name || 'N/A',
                    topSellingItemRevenue: topItem?.revenue || 0,
                    orderCompletionRate: 100, // Assuming all fetched orders are completed
                    avgPreparationTime: 18, // Default value
                    totalStaff: 0, // Will need to add staff count if available
                    subscriptionPlan: 'premium', // Will need to get from subscription
                    subscriptionStatus: 'active', // Will need to get from subscription
                    daysUntilExpiry: null,
                    lastOrderDate: lastOrder?.createdAt || restaurant.createdAt,
                    createdAt: restaurant.createdAt,
                    tenantId: restaurant.tenantId,
                    tenantName: restaurant.tenant?.name || 'N/A',
                    rating: null,
                    totalReviews: null,
                    paymentMethodsBreakdown,
                    orderTypesBreakdown,
                    peakHours: ['12:00-13:00', '19:00-20:00'], // Default peak hours
                    healthScore,
                };
            })
        );

        // Apply sorting
        const sortField = sortBy || 'totalRevenue';
        const sortDirection = sortOrder || 'DESC';
        restaurantCards.sort((a, b) => {
            const aValue = a[sortField] || 0;
            const bValue = b[sortField] || 0;
            return sortDirection === 'ASC' ? aValue - bValue : bValue - aValue;
        });

        // Calculate overall metrics
        const totalRevenue = restaurantCards.reduce((sum, r) => sum + r.totalRevenue, 0);
        const totalOrders = restaurantCards.reduce((sum, r) => sum + r.totalOrders, 0);

        // Calculate overall growth
        const overallRevenueGrowth = restaurantCards.length > 0
            ? restaurantCards.reduce((sum, r) => sum + r.revenueGrowth, 0) / restaurantCards.length
            : 0;
        const overallOrdersGrowth = restaurantCards.length > 0
            ? restaurantCards.reduce((sum, r) => sum + r.ordersGrowth, 0) / restaurantCards.length
            : 0;

        return {
            restaurants: restaurantCards,
            total: restaurantCards.length,
            active: restaurantCards.filter(r => r.status === 'active').length,
            inactive: restaurantCards.filter(r => r.status === 'inactive').length,
            totalRevenue: Number(totalRevenue.toFixed(2)),
            overallRevenueGrowth: Number(overallRevenueGrowth.toFixed(2)),
            totalOrders,
            overallOrdersGrowth: Number(overallOrdersGrowth.toFixed(2)),
            period,
        };
    }

    /**
     * TENANT SUMMARY CARDS - Comprehensive list view data
     */
    async getTenantSummaryCards(filters: {
        period: 'today' | 'week' | 'month' | 'year';
        status?: 'active' | 'inactive' | 'suspended' | 'all';
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        search?: string;
        subscriptionPlan?: string;
    }) {
        const { period, status, sortBy, sortOrder, search, subscriptionPlan } = filters;
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        // Get all tenants directly from tenantRepository
        let tenantQuery = this.tenantRepository.createQueryBuilder('tenant');

        if (search) {
            tenantQuery.andWhere(
                '(tenant.name LIKE :search OR tenant.contactEmail LIKE :search)',
                { search: `%${search}%` }
            );
        }

        if (status && status !== 'all') {
            tenantQuery.andWhere('tenant.status = :status', { status });
        }

        if (subscriptionPlan && subscriptionPlan !== 'all') {
            tenantQuery.andWhere('tenant.subscriptionPlan = :subscriptionPlan', { subscriptionPlan });
        }

        const allTenants = await tenantQuery.getMany();
        const uniqueTenants = new Map();
        allTenants.forEach(t => uniqueTenants.set(t.id, t));

        // Calculate metrics for each tenant
        const tenantCards = await Promise.all(
            Array.from(uniqueTenants.values()).map(async (tenant: any) => {
                // Get all restaurants for this tenant
                const tenantRestaurants = await this.restaurantRepository.find({
                    where: { tenantId: tenant.id },
                });

                const activeRestaurants = tenantRestaurants.filter(r => r.isActive).length;
                const inactiveRestaurants = tenantRestaurants.length - activeRestaurants;

                // Get all orders for tenant's restaurants
                const restaurantIds = tenantRestaurants.map(r => r.id);

                const currentOrders = await this.orderRepository.find({
                    where: {
                        restaurantId: In(restaurantIds),
                        createdAt: Between(startDate, endDate),
                        status: OrderStatusEnum.COMPLETED,
                    },
                });

                const previousOrders = await this.orderRepository.find({
                    where: {
                        restaurantId: In(restaurantIds),
                        createdAt: Between(previousPeriod.startDate, previousPeriod.endDate),
                        status: OrderStatusEnum.COMPLETED,
                    },
                });

                // Calculate revenue
                const totalRevenue = currentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
                const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
                const revenueGrowth = previousRevenue > 0
                    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
                    : totalRevenue > 0 ? 100 : 0;

                // Calculate orders growth
                const ordersGrowth = previousOrders.length > 0
                    ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100
                    : currentOrders.length > 0 ? 100 : 0;

                // Calculate customers
                const totalCustomers = new Set(currentOrders.map(o => o.customerId)).size;
                const previousCustomers = new Set(previousOrders.map(o => o.customerId)).size;
                const customerGrowth = previousCustomers > 0
                    ? ((totalCustomers - previousCustomers) / previousCustomers) * 100
                    : totalCustomers > 0 ? 100 : 0;

                // Get total menu items
                const totalMenuItems = await this.menuRepository.count({
                    where: { restaurantId: In(restaurantIds), isAvailable: true },
                });

                // Calculate payment methods breakdown
                const payments = await this.paymentRepository.find({
                    where: {
                        orderId: In(currentOrders.map(o => o.id)),
                    },
                });

                const paymentMethodsBreakdown: Record<string, number> = {};
                payments.forEach(p => {
                    const method = p.method || 'cash';
                    paymentMethodsBreakdown[method] = (paymentMethodsBreakdown[method] || 0) + 1;
                });

                // Order types breakdown
                const orderTypesBreakdown: Record<string, number> = {};
                currentOrders.forEach(o => {
                    const type = o.orderType || 'dine_in';
                    orderTypesBreakdown[type] = (orderTypesBreakdown[type] || 0) + 1;
                });

                // Find top performing restaurant
                const restaurantRevenues = await Promise.all(
                    tenantRestaurants.map(async (r) => {
                        const orders = currentOrders.filter(o => o.restaurantId === r.id);
                        const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
                        return { name: r.name, revenue };
                    })
                );
                const topRestaurant = restaurantRevenues.sort((a, b) => b.revenue - a.revenue)[0];

                // Calculate health score
                let healthScore = 0;
                if (activeRestaurants > 0) healthScore += 25;
                if (currentOrders.length > 0) healthScore += 25;
                if (revenueGrowth > 0) healthScore += 20;
                if (ordersGrowth > 0) healthScore += 15;
                if (customerGrowth > 0) healthScore += 15;

                // Get last order
                const lastOrder = currentOrders.length > 0
                    ? currentOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
                    : null;

                // Platform revenue (subscription fees) - default values
                const platformRevenue = 299.99; // Monthly subscription fee
                const subscriptionPlanValue = 'premium';
                const subscriptionStatusValue = 'active';

                return {
                    id: tenant.id,
                    name: tenant.name || 'Unknown Tenant',
                    logo: tenant.logo || null,
                    status: tenant.status || 'active',
                    type: tenant.type || 'restaurant',
                    contactEmail: tenant.contactEmail || '',
                    contactPhone: tenant.contactPhone || '',
                    city: tenant.city || '',
                    district: tenant.district || '',
                    totalRestaurants: tenantRestaurants.length,
                    activeRestaurants,
                    inactiveRestaurants,
                    restaurantGrowth: 0, // Will need historical data
                    totalRevenue: Number(totalRevenue.toFixed(2)),
                    revenueGrowth: Number(revenueGrowth.toFixed(2)),
                    totalOrders: currentOrders.length,
                    ordersGrowth: Number(ordersGrowth.toFixed(2)),
                    averageOrderValue: currentOrders.length > 0 ? Number((totalRevenue / currentOrders.length).toFixed(2)) : 0,
                    totalCustomers,
                    customerGrowth: Number(customerGrowth.toFixed(2)),
                    totalStaff: 0, // Will need to add if available
                    totalMenuItems,
                    totalTables: 0, // Will need to add if available
                    avgTableOccupancyRate: 0,
                    subscriptionPlan: subscriptionPlanValue,
                    subscriptionStatus: subscriptionStatusValue,
                    monthlySubscriptionFee: platformRevenue,
                    daysUntilExpiry: null,
                    subscriptionStartDate: tenant.createdAt || new Date(),
                    subscriptionEndDate: null,
                    platformRevenue: Number(platformRevenue.toFixed(2)),
                    lastLoginDate: null,
                    createdAt: tenant.createdAt || new Date(),
                    topPerformingRestaurant: topRestaurant?.name || 'N/A',
                    topPerformingRestaurantRevenue: topRestaurant?.revenue || 0,
                    avgRating: null,
                    totalReviews: null,
                    orderCompletionRate: 100,
                    avgPreparationTime: 20,
                    paymentMethodsBreakdown,
                    orderTypesBreakdown,
                    healthScore,
                    activeUsers: 0,
                    lastOrderDate: lastOrder?.createdAt || tenant.createdAt,
                };
            })
        );

        // Apply sorting
        const sortField = sortBy || 'platformRevenue';
        const sortDirection = sortOrder || 'DESC';
        tenantCards.sort((a, b) => {
            const aValue = a[sortField] || 0;
            const bValue = b[sortField] || 0;
            return sortDirection === 'ASC' ? aValue - bValue : bValue - aValue;
        });

        // Calculate overall metrics
        const totalPlatformRevenue = tenantCards.reduce((sum, t) => sum + t.platformRevenue, 0);
        const totalRestaurants = tenantCards.reduce((sum, t) => sum + t.totalRestaurants, 0);
        const totalOrders = tenantCards.reduce((sum, t) => sum + t.totalOrders, 0);

        return {
            tenants: tenantCards,
            total: tenantCards.length,
            active: tenantCards.filter(t => t.status === 'active').length,
            inactive: tenantCards.filter(t => t.status === 'inactive').length,
            suspended: tenantCards.filter(t => t.status === 'suspended').length,
            totalPlatformRevenue: Number(totalPlatformRevenue.toFixed(2)),
            platformRevenueGrowth: 0, // Will need historical data
            totalRestaurants,
            totalOrders,
            period,
        };
    }

    /**
     * SIMPLIFIED RESTAURANT SUMMARY CARDS - Only 4 essential fields
     */
    async getSimpleRestaurantSummaryCards(filters: {
        period: 'today' | 'week' | 'month' | 'year';
        status?: 'active' | 'inactive' | 'all';
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    }) {
        const { period, status, sortBy, sortOrder } = filters;
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        // Build query for restaurants
        let query = this.restaurantRepository.createQueryBuilder('restaurant');

        // Apply status filter
        if (status && status !== 'all') {
            query = query.where('restaurant.isActive = :isActive', { isActive: status === 'active' });
        }

        const restaurants = await query.getMany();

        // Calculate only essential metrics
        const restaurantCards = await Promise.all(
            restaurants.map(async (restaurant) => {
                // Current period orders
                const currentOrders = await this.orderRepository.find({
                    where: {
                        restaurantId: restaurant.id,
                        createdAt: Between(startDate, endDate),
                        status: OrderStatusEnum.COMPLETED,
                    },
                });

                // Previous period orders
                const previousOrders = await this.orderRepository.find({
                    where: {
                        restaurantId: restaurant.id,
                        createdAt: Between(previousPeriod.startDate, previousPeriod.endDate),
                        status: OrderStatusEnum.COMPLETED,
                    },
                });

                // Calculate revenue
                const totalRevenue = currentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
                const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
                const revenueGrowth = previousRevenue > 0
                    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
                    : totalRevenue > 0 ? 100 : 0;

                return {
                    id: restaurant.id,
                    name: restaurant.name,
                    status: restaurant.isActive ? 'active' : 'inactive',
                    totalRevenue: Number(totalRevenue.toFixed(2)),
                    revenueGrowth: Number(revenueGrowth.toFixed(2)),
                };
            })
        );

        // Apply sorting
        const sortField = sortBy || 'totalRevenue';
        const sortDirection = sortOrder || 'DESC';
        restaurantCards.sort((a, b) => {
            if (sortField === 'name') {
                return sortDirection === 'ASC'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            const aValue = a[sortField] || 0;
            const bValue = b[sortField] || 0;
            return sortDirection === 'ASC' ? aValue - bValue : bValue - aValue;
        });

        // Calculate overall metrics
        const totalRevenue = restaurantCards.reduce((sum, r) => sum + r.totalRevenue, 0);
        const overallRevenueGrowth = restaurantCards.length > 0
            ? restaurantCards.reduce((sum, r) => sum + r.revenueGrowth, 0) / restaurantCards.length
            : 0;

        return {
            restaurants: restaurantCards,
            total: restaurantCards.length,
            active: restaurantCards.filter(r => r.status === 'active').length,
            inactive: restaurantCards.filter(r => r.status === 'inactive').length,
            totalRevenue: Number(totalRevenue.toFixed(2)),
            overallRevenueGrowth: Number(overallRevenueGrowth.toFixed(2)),
            period,
        };
    }

    /**
     * SIMPLIFIED TENANT SUMMARY CARDS - Only 4 essential fields
     */
    async getSimpleTenantSummaryCards(filters: {
        period: 'today' | 'week' | 'month' | 'year';
        status?: 'active' | 'inactive' | 'suspended' | 'all';
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    }) {
        const { period, status, sortBy, sortOrder } = filters;

        // Get all tenants directly from tenantRepository
        let tenantQuery = this.tenantRepository.createQueryBuilder('tenant');

        if (status && status !== 'all') {
            tenantQuery.andWhere('tenant.status = :status', { status });
        }

        const allTenants = await tenantQuery.getMany();
        const uniqueTenants = new Map();
        allTenants.forEach(t => uniqueTenants.set(t.id, t));

        // Calculate only essential metrics
        const tenantCards = await Promise.all(
            Array.from(uniqueTenants.values()).map(async (tenant: any) => {
                // Get all restaurants for this tenant
                const tenantRestaurants = await this.restaurantRepository.find({
                    where: { tenantId: tenant.id },
                });

                const activeRestaurants = tenantRestaurants.filter(r => r.isActive).length;

                return {
                    id: tenant.id,
                    name: tenant.name || 'Unknown Tenant',
                    status: tenant.status || 'active',
                    totalRestaurants: tenantRestaurants.length,
                    activeRestaurants,
                };
            })
        );

        // Apply status filter
        let filteredCards = tenantCards;
        if (status && status !== 'all') {
            filteredCards = tenantCards.filter(t => t.status === status);
        }

        // Apply sorting
        const sortField = sortBy || 'totalRestaurants';
        const sortDirection = sortOrder || 'DESC';
        filteredCards.sort((a, b) => {
            if (sortField === 'name') {
                return sortDirection === 'ASC'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            const aValue = a[sortField] || 0;
            const bValue = b[sortField] || 0;
            return sortDirection === 'ASC' ? aValue - bValue : bValue - aValue;
        });

        // Calculate platform revenue (simplified - using default subscription fee)
        const totalPlatformRevenue = filteredCards.filter(t => t.status === 'active').length * 299.99;

        return {
            tenants: filteredCards,
            total: filteredCards.length,
            active: filteredCards.filter(t => t.status === 'active').length,
            inactive: filteredCards.filter(t => t.status === 'inactive').length,
            suspended: filteredCards.filter(t => t.status === 'suspended').length,
            totalPlatformRevenue: Number(totalPlatformRevenue.toFixed(2)),
            period,
        };
    }

    /**
     * RESTAURANT SUMMARY - Only 4 summary cards
     */
    async getRestaurantSummary(period: 'today' | 'week' | 'month' | 'year' = 'month') {
        const { startDate, endDate } = this.getDateRange(period);
        const previousPeriod = this.getPreviousPeriod(startDate, endDate);

        // Get all restaurants
        const allRestaurants = await this.restaurantRepository.find();
        const activeRestaurants = allRestaurants.filter(r => r.isActive);

        // Get previous period active count
        const previousActiveRestaurants = await this.restaurantRepository.count({
            where: {
                isActive: true,
                createdAt: Between(previousPeriod.startDate, previousPeriod.endDate),
            },
        });

        // Calculate active growth
        const activeGrowth = previousActiveRestaurants > 0
            ? ((activeRestaurants.length - previousActiveRestaurants) / previousActiveRestaurants) * 100
            : activeRestaurants.length > 0 ? 100 : 0;

        // Get all orders for revenue calculation
        const currentOrders = await this.orderRepository.find({
            where: {
                createdAt: Between(startDate, endDate),
                status: OrderStatusEnum.COMPLETED,
            },
        });

        const previousOrders = await this.orderRepository.find({
            where: {
                createdAt: Between(previousPeriod.startDate, previousPeriod.endDate),
                status: OrderStatusEnum.COMPLETED,
            },
        });

        const totalRevenue = currentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const revenueGrowth = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
            : totalRevenue > 0 ? 100 : 0;

        // Calculate overall growth (average of active and revenue growth)
        const overallGrowth = (activeGrowth + revenueGrowth) / 2;

        return {
            totalRestaurants: {
                value: allRestaurants.length,
                label: 'Total Restaurants',
            },
            activeRestaurants: {
                value: activeRestaurants.length,
                growth: Number(activeGrowth.toFixed(2)),
                label: 'Active',
            },
            totalRevenue: {
                value: Number(totalRevenue.toFixed(2)),
                growth: Number(revenueGrowth.toFixed(2)),
                label: 'Total Revenue',
            },
            overallGrowth: {
                value: Number(overallGrowth.toFixed(2)),
                trend: overallGrowth >= 0 ? 'up' : 'down',
                label: 'Growth',
            },
        };
    }

    /**
     * TENANT SUMMARY - Only 4 summary cards
     */
    async getTenantSummary(period: 'today' | 'week' | 'month' | 'year' = 'month') {
        try {
            this.logger.log(`getTenantSummary called with period: ${period}`);

            const { startDate, endDate } = this.getDateRange(period);
            const previousPeriod = this.getPreviousPeriod(startDate, endDate);

            // Fetch all tenants directly from tenantRepository
            const allTenants = await this.tenantRepository.find();
            this.logger.log(`Found ${allTenants.length} total tenants`);

            const activeTenants = allTenants.filter(t => t.status === 'active');
            this.logger.log(`Active tenants: ${activeTenants.length}`);

            // Get previous period active tenants count
            const previousActiveTenantCount = await this.tenantRepository.count({
                where: {
                    status: 'active' as any,
                    createdAt: Between(previousPeriod.startDate, previousPeriod.endDate)
                }
            });
            this.logger.log(`Previous period active tenants: ${previousActiveTenantCount}`);

            // Calculate active growth
            const activeGrowth = previousActiveTenantCount > 0
                ? ((activeTenants.length - previousActiveTenantCount) / previousActiveTenantCount) * 100
                : activeTenants.length > 0 ? 100 : 0;

            // Get total restaurants
            const totalRestaurants = await this.restaurantRepository.count();

            // Calculate overall growth (using active growth as proxy)
            const overallGrowth = activeGrowth;

            return {
                totalTenants: {
                    value: allTenants.length,
                    label: 'Total Tenants',
                },
                activeTenants: {
                    value: activeTenants.length,
                    growth: Number(activeGrowth.toFixed(2)),
                    label: 'Active',
                },
                totalRestaurants: {
                    value: totalRestaurants,
                    label: 'Total Restaurants',
                },
                overallGrowth: {
                    value: Number(overallGrowth.toFixed(2)),
                    trend: overallGrowth >= 0 ? 'up' : 'down',
                    label: 'Growth',
                },
            };
        } catch (error) {
            this.logger.error('Error in getTenantSummary:', error);
            throw error;
        }
    }
}
