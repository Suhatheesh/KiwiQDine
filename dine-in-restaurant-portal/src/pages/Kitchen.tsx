import { Clock, MapPin, User, X, ChefHat, Flame, CheckCircle, UtensilsCrossed, StickyNote, RefreshCcw } from "lucide-react";
import { FC, useCallback, useLayoutEffect, useMemo, useState } from "react";
import OrderItemCard from "../components/OrderItemCard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store";
import { useAuth } from "../hooks/useAuth";
import { hexToRgba, hexToRgbTuple } from "../utils";
import { OrderStatus, OrderType } from "../utils/constants";
import { fetchAllKitchenOrdersRequest, orderCompletedRequest, readyOrderItemStatusRequest, readyOrderStatusRequest, startOrderItemStatusRequest, updateOrderStatusRequest } from "../features/kitchen/kitchenSlice";
import { OrderItemResponse } from "../features/orders/types";
import { StatusBadge } from "../components/StatusBadge";
import KitchenItem from "../components/KitchenItem";
import { dateFormatter } from "../utils";
import SocketService from "../services/SocketService";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import EmptyState from "../components/EmptyState";
import { generateInvoicePDF } from "../utils/invoiceGenerator";

const Kitchen: FC = () => {

    const { user, primaryColor } = useAuth();
    const dispatch = useDispatch<AppDispatch>();

    const [selectedStatus, setSelectedStatus] = useState<string>(OrderStatus.CONFIRMED)
    const [selectedItem, setSelectedItem] = useState<OrderItemResponse | null>()
    const [confirmDetail, setConfirmDetail] = useState<{ status: string, itemId: string } | null>(null)

    const { data: orders, loading: isLoading, isEditingTimeLoading } = useSelector((state: RootState) => state.kitchen);

    const filterValues = useMemo(() => {
        return {
            pending: orders.filter((i) => i.status === OrderStatus.CONFIRMED).length,
            inprogress: orders.filter((i) => i.status === OrderStatus.PREPARING).length,
            ready: orders.filter((i) => i.status === OrderStatus.READY).length,
            overdue: orders.filter((i) => i.status === "overdue").length,
        }
    }, [orders])

    const summaryList = [
        {
            id: 1,
            name: "Pending",
            value: filterValues.pending,
            backgroundColor: 'bg-gradient-to-br from-amber-500 to-orange-600',
            textColor: 'text-white',
            icon: Clock
        },
        {
            id: 2,
            name: "In Progress",
            value: filterValues.inprogress,
            backgroundColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
            textColor: 'text-white',
            icon: Flame
        },
        {
            id: 3,
            name: "Ready",
            value: filterValues.ready,
            backgroundColor: 'bg-gradient-to-br from-green-500 to-green-600',
            textColor: 'text-white',
            icon: CheckCircle
        },
        {
            id: 4,
            name: "Overdue",
            value: filterValues.overdue,
            backgroundColor: 'bg-gradient-to-br from-red-500 to-red-600',
            textColor: 'text-white',
            icon: Clock
        }
    ]

    const orderStatusList = [
        { lable: "New", value: OrderStatus.CONFIRMED },
        { lable: "In progress", value: OrderStatus.PREPARING },
        { lable: "Ready", value: OrderStatus.READY },
        { lable: "Served", value: OrderStatus.SERVED },
        { lable: "Completed", value: OrderStatus.COMPLETED }
    ]

    const filterOrderItemList = useMemo(() => {
        return orders.find((i) => i.id === selectedItem?.id);
    }, [orders, selectedItem])

    const today = useMemo(() => new Date().toISOString().split("T")[0], []);

    const fetchKitchenOrders = useCallback(() => {
        if (!user) return;

        dispatch(
            fetchAllKitchenOrdersRequest({
                restaurantId: user.restaurantId,
                vendorId: user.id,
                date: today,
            })
        );
    }, [dispatch, user, today]);

    useLayoutEffect(() => {
        const socket = SocketService.getInstance();
        socket.on("order-status", 'order_status_update', () => {
            fetchKitchenOrders();
        });
        socket.on("order-status", 'new_order', () => {
            fetchKitchenOrders();
        });
        return () => {
            socket.off("order-status", 'order_status_update');
            socket.off("order-status", 'new_order');
        };
    }, [fetchKitchenOrders])

    useLayoutEffect(() => {
        fetchKitchenOrders();
    }, [fetchKitchenOrders])

    const handleRefresh = () => {
        fetchKitchenOrders();
    }

    useLayoutEffect(() => {
        const allDone = filterOrderItemList?.itemsByCategory?.every(
            (i) =>
                i.items.every((j) => j.status !== OrderStatus.INPROGRESS && j.status !== OrderStatus.PENDING)
        );
        if (allDone) {
            dispatch(readyOrderStatusRequest(selectedItem?.id ?? ""))
            setSelectedItem(null);
        }
    }, [dispatch, filterOrderItemList, selectedItem])

    const onHandleStatusClick = (value: string) => {
        setSelectedStatus(value)
    }

    const handlePreparing = (item: OrderItemResponse) => {
        if (item.status === OrderStatus.PREPARING) {
            setSelectedItem(item)
        } else if (item.status === OrderStatus.READY) {
            setConfirmDetail({ itemId: item.id ?? "", status: (item.orderType === OrderType.TAKEAWAY || item.orderType === OrderType.PARKING) ? OrderStatus.COMPLETED : OrderStatus.READY })
        } else {
            dispatch(updateOrderStatusRequest({ orderId: item.id ?? "", status: OrderStatus.PREPARING, updatedBy: user?.id ?? "" }))
        }
    }

    const handleClose = () => setSelectedItem(null)

    const handleItemStatus = (status: string, itemId: string) => {
        setConfirmDetail({ itemId, status });
    }

    const handleConfirm = () => {
        if (confirmDetail?.status === OrderStatus.PENDING) {
            dispatch(startOrderItemStatusRequest(confirmDetail?.itemId ?? ""))
        } else if (confirmDetail?.status === OrderStatus.INPROGRESS) {
            dispatch(readyOrderItemStatusRequest(confirmDetail?.itemId ?? ""))
        } else if (confirmDetail?.status === OrderStatus.READY) {
            dispatch(updateOrderStatusRequest({ orderId: confirmDetail?.itemId ?? "", status: OrderStatus.SERVED, updatedBy: user?.id ?? "" }))
        } else {
            dispatch(orderCompletedRequest(confirmDetail?.itemId ?? ""))
        }
        handleCloseModal();
    }

    const handleCloseModal = () => {
        setConfirmDetail(null)
    }

    const handlePrintReceipt = (item: OrderItemResponse) => {
        if (item) {
            generateInvoicePDF({
                order: item,
                restaurantName: user?.restaurant?.name || 'Restaurant',
                restaurantAddress: `${user?.restaurant?.address?.lane}, ${user?.restaurant?.address?.city}, ${user?.restaurant?.address?.district}, ${user?.restaurant?.address?.country}`,
                restaurantPhone: user?.restaurant?.contactPhoneNumber,
                color: hexToRgbTuple(primaryColor)
            });
        }
    }

    const filterKitchenOrder = useMemo(() => {
        return orders.filter((i) => i.status === selectedStatus);
    }, [orders, selectedStatus])

    return (
        <div className="space-y-6 relative overflow-x-hidden">

            {/* Super Cool KPI Cards for Chefs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryList.map((i) => {
                    const IconComponent = i.icon;
                    return (
                        <div
                            key={i.id}
                            className={`${i.backgroundColor} ${i.textColor} rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 cursor-pointer transition-all duration-200 relative overflow-hidden group`}
                        >
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                                <IconComponent className="w-32 h-32" strokeWidth={1} />
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <IconComponent className="w-6 h-6" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">{i.name}</span>
                                </div>
                                <p className="text-4xl font-bold tracking-tight">{i.value}</p>
                                <p className="text-xs opacity-90 mt-2">Active {i.name.toLowerCase()} orders</p>
                            </div>

                            {/* Pulse effect for pending */}
                            {i.value > 0 && i.id === 1 && (
                                <div className="absolute top-3 left-3">
                                    <span className="flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div>
                {/* Professional Status Tabs */}
                <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-200 mb-4">
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 pl-2">
                        {orderStatusList.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => onHandleStatusClick(item.value)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${selectedStatus === item.value
                                    ? 'bg-gray-900 text-white shadow-md scale-105'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {item.lable}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        className="ml-2"
                        onClick={handleRefresh}
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
                {filterKitchenOrder.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-2 h-[calc(100vh-290px)] pb-4 overflow-y-auto">
                        {filterKitchenOrder.map((item, index) => (
                            <OrderItemCard key={index} item={item} onPreparing={handlePreparing} onPrintReceipt={handlePrintReceipt} />
                        ))}
                    </div>
                ) : (
                    <>
                        {selectedStatus === OrderStatus.CONFIRMED && (
                            <EmptyState
                                icon={ChefHat}
                                title="No New Orders"
                                description="There are no pending orders at the moment. New orders will appear here automatically."
                                iconColor="#f97316"
                            />
                        )}
                        {selectedStatus === OrderStatus.PREPARING && (
                            <EmptyState
                                icon={Flame}
                                title="All Caught Up!"
                                description="Great work! No orders are currently in preparation. Keep up the excellent service."
                                iconColor="#3b82f6"
                            />
                        )}
                        {selectedStatus === OrderStatus.READY && (
                            <EmptyState
                                icon={CheckCircle}
                                title="No Orders Ready"
                                description="No dishes are ready for serving at the moment. Orders will appear here once prepared."
                                iconColor="#10b981"
                            />
                        )}
                        {selectedStatus === OrderStatus.SERVED && (
                            <EmptyState
                                icon={UtensilsCrossed}
                                title="No Served Orders"
                                description="No orders have been served yet today. Completed orders will be displayed here."
                                iconColor="#22c55e"
                            />
                        )}
                        {selectedStatus === OrderStatus.COMPLETED && (
                            <EmptyState
                                icon={UtensilsCrossed}
                                title="No Completed Orders"
                                description="No orders have been served yet today. Completed orders will be displayed here."
                                iconColor="#6b7280"
                            />
                        )}
                    </>
                )}

            </div>

            {selectedItem && <div className="w-screen h-screen fixed inset-0 p-0 m-0 bg-black top-0 left-0 opacity-40 z-40" />}

            <div className={`w-full md:w-2/5 lg:w-1/3 h-[calc(100vh-4px)] fixed top-0 right-0 bg-gray-50 transform transition-transform duration-500 ease-in-out shadow-2xl z-50 ${selectedItem ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center border-b border-gray-300 p-4 bg-white">
                    <div>
                        <p className="text-xl font-bold">Order Detail</p>
                        <p className="text-sm text-gray-600 font-semibold">ORD - {selectedItem?.orderNumber}</p>
                        <div className="mt-2">
                            <span style={{
                                background: selectedItem?.orderType === OrderType.DINEIN
                                    ? `linear-gradient(to right, ${hexToRgba(primaryColor, 0.1)}, ${hexToRgba(primaryColor, 0.2)})`
                                    : '',
                                color: selectedItem?.orderType === OrderType.DINEIN ? primaryColor : '',
                                borderColor: selectedItem?.orderType === OrderType.DINEIN ? hexToRgba(primaryColor, 0.4) : ''
                            }} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${selectedItem?.orderType === OrderType.DINEIN
                                ? 'border'
                                : selectedItem?.orderType === OrderType.PARKING ? 'bg-linear-to-r from-green-100 to-green-200 text-green-800 border border-green-300' : 'bg-linear-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300'
                                }`}>
                                {selectedItem?.orderType === OrderType.DINEIN ? '🍽️ Dine In' : selectedItem?.orderType === OrderType.PARKING ? '🚗 Parking' : '🥡 Take Away'}
                            </span>
                        </div>
                    </div>
                    <X onClick={handleClose} />
                </div>
                <div className="flex justify-between p-6">
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <MapPin className="w-5 h-5 text-gray-500" />
                            <p className="text-sm text-gray-600 font-semibold">Table: T - {selectedItem?.tableNo}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <User className="w-5 h-5 text-gray-500" />
                            <p className="text-sm text-gray-600 font-semibold">Customer: {selectedItem?.customerName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-gray-500" />
                            <p className="text-sm text-gray-600 font-semibold">Order Time: {selectedItem && dateFormatter.format(new Date(selectedItem!.createdAt!))}</p>
                        </div>
                    </div>
                    <div>
                        <StatusBadge status="Preparing" type="order" />
                    </div>
                </div>

                {/* Order Note Display */}
                {selectedItem?.note && (
                    <div className="mx-6 mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                                <StickyNote className="w-4 h-4 text-amber-700 font-bold" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Order Note</p>
                                <p className="text-sm text-amber-900 font-medium leading-relaxed italic">
                                    "{selectedItem.note}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white p-4 ">
                    <div className="flex items-center justify-between pb-4">
                        <p className="text-2xl font-semibold">Order Item</p>
                        <p className="text-sm text-gray-400">{selectedItem?.itemsByCategory?.length} Item</p>
                    </div>
                    <div className=" h-[calc(100vh-360px)] space-y-4 overflow-scroll">
                        {filterOrderItemList?.itemsByCategory?.map((mainItem, i) => (
                            <div key={i}>
                                {mainItem.items.map((item, j) => (
                                    <KitchenItem
                                        key={j}
                                        userId={user?.id}
                                        item={item}
                                        onStatusClick={handleItemStatus}
                                        orderStatus={item.status ?? OrderStatus.PENDING}
                                        isEditingTimeLoading={isEditingTimeLoading}
                                    />
                                ))}
                            </div>
                        ))}
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

export default Kitchen;