import { useState, useLayoutEffect } from 'react';
import { TrendingUp, DollarSign, Clock, Calendar as CalendarIcon, Filter, AlertCircle, PieChart as PieChartIcon, Trophy } from 'lucide-react';
import { LineChart } from '../components/LineChart';
import { BarChart } from '../components/BarChart';
import { PieChart } from '../components/PieChart';
import { useAuth } from '../hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { fetchAnalyticsDataRequest } from '../features/analytics/analyticsSlice';
import { AnalyticsFilters } from '../features/analytics/types';
import { AnalyticsKPISkeleton, ChartSkeleton } from '../components/CustomSkeleton';
import EmptyState from '../components/EmptyState';
import { Skeleton } from '@mui/material';
import placeHolderImage from '../assets/placeholder.png';

export const Analytics = () => {
    const { user, primaryColor } = useAuth();
    const dispatch = useDispatch<AppDispatch>();

    const { topFoods } = useSelector((state: RootState) => state.dashboard);
    const { analyticsData, loading } = useSelector((state: RootState) => state.analytics);

    const [filters, setFilters] = useState<AnalyticsFilters>({
        period: 'today'
    });

    useLayoutEffect(() => {
        dispatch(fetchAnalyticsDataRequest(filters));
    }, [dispatch, filters.period]);

    const handlePeriodChange = (period: AnalyticsFilters['period']) => {
        setFilters(prev => ({ ...prev, period }));
    };

    const validatePaymentColor = (paymentMethod: string) => {
        switch (paymentMethod.toLowerCase()) {
            case 'cash': return '#10b981';
            case 'card': return '#3b82f6';
            case 'online': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const peakHour = analyticsData?.peakHours?.reduce((max, item) =>
        item.orders > max.orders ? item : max
        , analyticsData.peakHours[0]);

    const hasData = !!analyticsData;

    // Initial loading state handled by inline skeletons below

    if (!loading && !hasData) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
                    <p className="text-gray-600">No data available for the selected period.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-600">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Filters</span>
                    </div>

                    <div className="w-px h-8 bg-gray-200" />

                    <div className="flex items-center gap-2">
                        {(['today', 'week', 'month', 'year'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePeriodChange(p)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.period === p
                                    ? 'text-white shadow-md transform scale-105'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                style={{ backgroundColor: filters.period === p ? primaryColor : 'transparent' }}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <EmptyState
                    icon={AlertCircle}
                    title="No Analytics Data"
                    description="We couldn't find any data for the selected period. Try selecting a different time range or start selling to see insights here!"
                    action={{
                        label: "Refresh Data",
                        onClick: () => dispatch(fetchAnalyticsDataRequest(filters))
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
                    <p className="text-gray-600">
                        Comprehensive insights and performance metrics for {user?.name}'s restaurant.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
                    {(['today', 'week', 'month', 'year'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => handlePeriodChange(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.period === p
                                ? 'text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            style={{ backgroundColor: filters.period === p ? primaryColor : 'transparent' }}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* 🔸 1. KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(loading && !analyticsData) ? (
                    <>
                        <AnalyticsKPISkeleton />
                        <AnalyticsKPISkeleton />
                        <AnalyticsKPISkeleton />
                    </>
                ) : (
                    <>

                        {/* Sales Overview Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Sales</p>
                                    <p className="text-[10px] text-gray-400 capitalize">{filters.period}</p>
                                </div>
                                <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                                    <DollarSign className="w-5 h-5 text-gray-600" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        NZD {(analyticsData?.salesOverview?.totalRevenue || 0).toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                                            <TrendingUp className={`w-3 h-3 ${(analyticsData?.salesOverview?.trendPercent || 0) < 0 ? 'rotate-180' : ''}`} />
                                            <span>{Math.abs(analyticsData?.salesOverview?.trendPercent || 0)}%</span>
                                        </div>
                                        <span className="text-xs text-gray-400">vs previous {filters.period}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Selling Items List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-900">Top Performers</h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{analyticsData?.topSellingItems?.length || 0} items</span>
                            </div>
                            <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {(analyticsData?.topSellingItems || []).map((item, index) => (
                                    <div key={index} className="flex items-center justify-between group">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">{item.name}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 pl-3.5">{item.quantity} sold</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                {(item.revenue / 1000).toFixed(1)}k
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!analyticsData?.topSellingItems || analyticsData.topSellingItems.length === 0) && (
                                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                                        No sales data yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Peak Hours Analytics */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Busiest Hour</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Based on order volume</p>
                                </div>
                                <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
                                    <Clock className="w-5 h-5 text-gray-600" />
                                </div>
                            </div>

                            {peakHour ? (
                                <div className="space-y-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-gray-900">{peakHour.time}</span>
                                        <span className="text-sm text-gray-500">Peak time</span>
                                    </div>

                                    <div className="h-32 flex items-end gap-1">
                                        {(analyticsData?.peakHours || []).map((item, i) => {
                                            const maxVal = Math.max(...(analyticsData?.peakHours || []).map(d => d.orders), 1);
                                            const heightPercent = (item.orders / maxVal) * 100;
                                            const isPeak = item.orders === peakHour.orders;

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex-1 rounded-t-md transition-all duration-500 hover:opacity-80 relative group"
                                                    style={{
                                                        height: `${Math.max(heightPercent, 10)}%`,
                                                        backgroundColor: isPeak ? primaryColor : '#e5e7eb'
                                                    }}
                                                >
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 p-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                        {item.time}: {item.orders}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs text-center text-gray-400">Daily Timeline</div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                                    Not enough data
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* 📊 Middle Section – Major Charts */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                    Detailed Analytics
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(loading && !analyticsData) ? (
                        <>
                            <ChartSkeleton height={300} />
                            <ChartSkeleton height={300} />
                            <ChartSkeleton height={300} />
                            <ChartSkeleton height={300} />
                        </>
                    ) : (
                        <>
                            {/* Sales Trend */}
                            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <LineChart
                                    title="Revenue Trend"
                                    data={(analyticsData?.peakHours || []).map((item) => ({
                                        label: item.time,
                                        value: item.revenue,
                                    }))}
                                    valuePrefix="NZD "
                                    height={300}
                                    color={primaryColor}
                                />
                            </div>

                            {/* Category Orders */}
                            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                {(!analyticsData?.ordersByCategory || analyticsData.ordersByCategory.length === 0) ? (
                                    <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                                        <div className="p-3 bg-gray-50 rounded-full mb-3">
                                            <PieChartIcon className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-900">No Category Data</h3>
                                        <p className="text-xs text-gray-500 mt-1">Sales by category will appear here</p>
                                    </div>
                                ) : (
                                    <BarChart
                                        title="Category Performance"
                                        data={(analyticsData?.ordersByCategory || []).map((item) => ({
                                            label: item.category,
                                            value: item.count,
                                        }))}
                                        height={300}
                                        color={primaryColor}
                                    />
                                )}
                            </div>

                            {/* Payment Breakdown */}
                            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                {(!analyticsData?.paymentMethods || analyticsData.paymentMethods.length === 0) ? (
                                    <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                                        <div className="p-3 bg-gray-50 rounded-full mb-3">
                                            <DollarSign className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <h3 className="text-sm font-medium text-gray-900">No Payment Data</h3>
                                        <p className="text-xs text-gray-500 mt-1">Payment methods distribution will appear here</p>
                                    </div>
                                ) : (
                                    <PieChart
                                        title="Payment Methods"
                                        data={(analyticsData?.paymentMethods || []).map((item) => ({
                                            label: item.method,
                                            value: item.amount,
                                            color: validatePaymentColor(item.method),
                                            percentage: item.percentage,
                                            subLabel: `${item.count} orders`
                                        }))}
                                        height={300}
                                        valuePrefix="NZD "
                                    />
                                )}
                            </div>

                            {/* Top 10 Foods Trend */}
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
                        </>
                    )}
                </div>

                {/* 📋 Bottom Section – Peak Hours Data */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                        Peak Hours Data
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time Slot</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items Sold</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {(loading && !analyticsData) ? (
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><Skeleton width="60%" height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width="40%" height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width="50%" height={20} /></td>
                                                <td className="px-6 py-4 text-right"><Skeleton width="30%" height={20} className="ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <>
                                            {(analyticsData?.peakHours || []).map((row, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {row.time}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                                            {row.orders}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {row.items}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                                        NZD {row.revenue.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!analyticsData?.peakHours || analyticsData.peakHours.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <CalendarIcon className="w-8 h-8 text-gray-300" />
                                                            <p>No peak hour data available for this period</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
