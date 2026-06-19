import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderActivityLog, OrderAction, User } from '../infrastructure/database/entities';

@Injectable()
export class OrderActivityLogService {
    private readonly logger = new Logger(OrderActivityLogService.name);

    constructor(
        @InjectRepository(OrderActivityLog)
        private readonly activityLogRepository: Repository<OrderActivityLog>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
    ) { }

    async logAction(
        orderId: string | null,
        action: OrderAction,
        userId?: string,
        notes?: string,
        metadata?: any,
        contextOptions?: {
            restaurantId?: string;
            tenantId?: string;
            entityId?: string;
            performedByName?: string;
            performedByRole?: string;
        }
    ): Promise<OrderActivityLog> {
        try {
            let performedByName = contextOptions?.performedByName || 'System';
            let performedByRole = contextOptions?.performedByRole || 'system';

            // 1. Check if it's a staff member (via userId)
            if (userId) {
                const staff = await this.userRepository.findOne({ where: { id: userId } });
                if (staff) {
                    performedByName = staff.name || staff.email;
                    performedByRole = staff.role;
                }
            } else if (orderId) {
                // 2. If no userId but has orderId, check if it was performed by the customer
                const order = await this.orderRepository.findOne({
                    where: { id: orderId },
                    relations: ['customer'],
                });

                if (order && order.customer) {
                    performedByName = order.customer.name || 'Customer';
                    performedByRole = 'customer';
                }
            }

            const log = this.activityLogRepository.create({
                orderId: orderId || undefined,
                restaurantId: contextOptions?.restaurantId,
                tenantId: contextOptions?.tenantId,
                entityId: contextOptions?.entityId,
                action,
                performedById: userId,
                performedByName,
                performedByRole,
                notes,
                metadata,
            });

            return await this.activityLogRepository.save(log);
        } catch (error) {
            this.logger.error(`Failed to log action: ${error.message}`, error.stack);
            return null;
        }
    }

    async getOrderLogs(orderId: string): Promise<OrderActivityLog[]> {
        return await this.activityLogRepository.find({
            where: { orderId },
            order: { createdAt: 'DESC' },
            relations: ['performedBy'],
        });
    }

    async getRecentLogs(restaurantId: string, limit = 50): Promise<OrderActivityLog[]> {
        return await this.activityLogRepository.find({
            where: { order: { restaurantId } },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['order', 'performedBy'],
        });
    }

