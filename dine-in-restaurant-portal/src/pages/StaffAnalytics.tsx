import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Clock, Award, BarChart3, Calendar, Target, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../app/store';
import { setSelectedMonth, fetchPerformanceReviewRequest, fetchEfficiencyComparisonRequest } from '../features/staff/staffSlice';

export const StaffAnalytics = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { selectedMonth, performanceReview, efficiencyComparison, isLoading } = useSelector((state: RootState) => state.staff);

    const [activeTab, setActiveTab] = useState<'performance' | 'efficiency' | 'attendance' | 'peak'>('performance');

    // Calculate date range for last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch data on mount and when dependencies change
    useEffect(() => {
        if (user?.restaurant?.id) {
            dispatch(fetchPerformanceReviewRequest({
                restaurantId: user.restaurant.id,
                year: selectedMonth.year,
                month: selectedMonth.month,
            }));
        }
    }, [dispatch, user?.restaurant?.id, selectedMonth]);

    useEffect(() => {
        if (user?.restaurant?.id && activeTab === 'efficiency') {
            dispatch(fetchEfficiencyComparisonRequest({
                restaurantId: user.restaurant.id,
                startDate,
                endDate,
            }));
        }
    }, [dispatch, user?.restaurant?.id, activeTab, startDate, endDate]);

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [year, month] = e.target.value.split('-');
        dispatch(setSelectedMonth({ year: parseInt(year), month: parseInt(month) }));
    };

    const currentMonthValue = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;

    // Get medal emoji for rankings
    const getMedalEmoji = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `${index + 1}.`;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                            <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        Staff Analytics & Performance
                    </h1>
                    <p className="text-gray-500 mt-1">Track team performance, efficiency, and productivity metrics</p>
                </div>
                <button
                    onClick={() => navigate('/users')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                    <Users className="w-4 h-4" />
                    View All Staff
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1">
                <button
                    onClick={() => setActiveTab('performance')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'performance'
                        ? 'bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Award className="w-4 h-4" />
                    Performance Review
                </button>
                <button
                    onClick={() => setActiveTab('efficiency')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'efficiency'
                        ? 'bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Zap className="w-4 h-4" />
                    Efficiency Comparison
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'attendance'
                        ? 'bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Attendance Tracking
                </button>
                <button
                    onClick={() => setActiveTab('peak')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'peak'
                        ? 'bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Target className="w-4 h-4" />
                    Peak Hours
                </button>
            </div>

            {/* Performance Review Tab */}
            {activeTab === 'performance' && (
                <div className="space-y-6">
                    {/* Month Selector */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-4">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <label className="text-sm font-medium text-gray-700">Select Month</label>
                            <input
                                type="month"
                                value={currentMonthValue}
                                onChange={handleMonthChange}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading performance data...</p>
                        </div>
                    ) : performanceReview && performanceReview.staffPerformance.length > 0 ? (
                        <>
                            {/* Top Performer Card */}
                            <div className="bg-linear-to-br from-yellow-50 via-orange-50 to-red-50 rounded-xl shadow-lg border-2 border-yellow-300 p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-200 rounded-full -ml-12 -mb-12 opacity-20"></div>
                                <div className="relative flex items-center gap-4">
                                    <div className="p-4 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg">
                                        <Award className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-4xl">🏆</span>
                                            <h3 className="text-lg font-bold text-gray-900">Top Performer</h3>
                                        </div>
                                        <p className="text-sm text-gray-600">{performanceReview.period.monthName} {performanceReview.period.year}</p>
                                        <p className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-br from-yellow-600 to-orange-600 mt-2">
                                            {performanceReview.topPerformer.name}
                                        </p>
                                        <div className="flex gap-4 mt-3">
                                            <div className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                                                <p className="text-xs text-gray-600">Orders Handled</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {performanceReview.staffPerformance.find((s: any) => s.staffId === performanceReview.topPerformer.staffId)?.metrics.ordersHandled || 0}
                                                </p>
                                            </div>
                                            <div className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                                                <p className="text-xs text-gray-600">Orders Served</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {performanceReview.staffPerformance.find((s: any) => s.staffId === performanceReview.topPerformer.staffId)?.metrics.ordersServed || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Rankings */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 bg-linear-to-br from-blue-50 to-indigo-50">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        Performance Rankings
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Staff ranked by total orders handled</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmed</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Served</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payments</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {performanceReview.staffPerformance.map((staff: any, index: number) => {
                                                const maxOrders = performanceReview.staffPerformance[0]?.metrics.ordersHandled || 1;
                                                const percentage = (staff.metrics.ordersHandled / maxOrders) * 100;

                                                return (
                                                    <tr
                                                        key={staff.staffId}
                                                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                                                        onClick={() => navigate(`/staff/${staff.staffId}`)}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${index === 0 ? 'bg-linear-to-br from-yellow-100 to-yellow-200 text-yellow-700' :
                                                                index === 1 ? 'bg-linear-to-br from-gray-100 to-gray-200 text-gray-700' :
                                                                    index === 2 ? 'bg-linear-to-br from-orange-100 to-orange-200 text-orange-700' :
                                                                        'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                {getMedalEmoji(index)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="font-semibold text-gray-900">{staff.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded capitalize">
                                                                {staff.role.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <span className="font-bold text-gray-900 text-lg">
                                                                {staff.metrics.ordersHandled}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                                                            {staff.metrics.ordersConfirmed}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                                                            {staff.metrics.ordersServed}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                                                            {staff.metrics.paymentsProcessed}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${percentage >= 80 ? 'bg-linear-to-br from-green-500 to-emerald-500' :
                                                                            percentage >= 60 ? 'bg-linear-to-br from-blue-500 to-indigo-500' :
                                                                                percentage >= 40 ? 'bg-linear-to-br from-yellow-500 to-orange-500' :
                                                                                    'bg-linear-to-br from-red-500 to-pink-500'
                                                                            }`}
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                                <span className="font-semibold text-gray-900 w-12 text-right">
                                                                    {percentage.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200">
                            <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">No performance data available</p>
                            <p className="text-gray-400 text-sm mt-2">Performance data will appear here once staff members start handling orders</p>
                        </div>
                    )}
                </div>
            )}

            {/* Efficiency Comparison Tab */}
            {activeTab === 'efficiency' && (
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading efficiency data...</p>
                        </div>
                    ) : efficiencyComparison && efficiencyComparison.staffComparison.length > 0 ? (
                        <>
                            {/* Most Efficient Card */}
                            <div className="bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl shadow-lg border-2 border-green-300 p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
                                <div className="relative flex items-center gap-4">
                                    <div className="p-4 bg-linear-to-br from-green-400 to-emerald-500 rounded-full shadow-lg">
                                        <Zap className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-4xl">⚡</span>
                                            <h3 className="text-lg font-bold text-gray-900">Most Efficient Staff</h3>
                                        </div>
                                        <p className="text-sm text-gray-600">Highest efficiency score</p>
                                        <p className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-br from-green-600 to-emerald-600 mt-2">
                                            {efficiencyComparison.mostEfficient.name}
                                        </p>
                                        <div className="flex gap-4 mt-3">
                                            <div className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                                                <p className="text-xs text-gray-600">Efficiency Score</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {efficiencyComparison.staffComparison.find((s: any) => s.staffId === efficiencyComparison.mostEfficient.staffId)?.metrics.efficiencyScore || 0}%
                                                </p>
                                            </div>
                                            <div className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                                                <p className="text-xs text-gray-600">Actions/Order</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {efficiencyComparison.staffComparison.find((s: any) => s.staffId === efficiencyComparison.mostEfficient.staffId)?.metrics.actionsPerOrder || 0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Efficiency Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 bg-linear-to-br from-green-50 to-emerald-50">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        Efficiency Comparison
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Lower actions per order = higher efficiency</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders Handled</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions/Order</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {efficiencyComparison.staffComparison.map((staff: any) => {
                                                const score = parseFloat(staff.metrics.efficiencyScore);
                                                return (
                                                    <tr
                                                        key={staff.staffId}
                                                        className="hover:bg-green-50 transition-colors cursor-pointer"
                                                        onClick={() => navigate(`/staff/${staff.staffId}`)}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                                            {staff.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded capitalize">
                                                                {staff.role?.replace('_', ' ') || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 font-medium">
                                                            {staff.metrics.ordersHandled}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 font-medium">
                                                            {staff.metrics.actionsPerOrder}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${score >= 80 ? 'bg-linear-to-br from-green-500 to-emerald-500' :
                                                                            score >= 60 ? 'bg-linear-to-br from-blue-500 to-indigo-500' :
                                                                                score >= 40 ? 'bg-linear-to-br from-yellow-500 to-orange-500' :
                                                                                    'bg-linear-to-br from-red-500 to-pink-500'
                                                                            }`}
                                                                        style={{ width: `${score}%` }}
                                                                    />
                                                                </div>
                                                                <span className={`font-bold w-14 text-right ${score >= 80 ? 'text-green-600' :
                                                                    score >= 60 ? 'text-blue-600' :
                                                                        score >= 40 ? 'text-yellow-600' :
                                                                            'text-red-600'
                                                                    }`}>
                                                                    {score.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200">
                            <Zap className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-medium">No efficiency data available</p>
                            <p className="text-gray-400 text-sm mt-2">Efficiency metrics will be calculated once staff members complete orders</p>
                        </div>
                    )}
                </div>
            )}

            {/* Attendance & Peak Hours - Enhanced Placeholder */}
            {(activeTab === 'attendance' || activeTab === 'peak') && (
                <div className="text-center py-16 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-dashed border-blue-200">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        {activeTab === 'attendance' ? (
                            <Clock className="w-10 h-10 text-blue-600" />
                        ) : (
                            <Target className="w-10 h-10 text-blue-600" />
                        )}
                    </div>
                    <p className="text-gray-700 text-xl font-bold">
                        {activeTab === 'attendance' ? 'Attendance Tracking' : 'Peak Hour Analysis'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                        {activeTab === 'attendance'
                            ? 'Track login/logout sessions, hours worked, and attendance rates for accurate payroll'
                            : 'Analyze busiest hours and get staffing recommendations to optimize shift schedules'
                        }
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Coming Soon</span>
                    </div>
                </div>
            )}
        </div>
    );
};
