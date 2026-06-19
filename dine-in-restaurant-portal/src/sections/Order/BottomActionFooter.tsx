import { Wallet, CheckCircle } from "lucide-react"
import { formatCurrency } from "../../utils"
import { PaymentMethod, OrderStatus } from "../../utils/constants"
import { Button } from "../../components/Button"
import { FC } from "react"
import { OrderItemResponse } from "../../features/orders/types"

interface BottomActionFooterProps {
    loading: boolean
    detailActiveTab: string
    selectedItem: OrderItemResponse | null | undefined
    handleReleaseOrder: () => void
    handlePrintReceipt: () => void
    handleCancelOrder: () => void
}

const BottomActionFooter: FC<BottomActionFooterProps> = ({ loading, detailActiveTab, selectedItem, handleReleaseOrder, handlePrintReceipt, handleCancelOrder }) => {
    return (
        <div className='border-t border-gray-200 bg-gray-50 p-6 shadow-xs'>
            {detailActiveTab === 'review' ? (
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium italic">
                    <span>* Ratings are submitted by verified customers</span>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Live Data</span>
                    </div>
                </div>
            ) : (
                <div className='space-y-4'>
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs mb-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                            <div className="p-1.5 bg-green-50 rounded-lg">
                                <Wallet className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Info</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Method</p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span className="text-xs font-black text-gray-900 uppercase tracking-tight">
                                        {selectedItem?.paymentMethod?.replace('_', ' ') || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Status</p>
                                <div className="flex items-center justify-end gap-1.5">
                                    <span className={`text-xs font-black uppercase tracking-tight ${selectedItem?.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {selectedItem?.paymentStatus || 'Pending'}
                                    </span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedItem?.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-3 px-1'>
                        <div className='flex justify-between items-center text-xs font-bold'>
                            <p className='text-gray-400 uppercase tracking-widest'>Subtotal</p>
                            <p className='text-gray-900'>{formatCurrency(Number(selectedItem?.subtotal))}</p>
                        </div>
                        <div className='flex justify-between items-center text-xs font-bold'>
                            <p className='text-gray-400 uppercase tracking-widest'>Service Charge</p>
                            <p className='text-gray-900'>{formatCurrency(Number(selectedItem?.serviceCharge))}</p>
                        </div>
                        <div className='flex justify-between items-center text-xs font-bold'>
                            <p className='text-gray-400 uppercase tracking-widest'>Tax & Fees</p>
                            <p className='text-gray-900'>{formatCurrency(Number(selectedItem?.tax))}</p>
                        </div>
                        {selectedItem?.paymentMethod === PaymentMethod.CASHIER_CASH && (
                            <div className='flex justify-between items-center text-xs font-bold'>
                                <p className='text-gray-400 uppercase tracking-widest'>Cash</p>
                                <p className='text-gray-900'>{formatCurrency(Number(selectedItem?.amountTendered))}</p>
                            </div>
                        )}
                        {selectedItem?.paymentMethod === PaymentMethod.CASHIER_CASH && (
                            <div className='flex justify-between items-center text-xs font-bold'>
                                <p className='text-gray-400 uppercase tracking-widest'>Change</p>
                                <p className='text-gray-900'>{formatCurrency(Number(selectedItem?.changeReturned))}</p>
                            </div>
                        )}
                        {/* <div className='flex justify-between items-center text-xs font-bold'>
                                        <p className='text-gray-400 uppercase tracking-widest'>Discount</p>
                                        <p className='text-rose-500'>- {formatCurrency(Number(selectedItem?.discount))}</p>
                                    </div> */}
                        <div className="pt-2 border-t border-dashed border-gray-200" />
                        <div className='flex justify-between items-end'>
                            <div>
                                <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1'>Total Amount</p>
                                <p className='font-black text-2xl text-gray-900 tracking-tighter'>
                                    {formatCurrency(Number(selectedItem?.totalAmount))}
                                </p>
                            </div>
                            {selectedItem?.paymentStatus === 'paid' && (
                                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    <div>
                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Paid Fully</p>
                                        <p className="text-[10px] font-bold text-emerald-900">Verified</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedItem && selectedItem.isOnHold ? (
                        <Button onClick={handleReleaseOrder} size='lg' className='w-full bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'>
                            Release Order
                        </Button>
                    ) : (
                        <>
                            {(selectedItem && selectedItem.status !== OrderStatus.CANCELLED) && (selectedItem && selectedItem.status !== OrderStatus.READY) && (
                                <div className='flex gap-2'>
                                    {selectedItem.status === OrderStatus.PENDING &&
                                        <Button variant='danger' size='lg' className='flex-1' onClick={handleCancelOrder} isLoading={loading}>
                                            Cancel Order
                                        </Button>
                                    }
                                    {selectedItem.status !== OrderStatus.COMPLETED && (
                                        <Button onClick={handlePrintReceipt} size='lg' className='flex-1 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'>
                                            Print Invoice
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default BottomActionFooter