    /**
     * Get all activity logs for a specific staff member
     */
    async getStaffLogs(
        staffId: string,
        options?: {
            restaurantId?: string;
            startDate?: Date;
            endDate?: Date;
            action?: OrderAction;
            limit?: number;
        }
    ): Promise<OrderActivityLog[]> {
        const queryBuilder = this.activityLogRepository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.order', 'order')
            .where('log.performedById = :staffId', { staffId });

        if (options?.restaurantId) {
            queryBuilder.andWhere('log.restaurantId = :restaurantId', { restaurantId: options.restaurantId });
        }

        if (options?.startDate) {
            queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: options.startDate });
        }

        if (options?.endDate) {
            queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: options.endDate });
        }

        if (options?.action) {
            queryBuilder.andWhere('log.action = :action', { action: options.action });
        }

        queryBuilder.orderBy('log.createdAt', 'DESC');

        if (options?.limit) {
            queryBuilder.take(options.limit);
        }

        return await queryBuilder.getMany();
    }

    /**
     * Get performance statistics for a staff member
     */
    async getStaffPerformanceStats(
        staffId: string,
        restaurantId?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<any> {
        const queryBuilder = this.activityLogRepository
            .createQueryBuilder('log')
            .where('log.performedById = :staffId', { staffId });

        if (restaurantId) {
            queryBuilder.andWhere('log.restaurantId = :restaurantId', { restaurantId });
        }

        if (startDate) {
            queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
        }

        if (endDate) {
            queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
        }

        const logs = await queryBuilder.getMany();

        // Get staff details
        const staff = await this.userRepository.findOne({ where: { id: staffId } });

        // Calculate statistics
        const actionCounts: Record<string, number> = {};
        const dailyActivity: Record<string, number> = {};
        const hourlyActivity: Record<number, number> = {};

        logs.forEach(log => {
            // Count by action type
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

            // Count by day
            const day = log.createdAt.toISOString().split('T')[0];
            dailyActivity[day] = (dailyActivity[day] || 0) + 1;

            // Count by hour
            const hour = log.createdAt.getHours();
            hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
        });

        // Calculate order-specific metrics
        const orderActions = logs.filter(log => log.orderId);
        const uniqueOrders = new Set(orderActions.map(log => log.orderId)).size;

        // Calculate login sessions
        const loginLogs = logs.filter(log => log.action === OrderAction.LOGIN);
        const logoutLogs = logs.filter(log => log.action === OrderAction.LOGOUT);

        return {
            staff: staff ? {
                id: staff.id,
                name: staff.name,
                email: staff.email,
                role: staff.role,
            } : null,
            period: {
                startDate,
                endDate,
                totalDays: startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null,
            },
            summary: {
                totalActions: logs.length,
                uniqueOrdersHandled: uniqueOrders,
                loginSessions: loginLogs.length,
                logoutSessions: logoutLogs.length,
            },
            actionBreakdown: actionCounts,
            dailyActivity,
            hourlyActivity,
            recentActions: logs.slice(0, 10).map(log => ({
                action: log.action,
                notes: log.notes,
                createdAt: log.createdAt,
                orderId: log.orderId,
            })),
        };
    }

    /**
     * Get monthly performance review for all staff in a restaurant
     */
    async getMonthlyPerformanceReview(
        restaurantId: string,
        year: number,
        month: number
    ): Promise<any> {
        // Calculate date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Get all staff for this restaurant
        const staff = await this.userRepository.find({
            where: { restaurantId },
        });

        const performanceData = await Promise.all(
            staff.map(async (staffMember) => {
                const logs = await this.activityLogRepository
                    .createQueryBuilder('log')
                    .where('log.performedById = :staffId', { staffId: staffMember.id })
                    .andWhere('log.restaurantId = :restaurantId', { restaurantId })
                    .andWhere('log.createdAt >= :startDate', { startDate })
                    .andWhere('log.createdAt <= :endDate', { endDate })
                    .getMany();

                const orderActions = logs.filter(log => log.orderId);
                const uniqueOrders = new Set(orderActions.map(log => log.orderId)).size;
                const confirmedOrders = logs.filter(log => log.action === OrderAction.CONFIRMED).length;
                const servedOrders = logs.filter(log => log.action === OrderAction.SERVED).length;
                const paymentsProcessed = logs.filter(log => log.action === OrderAction.PAYMENT_PROCESSED).length;

                return {
                    staffId: staffMember.id,
                    name: staffMember.name,
                    email: staffMember.email,
                    role: staffMember.role,
                    metrics: {
                        totalActions: logs.length,
                        ordersHandled: uniqueOrders,
                        ordersConfirmed: confirmedOrders,
                        ordersServed: servedOrders,
                        paymentsProcessed,
                    },
                };
            })
        );

        // Sort by orders handled (descending)
        performanceData.sort((a, b) => b.metrics.ordersHandled - a.metrics.ordersHandled);

        return {
            period: {
                year,
                month,
                monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
                startDate,
                endDate,
            },
            restaurantId,
            staffPerformance: performanceData,
            topPerformer: performanceData[0] || null,
        };
    }

    /**
     * Get efficiency comparison between staff members
     */
    async getStaffEfficiencyComparison(
        restaurantId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<any> {
        const staff = await this.userRepository.find({
            where: { restaurantId },
        });

        const efficiencyData = await Promise.all(
            staff.map(async (staffMember) => {
                const queryBuilder = this.activityLogRepository
                    .createQueryBuilder('log')
                    .where('log.performedById = :staffId', { staffId: staffMember.id })
                    .andWhere('log.restaurantId = :restaurantId', { restaurantId });

                if (startDate) {
                    queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
                }
                if (endDate) {
                    queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
                }

                const logs = await queryBuilder.getMany();
                const orderActions = logs.filter(log => log.orderId);
                const uniqueOrders = new Set(orderActions.map(log => log.orderId)).size;

                // Calculate average time between actions (efficiency metric)
                const sortedLogs = logs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                let totalTimeBetweenActions = 0;
                for (let i = 1; i < sortedLogs.length; i++) {
                    totalTimeBetweenActions += sortedLogs[i].createdAt.getTime() - sortedLogs[i - 1].createdAt.getTime();
                }
                const avgTimeBetweenActions = sortedLogs.length > 1
                    ? totalTimeBetweenActions / (sortedLogs.length - 1) / 1000 / 60 // in minutes
                    : 0;

                return {
                    staffId: staffMember.id,
                    name: staffMember.name,
                    role: staffMember.role,
                    metrics: {
                        totalActions: logs.length,
                        ordersHandled: uniqueOrders,
                        actionsPerOrder: uniqueOrders > 0 ? (logs.length / uniqueOrders).toFixed(2) : 0,
                        avgTimeBetweenActions: avgTimeBetweenActions.toFixed(2),
                        efficiencyScore: uniqueOrders > 0 ? (uniqueOrders / logs.length * 100).toFixed(2) : 0,
                    },
                };
            })
        );

        // Sort by efficiency score (higher is better)
        efficiencyData.sort((a, b) => parseFloat(String(b.metrics.efficiencyScore)) - parseFloat(String(a.metrics.efficiencyScore)));

        return {
            period: { startDate, endDate },
            restaurantId,
            staffComparison: efficiencyData,
            mostEfficient: efficiencyData[0] || null,
        };
    }

    /**
     * Get attendance tracking for staff
     */
    async getAttendanceTracking(
        restaurantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<any> {
        const staff = await this.userRepository.find({
            where: { restaurantId },
        });

        const attendanceData = await Promise.all(
            staff.map(async (staffMember) => {
                const logs = await this.activityLogRepository
                    .createQueryBuilder('log')
                    .where('log.performedById = :staffId', { staffId: staffMember.id })
                    .andWhere('log.restaurantId = :restaurantId', { restaurantId })
                    .andWhere('log.createdAt >= :startDate', { startDate })
                    .andWhere('log.createdAt <= :endDate', { endDate })
                    .andWhere('log.action IN (:...actions)', { actions: [OrderAction.LOGIN, OrderAction.LOGOUT] })
                    .orderBy('log.createdAt', 'ASC')
                    .getMany();

                const loginLogs = logs.filter(log => log.action === OrderAction.LOGIN);
                const logoutLogs = logs.filter(log => log.action === OrderAction.LOGOUT);

                // Calculate sessions and total hours worked
                const sessions = [];
                let totalHoursWorked = 0;
                const dailyHours: Record<string, number> = {};

                for (let i = 0; i < loginLogs.length; i++) {
                    const loginTime = loginLogs[i].createdAt;
                    const logoutTime = logoutLogs[i]?.createdAt;

                    if (logoutTime) {
                        const hoursWorked = (logoutTime.getTime() - loginTime.getTime()) / 1000 / 60 / 60;
                        totalHoursWorked += hoursWorked;

                        const day = loginTime.toISOString().split('T')[0];
                        dailyHours[day] = (dailyHours[day] || 0) + hoursWorked;

                        sessions.push({
                            loginTime,
                            logoutTime,
                            hoursWorked: hoursWorked.toFixed(2),
                        });
                    } else {
                        // Login without logout (still working or forgot to logout)
                        sessions.push({
                            loginTime,
                            logoutTime: null,
                            hoursWorked: null,
                            status: 'incomplete',
                        });
                    }
                }

                const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const daysWorked = Object.keys(dailyHours).length;

                return {
                    staffId: staffMember.id,
                    name: staffMember.name,
                    role: staffMember.role,
                    attendance: {
                        totalSessions: sessions.length,
                        completedSessions: sessions.filter(s => s.status !== 'incomplete').length,
                        incompleteSessions: sessions.filter(s => s.status === 'incomplete').length,
                        totalHoursWorked: totalHoursWorked.toFixed(2),
                        avgHoursPerDay: daysWorked > 0 ? (totalHoursWorked / daysWorked).toFixed(2) : 0,
                        daysWorked,
                        attendanceRate: ((daysWorked / totalDays) * 100).toFixed(2),
                        dailyHours,
                    },
                    recentSessions: sessions.slice(-5),
                };
            })
        );

        return {
            period: { startDate, endDate },
            restaurantId,
            staffAttendance: attendanceData,
        };
    }

    /**
     * Get peak hour analysis for staffing optimization
     */
    async getPeakHourAnalysis(
        restaurantId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<any> {
        const queryBuilder = this.activityLogRepository
            .createQueryBuilder('log')
            .where('log.restaurantId = :restaurantId', { restaurantId })
            .andWhere('log.orderId IS NOT NULL'); // Only order-related actions

        if (startDate) {
            queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
        }
        if (endDate) {
            queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
        }

        const logs = await queryBuilder.getMany();

        // Analyze by hour
        const hourlyData: Record<number, { totalActions: number; uniqueOrders: Set<string>; staffActive: Set<string> }> = {};
        const dayOfWeekData: Record<number, { totalActions: number; uniqueOrders: Set<string> }> = {};

        logs.forEach(log => {
            const hour = log.createdAt.getHours();
            const dayOfWeek = log.createdAt.getDay(); // 0 = Sunday, 6 = Saturday

            if (!hourlyData[hour]) {
                hourlyData[hour] = { totalActions: 0, uniqueOrders: new Set(), staffActive: new Set() };
            }
            hourlyData[hour].totalActions++;
            if (log.orderId) hourlyData[hour].uniqueOrders.add(log.orderId);
            if (log.performedById) hourlyData[hour].staffActive.add(log.performedById);

            if (!dayOfWeekData[dayOfWeek]) {
                dayOfWeekData[dayOfWeek] = { totalActions: 0, uniqueOrders: new Set() };
            }
            dayOfWeekData[dayOfWeek].totalActions++;
            if (log.orderId) dayOfWeekData[dayOfWeek].uniqueOrders.add(log.orderId);
        });

        // Format hourly data
        const hourlyAnalysis = Object.entries(hourlyData).map(([hour, data]) => ({
            hour: parseInt(hour),
            timeRange: `${hour}:00 - ${parseInt(hour) + 1}:00`,
            totalActions: data.totalActions,
            uniqueOrders: data.uniqueOrders.size,
            staffActive: data.staffActive.size,
            actionsPerStaff: data.staffActive.size > 0 ? (data.totalActions / data.staffActive.size).toFixed(2) : 0,
        })).sort((a, b) => b.totalActions - a.totalActions);

        // Format day of week data
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const weeklyAnalysis = Object.entries(dayOfWeekData).map(([day, data]) => ({
            dayOfWeek: parseInt(day),
            dayName: dayNames[parseInt(day)],
            totalActions: data.totalActions,
            uniqueOrders: data.uniqueOrders.size,
        })).sort((a, b) => b.totalActions - a.totalActions);

        return {
            period: { startDate, endDate },
            restaurantId,
            peakHours: hourlyAnalysis.slice(0, 5), // Top 5 busiest hours
            hourlyBreakdown: hourlyAnalysis,
            busiestDay: weeklyAnalysis[0] || null,
            weeklyBreakdown: weeklyAnalysis,
            recommendations: {
                peakHour: hourlyAnalysis[0]?.timeRange || null,
                recommendedStaffing: hourlyAnalysis[0] ? Math.ceil(hourlyAnalysis[0].uniqueOrders / 10) : 0,
                quietestHour: hourlyAnalysis[hourlyAnalysis.length - 1]?.timeRange || null,
            },
        };
    }
}
