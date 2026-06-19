import { useState, useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    Download,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    CreditCard,
    Trophy,
    ChevronRight,
    History as HistoryIcon,
    Flame,
    Package,
    CheckCircle,
    XCircle,
    Eye,
    Clock,
    Play,
    ChefHat,
    UtensilsCrossed,
    Shield,
    User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RouteLinks } from '../routers/type';
import { AppDispatch, RootState } from '../app/store';
import { fetchSummaryDataRequest } from '../features/dashboard/dashboardSlice';
import { fetchRecentLogsRequest } from '../features/orders/ordersSlice';
import { useAuth } from '../hooks/useAuth';
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
} from 'recharts';
import { dateFormatter } from '../utils';
import { Button } from '../components/Button';
import { COLORS, periodOptions, TenantType } from '../utils/constants';
import { PAYMENT_COLORS } from '../utils/constants';
import { PeriodType } from '../features/dashboard/types';
import { DashboardKPISkeleton, ChartSkeleton } from '../components/CustomSkeleton';
import { Skeleton } from '@mui/material';
import placeHolderImage from '../assets/placeholder.png';

export const Dashboard = () => {
    const { user } = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const [period, setPeriod] = useState<PeriodType>('today');

    const {
        summaryCards,
        salesOverview = [],
        orderByCategory = [],
        paymentOverview = [],
        tableOverview = [],
        recentOrders = [],
        topFoods,
        loading,
    } = useSelector((state: RootState) => state.dashboard);

    const {
        recentLogs = [],
    } = useSelector((state: RootState) => state.orders);

    useLayoutEffect(() => {
        if (!user?.restaurantId) return;
        dispatch(fetchSummaryDataRequest(period));
        dispatch(fetchRecentLogsRequest(user?.restaurantId || ''));
    }, [dispatch, period, user?.restaurantId]);

    const handleRefresh = () => {
        dispatch(fetchSummaryDataRequest(period));
    };

    const handleExport = () => {
        console.log('Exporting dashboard data...');
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Dashboard Analytics
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Welcome back, <span className="font-medium text-gray-700">{user?.name}</span>. Here's your restaurant overview.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Period Filter */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value as PeriodType)}
                                    className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
                                >
                                    {periodOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:shadow-md disabled:opacity-50 text-gray-600"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>

                            <Button
                                onClick={handleExport}
                                title="Export Data"
                                variant="outline"
                                className="border-gray-200 hover:bg-gray-50 text-gray-700"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Export</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {loading ? (
                        <>
                            <DashboardKPISkeleton />
                            <DashboardKPISkeleton />
                            <DashboardKPISkeleton />
                            <DashboardKPISkeleton />
                        </>
                    ) : (
                        <>
                            {/* Today's Sales */}
                            <div className="group bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden min-h-[140px] flex flex-col justify-between">
                                {/* Decorative circular element - matches reference image */}
                                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full border-12 border-white/10 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

                                <div className="relative z-10 flex items-start justify-between">
                                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 shadow-inner">
                                        <DollarSign className="w-5 h-5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className={`backdrop-blur-md px-3 py-1 rounded-full border border-white/10 ${(summaryCards?.todaysSales?.changePercent ?? 0) >= 0
                                        ? 'bg-white/20'
                                        : 'bg-rose-500/20'
                                        }`}>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                                            {(summaryCards?.todaysSales?.changePercent ?? 0) >= 0 ? <ArrowUpRight className="w-3 h-3" strokeWidth={3} /> : <ArrowDownRight className="w-3 h-3" strokeWidth={3} />}
                                            {period} REVENUE
                                        </span>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-auto">
                                    <h3 className="text-3xl font-black text-white tracking-tight leading-none mb-1.5">
                                        NZD {summaryCards?.todaysSales?.totalRevenue?.toLocaleString() || '0'}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest">
                                            {Math.abs(summaryCards?.todaysSales?.changePercent ?? 0)}% vs last {period.toLowerCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Total Orders */}
                            <div className="group bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden min-h-[140px] flex flex-col justify-between">
                                {/* Decorative circular element */}
                                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full border-12 border-white/10 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

                                <div className="relative z-10 flex items-start justify-between">
                                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 shadow-inner">
                                        <ShoppingBag className="w-5 h-5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-pulse shadow-[0_0_8px_rgba(191,219,254,0.8)]"></div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE ORDERS</span>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-auto">
                                    <h3 className="text-3xl font-black text-white tracking-tight leading-none mb-1.5">
                                        {summaryCards?.totalOrdersToday?.count || '0'}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                                            <span className="text-[11px] text-white/70 font-bold uppercase tracking-widest">Dine: {summaryCards?.totalOrdersToday?.dineIn || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                            <span className="text-[11px] text-white/70 font-bold uppercase tracking-widest">Take: {summaryCards?.totalOrdersToday?.takeaway || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Tables */}
                            {user?.tenant?.type === TenantType.RESTAURANT && (
                                <div className="group bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden min-h-[140px] flex flex-col justify-between">
                                    {/* Decorative circular element */}
                                    <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full border-12 border-white/10 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

                                    <div className="relative z-10 flex items-start justify-between">
                                        <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 shadow-inner">
                                            <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                                {Math.round(((summaryCards?.activeTables?.occupied || 0) / (summaryCards?.activeTables?.total || 1)) * 100)}% BUSY
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-auto">
                                        <h3 className="text-3xl font-black text-white tracking-tight leading-none mb-1.5">
                                            {summaryCards?.activeTables?.occupied || '0'}
                                            <span className="text-lg text-white/40 font-semibold ml-1">/ {summaryCards?.activeTables?.total || '0'}</span>
                                        </h3>
                                        <div className="space-y-1.5 pt-0.5">
                                            <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5 p-px">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                                                    style={{ width: `${((summaryCards?.activeTables?.occupied || 0) / (summaryCards?.activeTables?.total || 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top Selling Item */}
                            <div className="group bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden min-h-[140px] flex flex-col justify-between">
                                {/* Decorative circular element */}
                                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full border-12 border-white/10 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

                                <div className="relative z-10 flex items-start justify-between">
                                    <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 shadow-inner">
                                        <Trophy className="w-5 h-5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">BESTSELLER</span>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-auto">
                                    <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-1.5 line-clamp-1 group-hover:line-clamp-none transition-all">
                                        {summaryCards?.topSellingItem?.name || 'No Sales Yet'}
                                    </h3>
                                    <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest">
                                        {summaryCards?.topSellingItem?.quantity || '0'} UNITS SOLD
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loading ? (
                        <>
                            <ChartSkeleton />
                            <ChartSkeleton />
                            <ChartSkeleton />
                            <ChartSkeleton />
                        </>
                    ) : (
                        <>
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

                            {/* Table Occupancy - Bar Chart */}
                            {user?.tenant?.type === TenantType.RESTAURANT ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Table Occupancy by Hour</h3>
                                            <p className="text-sm text-gray-500 mt-1">Hourly table usage pattern</p>
                                        </div>
                                        <div className="p-2 bg-orange-50 rounded-lg">
                                            <Users className="w-5 h-5 text-orange-600" />
                                        </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}> <BarChart data={tableOverview}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis
                                            dataKey="time"
                                            stroke="#9ca3af"
                                            style={{ fontSize: '11px' }}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="#9ca3af"
                                            style={{ fontSize: '12px' }}
                                            tickLine={false}
                                            label={{ value: 'Tables', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6b7280' } }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                padding: '12px',
                                            }}
                                            formatter={(value: any, name?: string) => {
                                                if (name === 'occupied') return [value, 'Occupied'];
                                                if (name === 'total') return [value, 'Total'];

                                                return [value, name ?? ''];
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ paddingTop: '20px' }}
                                            formatter={(value) => {
                                                if (value === 'occupied') return 'Occupied Tables';
                                                if (value === 'total') return 'Total Tables';
                                                return value;
                                            }}
                                        />
                                        <Bar
                                            dataKey="occupied"
                                            fill={COLORS.orange}
                                            radius={[8, 8, 0, 0]}
                                            maxBarSize={40}
                                        />
                                        <Bar
                                            dataKey="total"
                                            fill="#e5e7eb"
                                            radius={[8, 8, 0, 0]}
                                            maxBarSize={40}
                                        />
                                    </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-6">
                                    <div className="flex items-center justify-between mb-6 px-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Top 10 Foods</h3>
                                            <p className="text-sm text-gray-500 mt-1">Best performing menu items</p>
                                        </div>
                                        <div className="p-2 bg-amber-50 rounded-xl">
                                            <Trophy className="w-5 h-5 text-amber-600" />
                                        </div>
                                    </div>
                                    <div className="space-y-4 h-[300px] overflow-y-scroll">
                                        {topFoods?.top10Foods.map((food, index) => (
                                            <div key={index} className="flex items-center space-x-4 px-6">
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
                                                    <p className="text-xs text-gray-500">{food.category} • {food.quantitySold} items sold</p>
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
                            )}
                        </>
                    )}
                </div>

                {/* Bottom Section: Recent Orders & Live Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders Table */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                                <p className="text-sm text-gray-500 mt-1">Real-time order monitoring</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm">
                                    {recentOrders.length} active
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Table</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><Skeleton width="60%" height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width="40%" height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width="50%" height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width="30%" height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width="70%" height={32} className="rounded-xl" /></td>
                                            </tr>
                                        ))
                                    ) : recentOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                                                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                                                    </div>
                                                    <p className="font-medium text-gray-900">No Recent Orders</p>
                                                    <p className="text-sm mt-1">Orders will appear here automatically.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        recentOrders.slice(0, 10).map((order) => {
                                            const statusConfig: Record<string, any> = {
                                                'COMPLETED': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
                                                'PENDING': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending', pulse: true },
                                                'PREPARING': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Preparing', rotate: true },
                                                'READY': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Ready' }
                                            };
                                            const config = statusConfig[order.orderStatus.toUpperCase()] || statusConfig['PENDING'];

                                            return (
                                                <tr key={order.orderId} className="hover:bg-gray-50/80 transition-all duration-200 cursor-pointer group/row" onClick={() => navigate(`${RouteLinks.ORDERS}`)}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="font-bold text-sm text-primary-600 group-hover/row:underline">#{order.orderNumber}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">Table {order.tableNo}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">{dateFormatter.format(new Date(order.orderTime))}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 text-sm">NZD {order.totalAmount.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config.bg} ${config.text} ${config.border}`}>
                                                            {config.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></span>}
                                                            {config.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Live Activity Feed */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                                    <HistoryIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Live Activity</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time Feed</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                <span className="text-xs font-black text-gray-500">{recentLogs.length} Events</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[500px] p-6">
                            <div className="space-y-6">
                                {recentLogs && recentLogs.length > 0 ? recentLogs.map((log) => {
                                    const logActionMap: Record<string, { label: string, color: string, icon: any, bgColor: string }> = {
                                        'created': { label: 'New Order', color: 'text-blue-600', icon: ShoppingBag, bgColor: 'bg-blue-50/50' },
                                        'confirmed': { label: 'Confirmed', color: 'text-indigo-600', icon: CheckCircle, bgColor: 'bg-indigo-50/50' },
                                        'preparing': { label: 'Preparing', color: 'text-orange-600', icon: Flame, bgColor: 'bg-orange-50/50' },
                                        'ready': { label: 'Ready', color: 'text-amber-600', icon: Package, bgColor: 'bg-amber-50/50' },
                                        'served': { label: 'Served', color: 'text-green-600', icon: CheckCircle, bgColor: 'bg-green-50/50' },
                                        'completed': { label: 'Completed', color: 'text-emerald-600', icon: CheckCircle, bgColor: 'bg-emerald-50/50' },
                                        'cancelled': { label: 'Cancelled', color: 'text-red-600', icon: XCircle, bgColor: 'bg-red-50/50' },
                                        'on_hold': { label: 'On Hold', color: 'text-amber-600', icon: Clock, bgColor: 'bg-amber-50/50' },
                                        'released': { label: 'Released', color: 'text-blue-600', icon: Play, bgColor: 'bg-blue-50/50' },
                                        'payment_processed': { label: 'Paid', color: 'text-emerald-600', icon: DollarSign, bgColor: 'bg-emerald-50/50' },
                                        'viewed': { label: 'Viewed', color: 'text-slate-400', icon: Eye, bgColor: 'bg-slate-50/50' },
                                        'deleted': { label: 'Deleted', color: 'text-rose-600', icon: XCircle, bgColor: 'bg-rose-50/50' },
                                    };

                                    const roleMap: Record<string, { icon: any, color: string, label: string }> = {
                                        'kitchen_staff': { icon: ChefHat, color: 'text-orange-600', label: 'Kitchen' },
                                        'waiter': { icon: UtensilsCrossed, color: 'text-blue-600', label: 'Waiter' },
                                        'manager': { icon: Shield, color: 'text-indigo-600', label: 'Manager' },
                                        'tenant_admin': { icon: Shield, color: 'text-purple-600', label: 'Admin' },
                                        'super_admin': { icon: Shield, color: 'text-rose-600', label: 'Platform Admin' },
                                        'customer': { icon: User, color: 'text-gray-600', label: 'Customer' },
                                    };

                                    const config = logActionMap[log.action] || { label: log.action.replace('_', ' '), color: 'text-slate-600', icon: Clock, bgColor: 'bg-slate-50/50' };
                                    const roleConfig = roleMap[log.performedByRole] || { icon: User, color: 'text-slate-600', label: log.performedByRole };
                                    const Icon = config.icon;
                                    const RoleIcon = roleConfig.icon;

                                    return (
                                        <div key={log.id} className="flex gap-4 p-3 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 group/log">
                                            <div className={`w-12 h-12 rounded-2xl ${config.bgColor} flex items-center justify-center shrink-0 border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover/log:scale-110 group-hover/log:shadow-md transition-all duration-300`}>
                                                <Icon className={`w-6 h-6 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-gray-900 truncate">
                                                            {log.performedByName}
                                                        </span>
                                                        <div className={`p-1 rounded-md ${roleConfig.color.replace('text-', 'bg-').replace('600', '50')} scale-75 origin-left`}>
                                                            <RoleIcon className={`w-3 h-3 ${roleConfig.color}`} />
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-lg border border-gray-100 whitespace-nowrap">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                                                    <span className="font-medium">{config.label}</span>
                                                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span
                                                        className="font-black text-primary-600 hover:text-primary-700 cursor-pointer flex items-center gap-1 group/id"
                                                        onClick={() => navigate(`${RouteLinks.ORDERS}`)}
                                                    >
                                                        #{log.order?.orderNumber}
                                                        <ChevronRight className="w-3 h-3 transition-transform group-hover/id:translate-x-0.5" />
                                                    </span>
                                                </div>
                                                {log.notes && (
                                                    <div className="mt-2 pl-3 border-l-2 border-gray-100">
                                                        <p className="text-[10px] text-gray-400 font-medium italic line-clamp-1" title={log.notes}>
                                                            "{log.notes}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                        <HistoryIcon className="w-10 h-10 text-gray-200 mb-2" />
                                        <p className="text-gray-500 text-xs font-medium">No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
                            <button onClick={() => navigate(`${RouteLinks.ORDERS}`)} className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1 w-full transition-colors">
                                View Full Audit Log
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
