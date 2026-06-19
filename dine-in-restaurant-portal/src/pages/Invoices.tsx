
import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { CreditCard, Calendar, TrendingUp, Clock, Download, Eye, FileText } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { DataTable } from '../components/DataTable';
import { useNavigate } from 'react-router-dom';
import { RouteLinks } from '../routers/type';
import { CurrentPlanResponseDto } from '../features/restaurants/types';
import { useAuth } from '../hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { fetchSubscriptionOrderUsageRequest, fetchSubscriptionSummaryRequest } from '../features/subscriptions/subscriptionsSlice';

export const Invoices = () => {
  const { user } = useAuth();

  const dispatch = useDispatch<AppDispatch>();

  const { invoices, subscriptionOrderUsage } = useSelector((state: RootState) => state.subscription);

  const [currentPlan, setCurrentPlan] = useState<CurrentPlanResponseDto | null>(null);

  // Private methods for PDF actions
  const handleViewPdf = (pdfUrl?: string) => {
    console.log(pdfUrl);
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      console.log("Opened PDF URL:", pdfUrl);
    }
  };

  const handleDownloadPdf = async (pdfUrl?: string, invoiceName?: string) => {
    if (pdfUrl) {
      try {
        const response = await fetch(pdfUrl, { mode: 'cors' });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = invoiceName ? `${invoiceName}.pdf` : 'invoice.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        window.open(pdfUrl, '_blank'); // fallback
      }
    }
  };

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const res = await axiosClient.get(`/api/subscription/restaurants/${user?.restaurant?.id}/active-subscription`);
        setCurrentPlan(res.data?.plan || null);
        console.log(currentPlan)
      } catch (err: any) {
        console.error('Failed to load current plan');
      }
    };
    fetchCurrentPlan();
  }, []);

  useEffect(() => {
    if (user?.restaurant?.id) {
      dispatch(fetchSubscriptionOrderUsageRequest(user?.restaurant?.id));
      dispatch(fetchSubscriptionSummaryRequest(user?.restaurant?.id));
    }
  }, [user, dispatch]);

  const navigate = useNavigate();

  const handleChangePlan = () => {
    if (currentPlan) {
      navigate(`${RouteLinks.INVOICES}${RouteLinks.SUBSCRIPTIONS}`, {
        state: { currentPlanId: currentPlan.id }
      });
    } else {
      navigate(`${RouteLinks.INVOICES}${RouteLinks.SUBSCRIPTIONS}`);
    }
  }

  return (
    <div className="space-y-8 p-2 min-h-screen bg-gray-50/30">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Overdue Invoices Amount</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">USD {subscriptionOrderUsage?.overageInvoiceCost}</p>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Overdue Table Amount</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">USD {subscriptionOrderUsage?.overageTableCost}</p>
        </div>

        {/* This Year */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Overdue User Amount</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">USD {subscriptionOrderUsage?.overageUserCost}</p>
        </div>

        {/* Next Bill Date */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Next Bill Date</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{subscriptionOrderUsage?.billingDate}</p>
        </div>
      </div>

      {/* Current Subscription */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Current Subscription</h2>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{currentPlan?.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{currentPlan?.description}</p>
            <div className="flex flex-wrap gap-2">
              {currentPlan?.features.map((feature: string, index: number) => (
                <span key={index} className="text-xs text-gray-600">
                  • {feature}
                  {index < currentPlan?.features.length - 1 && ''}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right ml-6">
            <div className="mb-2">
              <span className="text-3xl font-bold text-gray-900">USD {currentPlan?.priceMonthly}</span>
              <span className="text-gray-600 text-sm ml-1">per month</span>
            </div>
            <Button onClick={handleChangePlan} variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
              Change Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Billing History</h2>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>

        {/* Table */}
        <DataTable data={invoices} columns={[
          {
            key: 'billing_period',
            label: 'BILLING PERIOD',
            render: (bill) => (
              <span className="font-mono text-sm font-medium">{bill.billing_period ?? 'N/A'}</span>
            ),
          },
          {
            key: 'plan',
            label: 'PLAN',
            render: (bill) => (
              <span className="font-mono text-sm font-medium">{bill.plan ?? 'N/A'}</span>
            ),
          },
          {
            key: 'amount',
            label: 'AMOUNT',
            width: '19.5%',
            render: (bill) => (
              <div>
                <div className="text-sm font-semibold text-gray-900">USD {bill.amount.toFixed(2)}</div>
                <div className="text-xs text-gray-500">
                  Base: USD {bill.base_amount.toFixed(2)} + Fees: USD {bill.fees.toFixed(2)}
                </div>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'STATUS',
            render: (bill) => (
              <StatusBadge status={bill.status} type="invoice" />
            ),
          },
          {
            key: 'due_date',
            label: 'DUE DATE',
            render: (bill) => (
              <div>
                <div className="text-sm text-gray-700">{bill.due_date}</div>
                {bill.paid_date && (
                  <div className="text-xs text-gray-500">Paid: {bill.paid_date}</div>
                )}
              </div>
            ),
          },
          {
            key: 'actions',
            label: 'ACTIONS',
            width: '19.5%',
            render: (bill) => (
              <div className="flex items-center gap-2">
                {bill.invoiceAttachmentUrl && (
                  <>
                    {/* View PDF */}
                    <button
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => handleViewPdf(bill.invoiceAttachmentUrl)}
                      title="View Invoice PDF"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {/* Download PDF */}
                    <button
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      onClick={() => handleDownloadPdf(bill.invoiceAttachmentUrl, bill.invoiceName)}
                      title="Download Invoice PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                )}
                {bill.status === 'pending' && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white ml-2">
                    Pay Now
                  </Button>
                )}
              </div>
            ),
          },
        ]} />
      </div>
    </div>
  );
};
