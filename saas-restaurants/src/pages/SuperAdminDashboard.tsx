import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { RefreshCw, TrendingUp, DollarSign, Store, ShoppingCart, ArrowUpRight, ArrowDownRight, BarChart3, Database, AlertCircle } from 'lucide-react';
import superAdminAPI, { PeriodType, Restaurant } from '../api/superAdminAPI';
import { DashboardSkeleton } from '../components/CustomSkeleton';

const COLORS = {
    revenue: {
        gradient: 'from-emerald-500 to-teal-600',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        icon: 'text-emerald-600',
        border: 'border-emerald-200',
    },
    restaurants: {
        gradient: 'from-blue-500 to-indigo-600',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: 'text-blue-600',
        border: 'border-blue-200',
    },
    mrr: {
        gradient: 'from-purple-500 to-pink-600',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        icon: 'text-purple-600',
        border: 'border-purple-200',
    },
    orders: {
        gradient: 'from-orange-500 to-amber-600',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        icon: 'text-orange-600',
        border: 'border-orange-200',
    },
    // Chart colors
    chart: {
        success: '#10B981',
        primary: '#3B82F6',
        purple: '#8B5CF6',
    }
};

interface MetricCardProps {
    title: string;
    value: string;
    change: number;
    icon: React.ElementType;
    colorScheme: 'revenue' | 'restaurants' | 'mrr' | 'orders';
}

