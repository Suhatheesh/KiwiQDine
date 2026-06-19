import { useLayoutEffect, useState, useCallback, useEffect } from 'react';
import { Search, Download, Eye, Filter, X } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../app/store';
import { fetchInvoices, fetchInvoiceSummary, increaseLimit, pagination } from '../features/invoices/invoiceSlice';
import { Invoice, InvoiceRequest } from '../features/invoices/types';
import { Modal } from '../components/Modal';
import { InvoiceTemplate } from '../components/InvoiceTemplate';
import { Button } from '../components/Button';

export const Invoices = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const [filters, setFilters] = useState<InvoiceRequest | null>(null);

  const { invoices, summary } = useSelector((state: RootState) => state.invoice);

  const fetchInvoicesData = useCallback((params = {}) => {
    dispatch(fetchInvoices({
      limit: Number(invoices.limit),
      page: Number(invoices.page),
      ...params
    }));
  }, [dispatch, invoices.limit, invoices.page, filters]);

  useEffect(() => {
    dispatch(fetchInvoiceSummary())
  }, [dispatch])

  useLayoutEffect(() => {
    fetchInvoicesData({
      search: searchTerm.length > 0 ? searchTerm : undefined,
      ...filters,
      minAmount: filters?.minAmount ? Number(filters.minAmount) : undefined,
      maxAmount: filters?.maxAmount ? Number(filters.maxAmount) : undefined,
      minWalletBalance: filters?.minWalletBalance ? Number(filters.minWalletBalance) : undefined,
      maxWalletBalance: filters?.maxWalletBalance ? Number(filters.maxWalletBalance) : undefined,
    });
  }, [fetchInvoicesData, searchTerm, filters]);

  useEffect(() => {
    if (isPrinting && selectedInvoice) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrinting, selectedInvoice]);

  const handleApplyFilters = () => {
    fetchInvoicesData();
  };

  const handleClearFilters = () => {
    setFilters(null);
    setSearchTerm('');
  };

  const handleInputChange = (field: string, value?: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePage = (_event: unknown, page: number) => {
    dispatch(pagination(String(page)))
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    dispatch(increaseLimit(event.target.value))
  }

  const totalRevenue = summary.totalRevenue;
  const pendingAmount = summary.pending;
  const overdueAmount = summary.overdue;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Management</h1>
          <p className="text-gray-600">Track and manage subscription invoices</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Revenue</span>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">NZD {totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">From paid invoices</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Pending</span>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">NZD {pendingAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Overdue</span>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">NZD {overdueAmount.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Requires attention</p>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Filter Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <p className="text-sm text-gray-500">Refine your search results</p>
              </div>
            </div>
            {(searchTerm || filters?.status || filters?.district || filters?.city || filters?.planCode || filters?.billingPeriod || filters?.minAmount || filters?.maxAmount) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium text-sm group"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
              />
            </div>

            {/* Status Select */}
            <div className="relative">
              <select
                value={filters?.status}
                onChange={(e) => handleInputChange('status', e.target.value === "" ? undefined : e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Plan Tier Filter */}
            <div className="relative">
              <select
                value={filters?.planCode}
                onChange={(e) => handleInputChange('planCode', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm appearance-none cursor-pointer"
              >
                <option value="">All Plan Tiers</option>
                <option value="basic">Basic Plan</option>
                <option value="pro">Pro Plan</option>
                <option value="enterprise">Enterprise Plan</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Date Filters */}
            <div className="relative">
              <input
                type="date"
                value={filters?.fromDate}
                onChange={(e) => handleInputChange('fromDate', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
              />
            </div>
            <div className="relative">
              <input
                type="date"
                value={filters?.toDate}
                onChange={(e) => handleInputChange('toDate', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
              />
            </div>

            {/* Amount Filters */}
            <div className="relative">
              <input
                type="number"
                placeholder="Min Amount"
                value={filters?.minAmount}
                onChange={(e) => handleInputChange('minAmount', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
              />
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Max Amount"
                value={filters?.maxAmount}
                onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={invoices.data}
        total={invoices.total}
        page={invoices.page}
        limit={invoices.limit}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
        columns={[
          {
            key: 'invoice_number',
            label: 'Invoice #',
            render: (invoice: Invoice) => (
              <span className="font-mono text-sm font-medium">{invoice.invoiceName}</span>
            ),
          },
          {
            key: 'restaurant_id',
            label: 'Restaurant',
            render: (invoice: Invoice) => {
              return (
                <div className="flex flex-col">
                  {/* Assuming restaurant data is populated, if not, fallback to ID */}
                  <span className="font-medium text-gray-900">{invoice.restaurantName || invoice.restaurantId}</span>
                  {invoice.restaurantName && <span className="text-xs text-gray-500">{invoice.restaurantId}</span>}
                </div>
              );
            },
          },
          {
            key: 'issue_date',
            label: 'Issue Date',
            render: (invoice: Invoice) => (
              <span className="text-sm text-gray-600">
                {new Date(invoice.created_at).toLocaleDateString()}
              </span>
            ),
          },
          {
            key: 'due_date',
            label: 'Due Date',
            render: (invoice: Invoice) => (
              <span className="text-sm text-gray-600">
                {new Date(invoice.due_date).toLocaleDateString()}
              </span>
            ),
          },
          {
            key: 'total',
            label: 'Amount',
            render: (invoice: Invoice) => (
              <div>
                <div className="font-semibold text-gray-900">NZD {invoice.amount?.toLocaleString()}</div>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (invoice: Invoice) => <StatusBadge status={invoice.status} type="invoice" />,
          },
          {
            key: 'actions',
            label: 'Actions',
            width: '100px',
            render: (invoice: Invoice) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setIsPreviewOpen(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Preview Invoice"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setIsPrinting(true);
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download Invoice"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Invoice Preview"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsPrinting(true);
              }}
            >
              Download PDF
            </Button>
          </div>
        }
      >
        {selectedInvoice && <InvoiceTemplate invoice={selectedInvoice} />}
      </Modal>

      {/* Hidden Print Container for direct downloads */}
      {isPrinting && !isPreviewOpen && (
        <div className="hidden print:block">
          {selectedInvoice && <InvoiceTemplate invoice={selectedInvoice} />}
        </div>
      )}
    </div>
  );
};
