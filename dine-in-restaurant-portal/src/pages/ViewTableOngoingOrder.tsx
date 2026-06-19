import { FC, useState } from "react";
import { useLocation } from "react-router-dom";
import { OrderStatus, LatestOrder } from "../features/tables/types";
import { Clock, DollarSign, Package, ShoppingBag, X } from "lucide-react";
import { formatCurrency, hexToRgba } from "../utils";
import { useAuth } from "../hooks/useAuth";
import EmptyState from "../components/EmptyState";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store";
import { fetchOrdersByIdRequest } from "../features/orders/ordersSlice";
import ActiveOrderCard from "../components/ActiveOrderCard";

const ViewTableOngoingOrder: FC = () => {

    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    const { primaryColor } = useAuth();
    const { orderStatus } = location.state as { orderStatus: OrderStatus };
    const { order: orderDetail } = useSelector((state: RootState) => state.orders);

    const [selectedOrder, setSelectedOrder] = useState<LatestOrder | null>(null);

    const handleViewOrder = (order: LatestOrder) => {
        setSelectedOrder(order);
        dispatch(fetchOrdersByIdRequest(order.id));
    };

    return (
        <div className="bg-linear-to-br from-gray-50 to-gray-100 overflow-y-scroll h-screen">
            <div className="max-w-7xl mx-auto space-y-6 pb-26">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Active Orders */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }} className="p-3 rounded-xl">
                                <Package style={{ color: primaryColor }} className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{orderStatus.activeOrdersCount}</p>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Active Orders</p>
                    </div>

                    {/* Pending Confirmation */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-amber-50">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{orderStatus.pendingOrdersCount}</p>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Pending Confirmation</p>
                    </div>

                    {/* Latest Order Amount */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-green-50">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            {orderStatus.latestOrder ? formatCurrency(Number(orderStatus.latestOrder.totalAmount)) : formatCurrency(0)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Latest Order Amount</p>
                    </div>

                    {/* Total Items */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-purple-50">
                                <ShoppingBag className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                            {orderStatus.activeOrders.reduce((sum, order) => sum + order.itemCount, 0)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Total Items</p>
                    </div>
                </div>

                {/* Orders List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Active Orders</h2>
                            <p className="text-sm text-gray-500 mt-1">All orders currently being processed for this table</p>
                        </div>
                    </div>

                    {orderStatus.activeOrders && orderStatus.activeOrders.length > 0 ? (
                        <div className="space-y-4">
                            {orderStatus.activeOrders.map((order, index) => {
                                return (
                                    <ActiveOrderCard
                                        key={index}
                                        order={order}
                                        index={index}
                                        handleViewOrder={handleViewOrder}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Package}
                            title="No Active Orders"
                            description="There are no ongoing orders for this table at the moment."
                            iconColor="#3b82f6"
                        />
                    )}
                </div>
            </div>

            {/* Overlay */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={() => setSelectedOrder(null)}
                />
            )}

            {/* Order Detail Slide-out Panel */}
            <div className={`fixed top-0 right-0 h-screen w-full md:w-[500px] lg:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${selectedOrder ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className='flex flex-col h-full'>
                    {/* Header */}
                    <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-purple-50'>
                        <div className='flex-1'>
                            <p className='font-bold text-2xl text-gray-900'>Order #{selectedOrder?.orderNumber ?? 'N/A'}</p>
                            <div className='flex gap-4 text-sm font-medium text-gray-600 mt-1'>
                                <p className='flex items-center gap-1'>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {selectedOrder?.customerName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    {/* Order Items - Scrollable */}
                    <div className='flex-1 overflow-y-auto p-6'>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Order Items</h3>
                        <div className='space-y-2'>
                            {orderDetail && orderDetail.itemsByCategory ? orderDetail.itemsByCategory.map((mainItem, i) => (
                                <div key={i}>
                                    {mainItem.items.map((item, j) => (
                                        <div key={j} className={`flex gap-4 px-4 py-3 rounded-lg ${j % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border border-gray-100`}>
                                            <div style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, 0.1) }} className='flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm'>
                                                {item.quantity}
                                            </div>
                                            <div className='flex flex-1 flex-col'>
                                                <p className='font-semibold text-gray-900'>{item.menuName}</p>
                                                {item.specialInstructions?.portion && (
                                                    <p className='text-sm text-gray-500 mt-0.5'>{item.specialInstructions.portion}</p>
                                                )}
                                                {item.addons && item.addons.length > 0 && (
                                                    <div className='mt-2 space-y-0.5'>
                                                        <p className='text-xs font-semibold text-blue-600'>Add-ons:</p>
                                                        {item.addons.map((addon, aIdx) => (
                                                            <p key={aIdx} className='text-xs text-gray-500 ml-2'>
                                                                • {addon.name}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className='text-end flex flex-col justify-center'>
                                                <p className='font-semibold text-gray-900'>{formatCurrency(parseInt(item.totalPrice ?? "0"))}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-400">
                                    <p>Loading order details...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer - Totals */}
                    {orderDetail && (
                        <div className='border-t border-gray-200 bg-gray-50 p-6 space-y-4'>
                            <div className='space-y-2'>
                                <div className='flex justify-between items-center text-xs font-bold'>
                                    <p className='text-gray-400 uppercase tracking-widest'>Subtotal</p>
                                    <p className='text-gray-900'>{formatCurrency(Number(orderDetail.subtotal))}</p>
                                </div>
                                <div className='flex justify-between items-center text-xs font-bold'>
                                    <p className='text-gray-400 uppercase tracking-widest'>Service Charge</p>
                                    <p className='text-gray-900'>{formatCurrency(Number(orderDetail.serviceCharge))}</p>
                                </div>
                                <div className='flex justify-between items-center text-xs font-bold'>
                                    <p className='text-gray-400 uppercase tracking-widest'>Tax & Fees</p>
                                    <p className='text-gray-900'>{formatCurrency(Number(orderDetail.tax))}</p>
                                </div>
                                <div className="pt-2 border-t border-dashed border-gray-200" />
                                <div className='flex justify-between text-xl'>
                                    <p className='font-bold'>Grand Total</p>
                                    <p className='font-bold'>{formatCurrency(Number(orderDetail.totalAmount))}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ViewTableOngoingOrder;