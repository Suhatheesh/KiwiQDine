import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { WalletSummary } from '../../features/restaurants/types';
import RestaurantsAPI from '../../features/restaurants/restaurantsAPI';
import TransactionsAPI from '../../features/transactions/transactionsAPI';
import { Transaction } from '../../features/transactions/types';
import { CreateTransactionModal } from './CreateTransactionModal';
import { Plus, ExternalLink, CreditCard, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../utils/constants';

const WalletTab: React.FC = () => {
  const { id: restaurantId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [summaryRes, txRes]: [any, any] = await Promise.all([
        RestaurantsAPI.fetchWalletSummary(restaurantId),
        TransactionsAPI.getRestaurantTransactions(restaurantId, {}),
      ]);
      // Handle both wrapped and unwrapped responses
      setSummary(summaryRes.data || summaryRes);
      setTransactions(txRes.data || txRes);
    } catch (e) {
      console.error('Wallet data error:', e);
      toast.error('Failed to load wallet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await TransactionsAPI.updateTransactionStatus(id, newStatus);
      toast.success(`Transaction marked as ${newStatus}`);
      fetchData();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatCurrency = (amount: number) =>
    `NZD ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Premium Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <div className="relative overflow-hidden group bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[2rem] p-8 shadow-2xl transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between min-h-[160px]">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30">
                <CreditCard className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-indigo-100/60 text-sm font-medium tracking-wider uppercase">Wallet Balance</span>
            </div>
            <div>
              <div className="text-4xl font-bold text-white tracking-tight mb-2">
                {summary ? formatCurrency(summary.totalBalance) : 'NZD 0.00'}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                <span className="text-indigo-100/40 text-xs font-medium">Verified & Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Earned Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-md min-h-[160px]">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-emerald-600">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Earned</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-800 tracking-tight">
              {summary ? formatCurrency(summary.walletTotalEarned) : 'NZD 0.00'}
            </div>
            <p className="text-slate-400 text-xs mt-1">Lifetime platform earnings</p>
          </div>
        </div>

        {/* Total Payouts Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between transition-all duration-300 hover:shadow-md min-h-[160px]">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-amber-600">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Withdrawn</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-800 tracking-tight">
              {summary ? formatCurrency(summary.walletTotalWithdrawn) : 'NZD 0.00'}
            </div>
            <p className="text-slate-400 text-xs mt-1">Total secondary payouts</p>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/30">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Transaction History</h3>
            <p className="text-slate-500 text-sm mt-1">Monitor and manage all restaurant payments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2 font-semibold text-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Log Transaction
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Entry Detail</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Receipt</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-400 font-medium">Syncing with ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <AlertCircle className="w-12 h-12 stroke-[1]" />
                      <span className="text-sm font-medium">No transaction records found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">#{tx.invoiceId}</span>
                        <span className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${tx.type === 'payout'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : tx.type === 'adjustment'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                        {tx.type || 'payout'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-sm font-black tabular-nums ${tx.type === 'payout' ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                        {tx.type === 'payout' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600 font-medium">
                      {new Date(tx.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-8 py-5">
                      {tx.attachmentUrl ? (
                        <a
                          href={tx.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Document
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs italic font-medium select-none flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> No Proof
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {isSuperAdmin ? (
                        <select
                          value={tx.status}
                          disabled={updatingId === tx.id || tx.status === 'Completed'}
                          onChange={(e) => handleStatusUpdate(tx.id, e.target.value)}
                          className={`text-xs font-bold rounded-lg border-none focus:ring-2 focus:ring-indigo-500 py-1.5 pl-3 pr-8 shadow-sm transition-all ${tx.status === 'Completed'
                            ? 'cursor-not-allowed opacity-75'
                            : 'cursor-pointer'
                            } ${tx.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : tx.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Failed">Failed</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${tx.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : tx.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${tx.status === 'Completed' ? 'bg-emerald-500' : tx.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}></div>
                          {tx.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {restaurantId && (
        <CreateTransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          restaurantId={restaurantId}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default WalletTab;
