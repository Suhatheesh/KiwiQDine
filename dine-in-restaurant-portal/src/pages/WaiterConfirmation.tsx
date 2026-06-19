import { ChefHat, PhoneIcon } from "lucide-react";
import { FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import OrderItemCard from "../components/OrderItemCard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, hexToRgba } from "../utils";
import { OrderStatus, OrderType } from "../utils/constants";
import { OrderItemResponse } from "../features/orders/types";
import SocketService from "../services/SocketService";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import EmptyState from "../components/EmptyState";
import { fetchAllOrdersRequest, pagination, resetPagination } from "../features/orders/ordersSlice";
import { OrderItemCardSkeleton } from "../components/CustomSkeleton";
import { RouteLinks } from "../routers/type";
import { useNavigate } from "react-router-dom";

const WaiterConfirmation: FC = () => {

    const { user, primaryColor } = useAuth();
    const navigation = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const menuListRef = useRef<HTMLDivElement>(null);
    const [selectedItem, setSelectedItem] = useState<OrderItemResponse | null>()
    const [confirmDetail, setConfirmDetail] = useState<{ status: string, itemId: string } | null>(null)

    const { data: orders, loading: isLoading, totalPages, page, isPaginationFetching } = useSelector((state: RootState) => state.orders);

    const today = useMemo(() => new Date().toISOString().split("T")[0], []);

    const fetchOrders = useCallback(() => {
        if (!user) return;
        dispatch(
            fetchAllOrdersRequest({
                date: today,
                status: OrderStatus.PENDING,
                orderType: OrderType.DINEIN,
                page: Number(page),
                limit: 10,
                isWaiterConfirmation: true
            })
        );
    }, [dispatch, user, today]);

    useLayoutEffect(() => {
        const socket = SocketService.getInstance();
        socket.on("order-status", 'order_status_update', () => {
            fetchOrders();
        });
        socket.on("order-status", 'new_order', () => {
            fetchOrders();
        });
        return () => {
            dispatch(resetPagination());
            socket.off("order-status", 'order_status_update');
            socket.off("order-status", 'new_order');
        };
    }, [fetchOrders])

    useLayoutEffect(() => {
        fetchOrders();
    }, [fetchOrders, page])

    const handlePreparing = (item: OrderItemResponse) => {
        setSelectedItem(item)
    }

    const handleClose = () => setSelectedItem(null)

    const handleConfirm = () => {
        handleCloseModal();
        navigation(`${RouteLinks.MENU_LIST}/${selectedItem?.orderType}/confirm`, {
            state: {
                order: selectedItem
            }
        });
    }

    const handleCloseModal = () => {
        setConfirmDetail(null)
    }

    const handleScroll = () => {
        if (menuListRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = menuListRef.current;

            if (scrollTop + clientHeight >= scrollHeight - 50) {
                handlePageChange();
            }
        }
    }

    const handlePageChange = () => {
        if (totalPages <= Number(page) || isPaginationFetching) return;
        dispatch(pagination(String(Number(page) + 1)))
    }

    return (
        <div className="relative overflow-x-hidden overflow-y-scroll" ref={menuListRef} onScroll={handleScroll}>
            <div>
                {/* Professional Status Tabs */}
                <div className="flex justify-between mb-4">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 overflow-y-auto w-full">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <OrderItemCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : orders?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 overflow-y-auto w-full">
                            {orders.map((item, index) => (
                                <OrderItemCard key={index} item={item} isWaiterConfirmation onPreparing={handlePreparing} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-1 justify-center items-center">
                            <EmptyState
                                icon={ChefHat}
                                title="No New Orders"
                                description="There are no pending orders at the moment. New orders will appear here automatically."
                                iconColor="#f97316"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Overlay - appears when order detail is open */}
            {selectedItem && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={() => setSelectedItem(null)}
                />
            )}

            {/* Order Detail Section - Fixed Slide-out Panel */}
            <div className={`fixed top-0 right-0 h-screen w-full md:w-[500px] lg:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${selectedItem ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className='flex flex-col h-full'>
                    {/* Header */}
                    <div className='flex items-center justify-between p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-purple-50'>
                        <div className='flex-1'>
                            <p className='font-bold text-2xl text-gray-900'>Order #{selectedItem?.orderNumber ?? 'N/A'}</p>
                            <div className='flex gap-4 text-sm font-medium text-gray-600 mt-1'>
                                <p className='flex items-center gap-1'>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {selectedItem?.customerName}
                                    {selectedItem?.customerPhone && (
                                        <span className='text-gray-600 ml-2 flex items-center gap-2'>
                                            <PhoneIcon className="w-3 h-3" />
                                            {selectedItem?.customerPhone}
                                        </span>
                                    )}
                                </p>
                                <p className='flex items-center gap-1'>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Table {selectedItem?.tableNo}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleClose()}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Order Items - Scrollable */}
                    <div className='flex-1 overflow-y-auto p-6'>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Order Items</h3>
                        <div className='space-y-2'>
                            {selectedItem && selectedItem.itemsByCategory ? selectedItem.itemsByCategory.map((mainItem, i) => (
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
                                    <p>No items found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer - Totals and Actions */}
                    <div className='border-t border-gray-200 bg-gray-50 p-6 space-y-4'>
                        <div className='space-y-2'>
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
                            <div className="pt-2 border-t border-dashed border-gray-200" />
                            <div className='flex justify-between text-xl'>
                                <p className='font-bold'>Grand Total</p>
                                <p className='font-bold'>{formatCurrency(Number(selectedItem?.totalAmount))}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='flex space-x-2'>
                            <Button onClick={handleConfirm} size='lg' className='flex flex-1 mt-2 cursor-pointer  bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'>
                                <p>Customize and Confirm Order</p>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={confirmDetail !== null}
                onClose={handleCloseModal}
                title={`Update Item Status`}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirm}>
                            Confirm
                        </Button>
                    </div>
                }
            >
                <div className="text-gray-700">
                    {confirmDetail?.status === OrderStatus.PENDING
                        ? "Ready to start preparing this item? This will notify the kitchen staff that work has begun."
                        : confirmDetail?.status === OrderStatus.READY ? "Ready to serve this item? This will notify the serving staff that the dish is complete and ready to serve."
                            : confirmDetail?.status === OrderStatus.COMPLETED ? "Mark this item as completed? This will notify the staff that the dish is complete." : "Mark this item as ready? This will notify the serving staff that the dish is complete and ready to serve."}
                </div>

            </Modal>
        </div>
    )
}

export default WaiterConfirmation;