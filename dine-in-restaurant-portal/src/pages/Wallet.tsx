import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ArrowUpRight, CreditCard, DollarSign, Eye, Download, Filter, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { EnhancedDataTable, Column } from '../components/ui/DataTable';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../app/store';
import {
  fetchWalletBalanceRequest,
  fetchRestaurantTransactionsRequest,
  setTransactionFilters,
} from '../features/transactions/transactionsSlice';
import { Transaction, TransactionFilters } from '../features/transactions/types';

// Simplified Attachment Viewer Modal - Only shows the image
const AttachmentViewerModal = ({
  attachmentUrl,
  invoiceId,
  onClose
}: {
  attachmentUrl: string | null;
  invoiceId: string;
  onClose: () => void
}) => {
  if (!attachmentUrl) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Attachment</h3>
          <p className="text-gray-500 mb-6">This transaction doesn't have an attachment</p>
          <Button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative max-w-6xl w-full max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Floating Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Receipt</h3>
              <p className="text-xs text-white/70">{invoiceId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition-all border border-white/30"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-5 h-5 text-white" />
            </a>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition-all border border-white/30"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl mt-16 flex-1 flex items-center justify-center p-4">
          <img
            src={attachmentUrl}
            alt="Transaction Receipt"
            className="max-w-full max-h-[calc(95vh-100px)] object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="flex flex-col items-center justify-center py-16 text-white">
                    <svg class="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="text-lg font-medium mb-2">Unable to preview attachment</p>
                    <a href="${attachmentUrl}" target="_blank" class="text-indigo-400 hover:text-indigo-300 underline text-sm mt-2">Open in new tab</a>
                  </div>
                `;
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Filter Modal Component
const FilterModal = ({
  filters,
  onApply,
  onClose,
}: {
  filters: TransactionFilters;
  onApply: (filters: TransactionFilters) => void;
  onClose: () => void;
}) => {
  const [localFilters, setLocalFilters] = useState<TransactionFilters>(filters);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-bold text-white">Filter Transactions</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={localFilters.status || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value as any || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={localFilters.type || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value as any || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="payout">Payout</option>
              <option value="earned">Earned</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={localFilters.startDate || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={localFilters.endDate || ''}
              onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                setLocalFilters({});
                onApply({});
              }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              Clear
            </Button>
            <Button
              onClick={() => onApply(localFilters)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 rounded-xl font-medium transition-all shadow-lg"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Wallet = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{ url: string | null; invoiceId: string } | null>(null);

  const { transactions, walletBalance, loading, filters } = useSelector(
    (state: RootState) => state.transactions
  );

  // Fetch wallet balance and transactions
  useEffect(() => {
    if (user?.restaurant?.id) {
      dispatch(fetchWalletBalanceRequest(user.restaurant.id));
      dispatch(fetchRestaurantTransactionsRequest({ restaurantId: user.restaurant.id, filters }));
    }
  }, [user?.restaurant?.id, dispatch, filters]);

  // Refresh wallet balance when transactions change (to keep it in sync)
  useEffect(() => {
    if (user?.restaurant?.id && transactions.length > 0) {
      dispatch(fetchWalletBalanceRequest(user.restaurant.id));
    }
  }, [transactions.length, user?.restaurant?.id, dispatch]);

  const handleViewAttachment = (transaction: Transaction) => {
    setSelectedAttachment({
      url: transaction.attachmentUrl || null,
      invoiceId: transaction.invoiceId
    });
    setShowAttachmentModal(true);
  };

  const handleCloseAttachmentModal = () => {
    setShowAttachmentModal(false);
    setSelectedAttachment(null);
  };

  const handleApplyFilters = (newFilters: TransactionFilters) => {
    dispatch(setTransactionFilters(newFilters));
    setShowFilterModal(false);
  };

  // Column configuration for EnhancedDataTable
  const columns: Column<Transaction>[] = useMemo(() => [
    {
      key: 'invoiceId',
      label: 'Invoice ID',
      sortable: true,
      width: '180px',
      render: (txn) => (
        <span className="font-medium text-gray-900">{txn.invoiceId || '-'}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      width: '120px',
      render: (txn) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${txn.type === 'payout'
            ? 'bg-orange-50 text-orange-700 border border-orange-100'
            : txn.type === 'earned'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-blue-50 text-blue-700 border border-blue-100'
          }`}>
          {txn.type}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      width: '160px',
      align: 'right',
      render: (txn) => (
        <span className={`font-bold ${txn.type === 'payout' ? 'text-red-600' : 'text-green-600'}`}>
          {txn.type === 'payout' ? '-' : '+'}NZD {Math.abs(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      width: '140px',
      render: (txn) => (
        <span className="text-gray-500">{txn.date}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (txn) => (
        <span className="text-gray-900">{txn.description}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '140px',
      align: 'center',
      render: (txn) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${txn.status === 'Completed'
            ? 'bg-green-50 text-green-700 border border-green-100'
            : txn.status === 'Pending'
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
              : txn.status === 'Cancelled'
                ? 'bg-gray-50 text-gray-700 border border-gray-100'
                : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
          {txn.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      align: 'center',
      render: (txn) => (
        <Button
          onClick={() => handleViewAttachment(txn)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          View
        </Button>
      ),
    },
  ], []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="w-full flex flex-col">
      <div className="w-full">
        {/* Summary Cards - Enhanced Premium Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
          {/* Current Balance - Premium Gradient Card */}
          <div className="group bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden transform hover:scale-[1.02]">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col flex-1">
                  <p className="text-xs font-semibold text-indigo-100 uppercase tracking-wider mb-2">Current Balance</p>
                  {loading ? (
                    <div className="h-8 w-40 bg-white/20 rounded-lg animate-pulse"></div>
                  ) : (
                    <h3 className="text-3xl font-bold text-white tracking-tight">
                      NZD {walletBalance?.totalBalance !== null && walletBalance?.totalBalance !== undefined ? walletBalance.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </h3>
                  )}
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/30 group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs mt-3">
                <div className="flex items-center px-3 py-1 rounded-lg font-semibold bg-emerald-400/30 text-white border border-emerald-300/40 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-300 mr-2 animate-pulse"></div>
                  Available
                </div>
                <span className="text-indigo-100 font-medium">for withdrawal</span>
              </div>
            </div>
          </div>

          {/* Total Earned */}
          <div className="group bg-gradient-to-br from-emerald-50 via-green-50 to-white rounded-2xl p-6 border-2 border-emerald-100 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col flex-1">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">Total Earned</p>
                {loading ? (
                  <div className="h-8 w-40 bg-emerald-100 rounded-lg animate-pulse"></div>
                ) : (
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                    NZD {walletBalance?.walletTotalEarned !== null && walletBalance?.walletTotalEarned !== undefined && !isNaN(walletBalance.walletTotalEarned) ? walletBalance.walletTotalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-100 border-2 border-emerald-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <ArrowUpRight className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs mt-3">
              <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                ↗ Income
              </span>
              <span className="text-gray-600 font-medium">All time earnings</span>
            </div>
          </div>

          {/* Total Withdrawn */}
          <div className="group bg-gradient-to-br from-orange-50 via-amber-50 to-white rounded-2xl p-6 border-2 border-orange-100 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col flex-1">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2">Total Withdrawn</p>
                {loading ? (
                  <div className="h-8 w-40 bg-orange-100 rounded-lg animate-pulse"></div>
                ) : (
                  <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                    NZD {walletBalance?.walletTotalWithdrawn !== null && walletBalance?.walletTotalWithdrawn !== undefined && !isNaN(walletBalance.walletTotalWithdrawn) ? walletBalance.walletTotalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange-100 border-2 border-orange-200 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs mt-3">
              <span className="px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-bold border border-orange-200">
                ↙ Withdrawn
              </span>
              <span className="text-gray-600 font-medium">Total payout</span>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
              <p className="text-sm text-gray-500 mt-1">View your complete transaction history</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilterModal(true)}
                className="relative px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm rounded-xl text-sm font-medium transition-all hover:shadow-md flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Enhanced Data Table */}
          <EnhancedDataTable
            data={transactions}
            columns={columns}
            isLoading={loading}
            emptyMessage="No transactions found"
            height={500}
            stickyHeader={true}
            zebraStripes={true}
            hoverEffect={true}
            pagination={true}
            defaultPageSize={10}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      </div>

      {/* Modals */}
      {showAttachmentModal && selectedAttachment && (
        <AttachmentViewerModal
          attachmentUrl={selectedAttachment.url}
          invoiceId={selectedAttachment.invoiceId}
          onClose={handleCloseAttachmentModal}
        />
      )}

      {showFilterModal && (
        <FilterModal
          filters={filters}
          onApply={handleApplyFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
};