const MetricCard = ({ title, value, change, icon: Icon, colorScheme }: MetricCardProps) => {
    const isPositive = change >= 0;
    const colors = COLORS[colorScheme];

    return (
        <div className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl">
            {/* Gradient Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-full -mr-16 -mt-16 group-hover:opacity-10 transition-opacity`} />

            <div className="relative p-5">
                {/* Header with Icon */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
                    </div>
                    <div className={`flex-shrink-0 p-3 rounded-xl ${colors.bg} ml-3 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                </div>

                {/* Growth Indicator */}
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
                        )}
                        <span className={`text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{change.toFixed(1)}%
                        </span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">vs last period</span>
                </div>
            </div>

            {/* Bottom Accent Line */}
            <div className={`h-1 bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        </div>
    );
};

// Empty State Component
const EmptyState = ({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">{message}</p>
    </div>
);

export const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState<PeriodType>('month');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);

    const fetchDashboardData = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [dashboardData, txRes]: [any, any] = await Promise.all([
                superAdminAPI.getAllDashboardData(period),
                import('../features/transactions/transactionsAPI').then(m => m.default.getAllTransactions({}))
            ]);

            const top10Restaurants = (dashboardData.restaurantsPerformance as any).restaurants
                .sort((a: Restaurant, b: Restaurant) => b.revenue - a.revenue)
                .slice(0, 10);

            // Handle both wrapped and unwrapped responses
            const transactions = txRes.data || txRes;
            setData({
                ...dashboardData,
                top10Restaurants,
                recentTransactions: Array.isArray(transactions) ? transactions.slice(0, 5) : []
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [period]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    const summaryCards = data?.summaryCards?.cards || {};
    const revenueGrowth = data?.revenueGrowth || {};
    const subscriptionRevenue = data?.subscriptionRevenue || {};
    const platformActivity = data?.platformActivity || {};
    const top10Restaurants = data?.top10Restaurants || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Premium Header with DineSoon Branding */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {/* Top Brand Bar */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            {/* DineSoon Logo */}
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                                        KiwiQDine
                                    </h1>
                                    <p className="text-[10px] text-gray-500 font-medium -mt-0.5">Super Admin Panel</p>
                                </div>
                            </div>
                        </div>

                        {/* Period Selector & Refresh */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            >
                                <option value="today">📅 Today</option>
                                <option value="week">📊 This Week</option>
                                <option value="month">📈 This Month</option>
                                <option value="year">🎯 This Year</option>
                            </select>
                            <button
                                onClick={() => fetchDashboardData(true)}
                                disabled={refreshing}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gradient-to-br hover:from-orange-50 hover:to-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-all group"
                                title="Refresh Dashboard"
                            >
                                <RefreshCw className={`w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Title */}
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-purple-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
                        <div className="ml-auto">
                            <div className="px-3 py-1 bg-gradient-to-r from-orange-100 to-purple-100 rounded-full">
                                <span className="text-xs font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                                    LIVE DATA
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Summary Cards - Improved Spacing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
                    <MetricCard
                        title="Subscription Revenue"
                        value={`NZD ${(summaryCards?.subscriptionRevenue?.value || 0).toLocaleString()}`}
                        change={summaryCards?.subscriptionRevenue?.growth || 0}
                        icon={DollarSign}
                        colorScheme="revenue"
                    />
                    <MetricCard
                        title="Active Tenants"
                        value={(summaryCards?.activeTenants?.value || 0).toString()}
                        change={summaryCards?.activeTenants?.growth || 0}
                        icon={Store}
                        colorScheme="restaurants"
                    />
                    <MetricCard
                        title="Active Restaurants"
                        value={(summaryCards?.activeRestaurants?.value || 0).toString()}
                        change={summaryCards?.activeRestaurants?.growth || 0}
                        icon={TrendingUp}
                        colorScheme="mrr"
                    />
                    <MetricCard
                        title="Total Users"
                        value={(summaryCards?.totalUsers?.value || 0).toString()}
                        change={summaryCards?.totalUsers?.growth || 0}
                        icon={ShoppingCart}
                        colorScheme="orders"
                    />
                </div>

                {/* Charts Grid - Better Spacing */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
                    {/* Revenue & Orders Chart */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow">
                        <div className="mb-4 sm:mb-5">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Revenue & Orders</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Daily performance metrics</p>
                        </div>
                        {!revenueGrowth?.trends || revenueGrowth.trends.length === 0 ? (
                            <EmptyState
                                icon={BarChart3}
                                title="No Revenue Data"
                                message="No revenue or order data available for the selected period."
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={revenueGrowth?.trends || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 11, fill: '#6B7280' }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="revenue" stroke={COLORS.chart.success} strokeWidth={2} dot={false} name="Revenue" />
                                    <Line type="monotone" dataKey="orders" stroke={COLORS.chart.primary} strokeWidth={2} dot={false} name="Orders" />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Restaurant Status */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow">
                        <div className="mb-4 sm:mb-5">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Restaurant Status</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Distribution overview</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            <div className="text-center p-3 sm:p-4 bg-emerald-50 rounded-lg">
                                <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{data?.restaurantStatus?.active || 0}</p>
                                <p className="text-xs sm:text-sm font-medium text-emerald-700 mt-1">Active</p>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-gray-100 rounded-lg">
                                <p className="text-2xl sm:text-3xl font-bold text-gray-600">{data?.restaurantStatus?.inactive || 0}</p>
                                <p className="text-xs sm:text-sm font-medium text-gray-700 mt-1">Inactive</p>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-amber-50 rounded-lg">
                                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{data?.restaurantStatus?.suspended || 0}</p>
                                <p className="text-xs sm:text-sm font-medium text-amber-700 mt-1">Suspended</p>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-gray-600 font-medium">Total Restaurants</span>
                                <span className="font-semibold text-gray-900">{data?.restaurantStatus?.total || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Revenue */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow">
                        <div className="mb-4 sm:mb-5">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Subscription Revenue</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">By plan tier</p>
                        </div>
                        {!subscriptionRevenue?.trends || subscriptionRevenue.trends.length === 0 ? (
                            <EmptyState
                                icon={BarChart3}
                                title="No Subscription Data"
                                message="No subscription revenue data available for the selected period."
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={subscriptionRevenue?.trends?.map((t: any) => ({
                                    period: t.period,
                                    basic: t.planBreakdown?.find((p: any) => p.planName === 'Basic')?.revenue || 0,
                                    pro: t.planBreakdown?.find((p: any) => p.planName === 'Pro')?.revenue || 0,
                                    enterprise: t.planBreakdown?.find((p: any) => p.planName === 'Enterprise')?.revenue || 0
                                })) || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="basic" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="pro" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="enterprise" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 11, fill: '#6B7280' }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                                    />
                                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="enterprise" stackId="1" stroke="#8B5CF6" fill="url(#enterprise)" name="Enterprise" />
                                    <Area type="monotone" dataKey="pro" stackId="1" stroke="#3B82F6" fill="url(#pro)" name="Pro" />
                                    <Area type="monotone" dataKey="basic" stackId="1" stroke="#94A3B8" fill="url(#basic)" name="Basic" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Platform Activity */}
                    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 lg:p-6 hover:shadow-md transition-shadow">
                        <div className="mb-4 sm:mb-5">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Platform Activity</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Orders & customers</p>
                        </div>
                        {!platformActivity?.trends || platformActivity.trends.length === 0 ? (
                            <EmptyState
                                icon={BarChart3}
                                title="No Activity Data"
                                message="No platform activity data available for the selected period."
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={platformActivity?.trends || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        stroke="#9CA3AF"
                                        tick={{ fontSize: 11, fill: '#6B7280' }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="orders" fill={COLORS.chart.primary} radius={[4, 4, 0, 0]} name="Orders" />
                                    <Bar dataKey="newCustomers" fill={COLORS.chart.purple} radius={[4, 4, 0, 0]} name="New Customers" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Bottom Seaction: Top Restaurants & Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top 10 Restaurants Table - Improved */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Top Performing Restaurants</h3>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Ranked by revenue</p>
                            </div>
                            <button onClick={() => navigate('/restaurants')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Restaurant</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Orders</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Growth</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {top10Restaurants.length === 0 ? (
                                        <tr key="empty-state">
                                            <td colSpan={5} className="px-6 py-12">
                                                <EmptyState
                                                    icon={Database}
                                                    title="No Restaurant Data"
                                                    message="There are no restaurants to display."
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        top10Restaurants.map((restaurant: any, index: number) => (
                                            <tr
                                                key={restaurant.restaurantId}
                                                onClick={() => {
                                                    const path = restaurant.tenantId
                                                        ? `/restaurants/${restaurant.tenantId}/${restaurant.restaurantId}/detail`
                                                        : `/restaurants?search=${restaurant.restaurantName}`;
                                                    navigate(path);
                                                }}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-gray-900">#{index + 1}</span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                                                    <div className="flex items-center min-w-0">
                                                        {restaurant?.logo && (
                                                            <img src={restaurant.logo} alt={restaurant?.restaurantName} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 flex-shrink-0" />
                                                        )}
                                                        <span className="text-sm font-medium text-gray-900 truncate">{restaurant?.restaurantName || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-gray-900">NZD {(restaurant?.revenue || 0).toLocaleString()}</span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                                                    <span className="text-sm text-gray-600">{(restaurant?.orders || 0).toLocaleString()}</span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        {(restaurant?.revenueGrowth || 0) >= 0 ? (
                                                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                        ) : (
                                                            <ArrowDownRight className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                                        )}
                                                        <span className={`text-xs sm:text-sm font-semibold ${(restaurant?.revenueGrowth || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {(restaurant?.revenueGrowth || 0) >= 0 ? '+' : ''}{restaurant?.revenueGrowth || 0}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Transactions</h3>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Global ledger activity</p>
                            </div>
                            <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Live</div>
                        </div>
                        <div className="p-4">
                            <div className="space-y-4">
                                {data?.recentTransactions?.length > 0 ? (
                                    data.recentTransactions.map((tx: any) => (
                                        <div key={tx.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${tx.type === 'payout' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    <DollarSign className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 leading-none">#{tx.invoiceId}</p>
                                                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-semibold">{tx.type || 'payout'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-black ${tx.type === 'payout' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {tx.type === 'payout' ? '-' : '+'}NZD {tx.amount.toLocaleString()}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium">{new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">No recent transactions</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => navigate('/restaurants')}
                                className="w-full mt-6 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors uppercase tracking-widest"
                            >
                                Audit Full Ledger
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
