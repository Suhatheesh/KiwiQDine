import { useEffect, useState } from 'react';
import { Eye, Download, Calendar, Clock, CreditCard, TrendingUp } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { fetchInvoiceByRestaurantId, payInvoice } from '../../features/invoices/invoiceSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { StatusBadge } from '../../components/StatusBadge';
import { fetchSubscriptionOrderUsageRequest, updateGracePeriodEndDateRequest } from '../../features/restaurants/restaurantsSlice';
import { Button } from '../../components/Button';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { CustomDatePicker } from '../../components/CustomDatePicker';

export const InvoicesTab = () => {
    const { id: restaurantId } = useParams<{ id: string }>();

    const { invoices, loading } = useSelector((state: RootState) => state.invoice);
    const { subscriptionOrderUsage, restaurant } = useSelector((state: RootState) => state.restaurant);

    const dispatch = useDispatch<AppDispatch>();

    const [payConfirm, setPayConfirm] = useState<{ isOpen: boolean; invoiceId: string | null }>({
        isOpen: false,
        invoiceId: null,
    });

    const [dueDateConfirm, setDueDateConfirm] = useState<{ isOpen: boolean; id: string | null; dueDate: string; isGracePeriod: boolean }>({
        isOpen: false,
        id: null,
        dueDate: '',
        isGracePeriod: false,
    });

    useEffect(() => {
        if (!restaurantId) return;
        dispatch(fetchSubscriptionOrderUsageRequest(restaurantId));
        dispatch(fetchInvoiceByRestaurantId(restaurantId));
    }, [restaurantId]);

    const handlePayInvoice = (invoiceId: string) => {
        setPayConfirm({ isOpen: true, invoiceId });
    }

    const onConfirmPay = () => {
        if (payConfirm.invoiceId) {
            dispatch(payInvoice(payConfirm.invoiceId));
            setPayConfirm({ isOpen: false, invoiceId: null });
        }
    }

    const handleUpdateDueDate = (id: string, dueDate: string, isGracePeriod: boolean = false) => {
        setDueDateConfirm({ isOpen: true, id, dueDate, isGracePeriod });
    }

    const onConfirmUpdateDueDate = () => {
        if (dueDateConfirm.id) {
            dispatch(updateGracePeriodEndDateRequest({ restaurantId: dueDateConfirm.id, gracePeriodEndDate: dueDateConfirm.dueDate }));
            setDueDateConfirm({ isOpen: false, id: null, dueDate: '', isGracePeriod: false });
        }
    }

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Current Balance */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Overdue Invoices Amount</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">NZD {subscriptionOrderUsage?.overageInvoiceCost}</p>
                </div>

                {/* This Month */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Overdue Table Amount</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900N">NZD {subscriptionOrderUsage?.overageTableCost}</p>
                </div>

                {/* This Year */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Overdue User Amount</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">NZD {subscriptionOrderUsage?.overageUserCost}</p>
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

            {/* Grace Period Management */}
            {restaurant?.gracePeriodEndDate && restaurantId && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm relative">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm">
                                <Clock className="w-7 h-7 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Grace Period Management</h3>
                                <p className="text-sm text-gray-500">Extend the grace period for the entire restaurant to prevent service interruption.</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full text-xs font-semibold text-amber-700">
                                        <Calendar className="w-3 h-3 text-amber-500" />
                                        Start: {restaurant?.gracePeriodStartDate}
                                    </div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full text-xs font-semibold text-amber-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                        End: {restaurant?.gracePeriodEndDate}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="min-w-[200px]">
                                <CustomDatePicker
                                    value={restaurant?.gracePeriodEndDate}
                                    onChange={(date) => handleUpdateDueDate(restaurantId, date, true)}
                                    disabled={restaurant?.gracePeriodEndDate ? new Date(restaurant.gracePeriodEndDate + 'T23:59:59') < new Date() : false}
                                    placeholder="Select expiry date"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">INVOICE ID</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">BILLING PERIOD</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">PLAN</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">AMOUNT</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">STATUS</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">DUE DATE</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                        ) : invoices?.data?.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">No invoices found.</td></tr>
                        ) : (
                            invoices?.data?.map((inv) => (
                                <tr key={inv.id} className="border-b last:border-0">
                                    <td className="px-6 py-4 font-medium text-gray-900">{inv.invoiceName}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{inv.billing_period}</td>
                                    <td className="px-6 py-4 text-gray-700">{inv.plan}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-base">NZD {inv.amount.toFixed(2)}</div>
                                        <div className="text-xs text-gray-500">Base: NZD {inv.base_amount.toFixed(2)} + Fees: NZD {inv.fees.toFixed(2)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={inv.status} type="invoice" />
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div>{inv.due_date}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg mr-1"><Eye className="w-4 h-4" /></button>
                                        <button className="text-green-600 hover:bg-green-50 p-2 rounded-lg"><Download className="w-4 h-4" /></button>
                                        {inv.status === 'pending' && (
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white ml-2" onClick={() => handlePayInvoice(inv.id)}>
                                                Pay Now
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={payConfirm.isOpen}
                onClose={() => setPayConfirm({ isOpen: false, invoiceId: null })}
                onConfirm={onConfirmPay}
                title="Confirm Payment"
                description="Are you sure you want to pay this invoice? This action will mark the invoice as paid."
                confirmText="Pay Now"
                type="info"
                isLoading={loading}
            />

            <ConfirmationModal
                isOpen={dueDateConfirm.isOpen}
                onClose={() => setDueDateConfirm({ isOpen: false, id: null, dueDate: '', isGracePeriod: false })}
                onConfirm={onConfirmUpdateDueDate}
                title={dueDateConfirm.isGracePeriod ? "Extend Grace Period" : "Change Due Date"}
                description={dueDateConfirm.isGracePeriod
                    ? `Are you sure you want to extend the restaurant's grace period to ${dueDateConfirm.dueDate}? This will apply to all pending invoices.`
                    : `Are you sure you want to change the due date to ${dueDateConfirm.dueDate}? This will update the restaurant's global grace period.`}
                confirmText={dueDateConfirm.isGracePeriod ? "Extend Now" : "Update Date"}
                type="warning"
                isLoading={loading}
            />
        </div>
    );
};
