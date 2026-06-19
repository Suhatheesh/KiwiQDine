import { Download, TrendingUp } from 'lucide-react';
import { Button } from '../components/Button';
import { BarChart } from '../components/BarChart';
import { DataTable } from '../components/DataTable';

export const Reports = () => {

  /* TODO :: NEED TO APPLY ACTUAL VALUES THAT COMMING FROM APIs */

  const revenueByRestaurant: { label: string; value: number; }[] = [];

  const ordersByRestaurant: { label: string; value: number; }[] = [];

  const exportReport = (type: string) => {
    alert(`Exporting ${type} report...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and data exports</p>
        </div>
        <Button onClick={() => exportReport('all')}>
          <Download className="w-4 h-4 mr-2" />
          Export All Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Revenue by Restaurant"
          data={revenueByRestaurant}
          valuePrefix="NZD"
          height={300}
        />
        <BarChart
          title="Orders by Restaurant"
          data={ordersByRestaurant}
          height={300}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Revenue Summary</h2>
          <Button size="sm" variant="secondary" onClick={() => exportReport('revenue')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <DataTable
          data={[].map((restaurant: any) => {
            const orders = [];
            const revenue = 0;
            const orderRevenue = 0;

            return {
              restaurant,
              subscriptionRevenue: revenue,
              orderRevenue,
              totalRevenue: revenue + orderRevenue,
              orderCount: orders.length,
            };
          })}
          columns={[
            {
              key: 'restaurant',
              label: 'Restaurant',
              render: (item) => (
                <div className="flex items-center gap-3">
                  <img
                    src={item.restaurant.logo_url || ''}
                    alt={item.restaurant.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{item.restaurant.name}</div>
                    <div className="text-xs text-gray-500">{item.restaurant.city}</div>
                  </div>
                </div>
              ),
            },
            {
              key: 'subscriptionRevenue',
              label: 'Subscription Revenue',
              render: (item) => (
                <span className="font-semibold text-gray-900">
                  ${item.subscriptionRevenue.toFixed(2)}
                </span>
              ),
            },
            {
              key: 'orderRevenue',
              label: 'Order Revenue',
              render: (item) => (
                <span className="font-semibold text-gray-900">
                  ${item.orderRevenue.toFixed(2)}
                </span>
              ),
            },
            {
              key: 'totalRevenue',
              label: 'Total Revenue',
              render: (item) => (
                <span className="font-bold text-green-700">
                  ${item.totalRevenue.toFixed(2)}
                </span>
              ),
            },
            {
              key: 'orderCount',
              label: 'Total Orders',
              render: (item) => (
                <span className="text-gray-900">{item.orderCount}</span>
              ),
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Subscription Reports</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-2">
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportReport('subscriptions')}
            >
              <Download className="w-4 h-4 mr-2" />
              Active Subscriptions
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportReport('subscription-revenue')}
            >
              <Download className="w-4 h-4 mr-2" />
              Revenue by Plan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportReport('churn')}
            >
              <Download className="w-4 h-4 mr-2" />
              Churn Analysis
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Invoice Reports</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-2">
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportReport('invoices')}
            >
              <Download className="w-4 h-4 mr-2" />
              All Invoices
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportReport('overdue')}
            >
              <Download className="w-4 h-4 mr-2" />
              Overdue Invoices
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportReport('payment-history')}
            >
              <Download className="w-4 h-4 mr-2" />
              Payment History
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Operations Reports</h3>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <div className="space-y-2">
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportReport('orders')}
            >
              <Download className="w-4 h-4 mr-2" />
              Order Analytics
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportReport('menu-items')}
            >
              <Download className="w-4 h-4 mr-2" />
              Popular Menu Items
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportReport('users')}
            >
              <Download className="w-4 h-4 mr-2" />
              User Activity
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
