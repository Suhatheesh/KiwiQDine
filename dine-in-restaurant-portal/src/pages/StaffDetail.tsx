import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, ShoppingBag, LogIn, TrendingUp, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../app/store';
import { setDateRange, fetchStaffPerformanceRequest, fetchStaffLogsRequest } from '../features/staff/staffSlice';

export const StaffDetail = () => {
    const { staffId } = useParams<{ staffId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { dateRange, performanceStats, staffLogs, isLoading } = useSelector((state: RootState) => state.staff);

    const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

    // Fetch staff performance on mount and when dependencies change
    useEffect(() => {
        if (staffId && user?.restaurant?.id) {
            dispatch(fetchStaffPerformanceRequest({
                staffId,
                restaurantId: user.restaurant.id,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            }));

            dispatch(fetchStaffLogsRequest({
                staffId,
                restaurantId: user.restaurant.id,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            }));
        }
    }, [dispatch, staffId, user?.restaurant?.id, dateRange]);

    const handlePeriodChange = (days: '7' | '30' | '90') => {
        setPeriod(days);
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        dispatch(setDateRange({ startDate, endDate }));
    };

    const actionColors: Record<string, string> = {
        'login': 'bg-blue-100 text-blue-700',
        'confirmed': 'bg-indigo-100 text-indigo-700',
        'preparing': 'bg-orange-100 text-orange-700',
        'ready': 'bg-amber-100 text-amber-700',
        'served': 'bg-green-100 text-green-700',
        'completed': 'bg-emerald-100 text-emerald-700',
        'cancelled': 'bg-red-100 text-red-700',
        'payment_processed': 'bg-purple-100 text-purple-700',
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds} seconds ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/users')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {performanceStats?.staff.name || 'Staff Performance'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {performanceStats?.staff.email} • {performanceStats?.staff.role.replace('_', ' ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Period Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 mr-4">Period:</span>
                    <div className="flex gap-2">
                        {(['7', '30', '90'] as const).map((days) => (
                            <button
                                key={days}
                                onClick={() => handlePeriodChange(days)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === days
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Last {days} Days
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading performance data...</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards - Always Show */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Activity className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Actions</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {performanceStats?.summary.totalActions || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <ShoppingBag className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Orders Handled</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {performanceStats?.summary.uniqueOrdersHandled || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <LogIn className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Login Sessions</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {performanceStats?.summary.loginSessions || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Breakdown - Always Show */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Action Breakdown
                        </h3>
                        {performanceStats?.actionBreakdown && Object.keys(performanceStats.actionBreakdown).length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(performanceStats.actionBreakdown).map(([action, count]) => (
                                    <div
                                        key={action}
                                        className={`p-4 rounded-lg ${actionColors[action] || 'bg-gray-100 text-gray-700'}`}
                                    >
                                        <p className="text-sm font-medium capitalize">{action.replace('_', ' ')}</p>
                                        <p className="text-2xl font-bold mt-1">{count}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No actions recorded yet</p>
                                <p className="text-gray-400 text-xs mt-1">Actions will appear here once the staff member starts working</p>
                            </div>
                        )}
                    </div>

                    {/* Daily Activity Chart - Always Show */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Daily Activity
                        </h3>
                        {performanceStats?.dailyActivity && Object.keys(performanceStats.dailyActivity).length > 0 ? (
                            <div className="space-y-2">
                                {Object.entries(performanceStats.dailyActivity).slice(-10).map(([date, count]) => {
                                    const maxCount = Math.max(...Object.values(performanceStats.dailyActivity));
                                    const percentage = (Number(count) / maxCount) * 100;
                                    return (
                                        <div key={date} className="flex items-center gap-4">
                                            <span className="text-sm text-gray-600 w-24">{date}</span>
                                            <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 flex items-center justify-end pr-2"
                                                    style={{ width: `${percentage}%` }}
                                                >
                                                    {percentage > 10 && (
                                                        <span className="text-xs font-bold text-white">{count}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {percentage <= 10 && (
                                                <span className="text-xs font-bold text-gray-600 w-8">{count}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No daily activity data available</p>
                                <p className="text-gray-400 text-xs mt-1">Activity will be tracked and displayed here over time</p>
                                {/* Empty state graph visualization */}
                                <div className="mt-6 space-y-2 max-w-md mx-auto">
                                    {[20, 40, 15, 60, 35].map((width, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <span className="text-xs text-gray-300 w-20">Day {idx + 1}</span>
                                            <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                                                <div
                                                    className="h-full bg-gray-200 rounded-lg"
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recent Actions - Always Show */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Actions</h3>
                        {staffLogs && staffLogs.length > 0 ? (
                            <div className="space-y-3">
                                {staffLogs.slice(0, 10).map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-200 text-gray-700'}`}>
                                            {log.action.replace('_', ' ')}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900">
                                                {log.notes || `Performed ${log.action} action`}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTimeAgo(log.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No recent actions</p>
                                <p className="text-gray-400 text-xs mt-1">Recent activities will be displayed here</p>
                                {/* Empty state action items */}
                                <div className="mt-6 space-y-2 max-w-md mx-auto">
                                    {['Login', 'Order Confirmed', 'Order Served'].map((action, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                            <div className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-400">
                                                {action}
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-3 bg-gray-100 rounded w-3/4 mb-2"></div>
                                                <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
