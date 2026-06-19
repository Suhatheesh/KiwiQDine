import { FC, useLayoutEffect, useState } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area,
} from 'recharts';
import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CreditCard,
    Calendar,
    UserPlus,
    UserCheck,
    BarChart3,
    Trophy
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchSummaryDataRequest } from '../../features/analytics/analyticsSlice';
import { PeriodType } from '../../features/analytics/types';
import { COLORS, PAYMENT_COLORS, periodOptions } from '../../utils/constants';
import placeHolderImage from '../../assets/placeholder.png';

interface AnalyticsTabProps {
    restaurantId?: string;
}

export const AnalyticsTab: FC<AnalyticsTabProps> = ({ restaurantId }) => {

    const dispatch = useDispatch<AppDispatch>();
    const {
        salesOverview = [],
        orderByCategory = [],
        paymentOverview = [],
        restaurantAnalytics,
        loading
    } = useSelector((state: RootState) => state.analytics);

    const [period, setPeriod] = useState<PeriodType>('today');

    useLayoutEffect(() => {
        if (!restaurantId) return;
        dispatch(fetchSummaryDataRequest({ period, restaurantId }));
    }, [dispatch, period]);

    const handleRefresh = () => {
        if (!restaurantId) return;
        dispatch(fetchSummaryDataRequest({ period, restaurantId }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Header Section */}
            <div className="px-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4">
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:shadow-md disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-700 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        {/* Period Filter */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                                className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer"
                            >
                                {periodOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>


                    </div>
                </div>
            </div>

            <div className="px-6 py-6 space-y-6">
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Today's Sales */}
                    <div className="group relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                {restaurantAnalytics?.salesOverview.trend === 'up' ? (
                                    <ArrowUpRight className="w-5 h-5 opacity-80" />
                                ) : restaurantAnalytics?.salesOverview.trend === 'down' ? (
                                    <ArrowDownRight className="w-5 h-5 opacity-80" />
                                ) : null}
                            </div>
                            <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">Today's Sales</p>
                            <p className="text-3xl font-bold mb-2">
                                NZD {restaurantAnalytics?.salesOverview.totalRevenue?.toLocaleString() || '0'}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                                <span className={`px-2 py-0.5 rounded-full bg-white bg-opacity-20 font-medium`}>
                                    {(restaurantAnalytics?.salesOverview.trendPercent ?? 0) > 0 ? '+' : ''}
                                    {restaurantAnalytics?.salesOverview.trendPercent ?? 0}%
                                </span>
                                <span className="opacity-80">vs yesterday</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Insights Section */}
                    {restaurantAnalytics?.customerInsights && (
                        <>
                            {/* Total Customers */}
                            <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-8 -mt-8"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                                            <Users size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">Total Customers</p>
                                    <p className="text-3xl font-bold">{restaurantAnalytics.customerInsights.totalCustomers}</p>
                                </div>
                            </div>

                            {/* New Customers */}
                            <div className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-8 -mt-8"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                                            <UserPlus size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">New Customers</p>
                                    <p className="text-3xl font-bold">{restaurantAnalytics.customerInsights.newCustomers}</p>
                                </div>
                            </div>

                            {/* Returning Customers */}
                            <div className="group relative bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-8 -mt-8"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                                            <UserCheck size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">Returning</p>
                                    <p className="text-3xl font-bold">{restaurantAnalytics.customerInsights.returningCustomers}</p>
                                </div>
                            </div>

                            {/* Avg Orders/Cust */}
                            <div className="group relative bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-8 -mt-8"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                                            <ShoppingBag size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">Avg Orders/Cust</p>
                                    <p className="text-3xl font-bold">{restaurantAnalytics.customerInsights.avgOrdersPerCustomer?.toFixed(1) || '0.0'}</p>
                                </div>
                            </div>

                            {/* Retention Rate */}
                            <div className="group relative bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-8 -mt-8"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                                            <RefreshCw size={20} />
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">Retention Rate</p>
                                    <p className="text-3xl font-bold">{Math.round((restaurantAnalytics.customerInsights.customerRetentionRate || 0) * 100)}%</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Peak Hours - Area Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Peak Hours</h3>
                                <p className="text-sm text-gray-500 mt-1">Order and revenue intensity by time</p>
                            </div>
                            <div className="p-2 bg-indigo-50 rounded-xl">
                                <Clock className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={restaurantAnalytics?.peakHours || []}>
                                <defs>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="left" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorOrders)"
                                    name="Orders"
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={0}
                                    name="Revenue (NZD)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Sales Overview - Line Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Sales Overview</h3>
                                <p className="text-sm text-gray-500 mt-1">Revenue trends over time</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={salesOverview}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="time"
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke={COLORS.success}
                                    strokeWidth={3}
                                    dot={{ fill: COLORS.success, r: 4 }}
                                    activeDot={{ r: 6 }}
                                    fill="url(#colorRevenue)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Orders by Category - Bar Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Orders by Category</h3>
                                <p className="text-sm text-gray-500 mt-1">Category distribution</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={orderByCategory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="category"
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill={COLORS.blue}
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Payment Methods - Pie Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Payment Methods</h3>
                                <p className="text-sm text-gray-500 mt-1">Payment distribution</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-xl">
                                <CreditCard className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={paymentOverview.map((entry) => ({
                                        method: entry.method,
                                        count: entry.count,
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ payload }) => `${payload.method}: ${payload.count}`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {paymentOverview.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PAYMENT_COLORS[entry.method.toLowerCase()] || COLORS.primary}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>


                    {/* Top Selling Items (Foods) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Top 5 Foods</h3>
                                <p className="text-sm text-gray-500 mt-1">Best performing menu items</p>
                            </div>
                            <div className="p-2 bg-amber-50 rounded-xl">
                                <Trophy className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {restaurantAnalytics?.top5Foods?.map((food, index) => (
                                <div key={food.name} className="flex items-center space-x-4">
                                    <div className="relative">
                                        <img
                                            src={food.image || placeHolderImage}
                                            alt={food.name}
                                            className="w-12 h-12 rounded-xl object-cover bg-gray-100"
                                        />
                                        <div className="absolute -top-1 -left-1 w-5 h-5 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{food.name}</p>
                                        <p className="text-xs text-gray-500">{food.category} • {food.quantity} items sold</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">NZD {food.revenue?.toLocaleString() || '0'}</p>
                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500 rounded-full"
                                                style={{ width: `${food.revenueContribution}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Revenue by Category */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Revenue by Category</h3>
                                <p className="text-sm text-gray-500 mt-1">Monetary contribution</p>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-xl">
                                <BarChart3 className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {restaurantAnalytics?.revenueByCategory?.map((cat) => (
                                <div key={cat.category} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-semibold text-gray-700">{cat.category}</span>
                                        <span className="font-bold text-gray-900">NZD {cat.revenue?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full"
                                            style={{ width: `${cat.percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                                        <span>{cat.orders} orders</span>
                                        <span>{cat.percentage}% contribution</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
