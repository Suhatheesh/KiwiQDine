import { Store, DollarSign, RefreshCw, Calendar, Users, PieChart as PieChartIcon, Building2, CreditCard } from 'lucide-react';
import {
  AreaChart,
  Area,
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
import { KPICard } from '../components/KPICard';
import { useAuth } from '../hooks/useAuth';
import { useLayoutEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardAnalyticsRequest } from '../features/analytics/analyticsSlice';
import { PeriodType } from '../features/analytics/types';
import { RootState } from '../app/store';
import { periodOptions } from '../utils/constants';
import { DashboardSkeleton } from '../components/CustomSkeleton';

const CHART_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
];

const PLAN_COLORS: Record<string, string> = {
  'Basic': '#94a3b8',
  'Pro': '#6366f1',
  'Premium': '#8b5cf6',
  'Gold': '#f59e0b',
};

export const Dashboard = () => {
  const { user } = useAuth();

  const dispatch = useDispatch();

  const [period, setPeriod] = useState<PeriodType>('today');

  const { dashboardAnalytics, loading } = useSelector((state: RootState) => state.analytics);

  useLayoutEffect(() => {
    dispatch(fetchDashboardAnalyticsRequest({ period }));
  }, [period]);

  const handleRefresh = () => {
    dispatch(fetchDashboardAnalyticsRequest({ period }));
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-48 w-48 rounded-full bg-blue-400 opacity-20 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="flex md:flex-row flex-col gap-2 text-4xl font-extrabold tracking-tight mb-2 md:items-center items-start">
              Dashboard
              <span className="text-xs font-bold uppercase tracking-widest bg-white bg-opacity-20 px-3 py-1 rounded-full backdrop-blur-md border border-white border-opacity-20 translate-y-[-4px]">
                SuperAdmin
              </span>
            </h1>
            <p className="text-blue-100 text-lg font-medium opacity-90 max-w-xl">
              Welcome back, <span className="text-white font-bold">{user?.name}</span>. Here's your platform's performance at a glance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Period Filter with Glassmorphism */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-20 rounded-2xl shadow-lg transition-all hover:bg-opacity-30">
              <Calendar className="w-5 h-5 text-white" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                className="text-sm font-bold text-white bg-transparent border-none outline-none cursor-pointer focus:ring-0"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value} className="text-gray-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-3 rounded-2xl bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-20 hover:bg-opacity-30 transition-all duration-300 shadow-lg group disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Subscription Revenue"
          value={`NZD ${dashboardAnalytics?.subscriptionRevenueResponse?.summary?.totalRevenue?.toLocaleString() || '0'}`}
          change={dashboardAnalytics?.subscriptionRevenueResponse?.summary?.revenueGrowth}
          trend={(dashboardAnalytics?.subscriptionRevenueResponse?.summary?.revenueGrowth ?? 0) >= 0 ? 'up' : 'down'}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <KPICard
          title="Active Tenants"
          value={dashboardAnalytics?.platformGrowthResponse?.summary?.totalSubscriptions?.toLocaleString() || '0'}
          change={dashboardAnalytics?.platformGrowthResponse?.summary?.subscriptionsGrowth}
          trend={(dashboardAnalytics?.platformGrowthResponse?.summary?.subscriptionsGrowth ?? 0) >= 0 ? 'up' : 'down'}
          icon={Building2}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <KPICard
          title="Active Restaurants"
          value={dashboardAnalytics?.platformGrowthResponse?.summary?.totalRestaurants?.toLocaleString() || '0'}
          change={dashboardAnalytics?.platformGrowthResponse?.summary?.restaurantsGrowth}
          trend={(dashboardAnalytics?.platformGrowthResponse?.summary?.restaurantsGrowth ?? 0) >= 0 ? 'up' : 'down'}
          icon={Store}
          gradient="bg-gradient-to-br from-orange-500 to-amber-600"
        />
        <KPICard
          title="Total Users"
          value={dashboardAnalytics?.userGrowthResponse?.summary?.totalUsers?.toLocaleString() || '0'}
          change={dashboardAnalytics?.userGrowthResponse?.summary?.usersGrowth}
          trend={(dashboardAnalytics?.userGrowthResponse?.summary?.usersGrowth ?? 0) >= 0 ? 'up' : 'down'}
          icon={Users}
          gradient="bg-gradient-to-br from-purple-500 to-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend - Area Chart */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Revenue Trends</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium italic">Growth in subscription revenue</p>
            </div>
            <div className="p-3 bg-green-50 rounded-2xl shadow-inner group transition-transform hover:scale-110">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dashboardAnalytics?.subscriptionRevenueResponse?.trends || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="period" stroke="#9ca3af" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(value) => `NZD ${value / 1000}k`} dx={-10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue (NZD)"
                animationDuration={1500}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Growth - Area Chart */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Platform Growth</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium italic">Tenants vs Restaurants growth</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl shadow-inner group transition-transform hover:scale-110">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320} className='select-none'>
            <AreaChart data={dashboardAnalytics?.platformGrowthResponse?.trends || []}>
              <defs>
                <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRestaurants" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="period" stroke="#9ca3af" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorTenants)"
                name="Revenue (NZD)"
                animationDuration={1500}
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#f59e0b"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorRestaurants)"
                name="Orders"
                animationDuration={1500}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth - Area Chart */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">User Growth</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium italic">New users onboarded over time</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-2xl shadow-inner group transition-transform hover:scale-110">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dashboardAnalytics?.userGrowthResponse?.trends || []}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="period" stroke="#9ca3af" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="newUsers"
                stroke="#6366f1"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorUsers)"
                name="New Users"
                animationDuration={1500}
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Distribution - Area Chart */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Revenue by Plan</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium italic">Distribution across subscription tiers</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-2xl shadow-inner group transition-transform hover:scale-110">
              <PieChartIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={dashboardAnalytics?.revenueByPlanResponse?.planBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="revenue"
                  nameKey="planName"
                  stroke="none"
                  animationDuration={1500}
                >
                  {dashboardAnalytics?.revenueByPlanResponse?.planBreakdown?.map((entry: { planName: string | number; }, index: number) => (
                    <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.planName] || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`NZD ${value?.toLocaleString() || '0'}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Information */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mb-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</p>
              <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                NZD {Math.round(dashboardAnalytics?.subscriptionRevenueResponse?.summary?.totalRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Billing Cycle Distribution - Pie Chart */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Billing Cycles</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium italic">Monthly vs Yearly distribution</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-2xl shadow-inner group transition-transform hover:scale-110">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={dashboardAnalytics?.revenueByPlanResponse?.billingCycleBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="revenue"
                  nameKey="cycle"
                  stroke="none"
                  animationDuration={1500}
                >
                  {dashboardAnalytics?.revenueByPlanResponse?.billingCycleBreakdown?.map((entry: { cycle: string; }, index: any) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.cycle === 'monthly' ? '#6366f1' : '#10b981'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`NZD ${value?.toLocaleString() || '0'}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Information */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mb-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</p>
              <p className="text-2xl font-black text-gray-900 leading-none mt-1">
                {dashboardAnalytics?.subscriptionRevenueResponse?.summary?.totalSubscriptions || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
