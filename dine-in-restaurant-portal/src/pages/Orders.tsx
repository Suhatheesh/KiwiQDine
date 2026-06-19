import { useLayoutEffect, useMemo, useState } from 'react';
import { PhoneIcon, Clock, Flame, Package, CheckCircle, ShoppingBag, Printer, Eye, Star, History, CarIcon, TableIcon } from 'lucide-react';
import { EnhancedDataTable, Column } from '../components/ui/DataTable';
import { QuickStatsBar } from '../components/ui/Card/QuickStatsBar';
import { TableSkeleton } from '../components/ui/Skeleton/TableSkeleton';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { cancelOrderRequest, fetchAllOrdersRequest, fetchOrderLogsRequest, increaseLimit, pagination, resetPagination, updateOrderStatus } from '../features/orders/ordersSlice';
import { Button } from '../components/Button';
import { OrderItemResponse } from '../features/orders/types';
import { hexToRgbTuple } from '../utils';
import SocketService from '../services/SocketService';
import { Modal } from '../components/Modal';
import { TextArea } from '../components/TextArea';
import { useAuth } from '../hooks/useAuth';
import { OrderStatus, OrderType, UserRole } from '../utils/constants';
import Pagination from '../components/Pagination';
import { fetchOrderRateRequest } from '../features/rates/rateSlice';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { fetchKotAnalyticsDataRequest, fetchOrderAnalyticsDataRequest } from '../features/analytics/analyticsSlice';
import { useNavigate } from 'react-router-dom';
import { RouteLinks } from '../routers/type';
import ItemTab from '../sections/Order/ItemTab';
import ReviewTab from '../sections/Order/ReviewTab';
import LogsTab from '../sections/Order/LogsTab';
import BottomActionFooter from '../sections/Order/BottomActionFooter';
import { orderTableData } from '../lib/orderTableColumn';
import OrderFilter from '../sections/Order/OrderFilter';

interface OrdersProps {
    allowedRoles: string[];
}

export const Orders = ({ allowedRoles }: OrdersProps) => {
    const navigation = useNavigate();

    const { user, primaryColor } = useAuth();
    const [_searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
    const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
    const [selectedItem, setSelectedItem] = useState<OrderItemResponse | null>();
    const [isOrderCancelModelShow, setOrderCancelModelShow] = useState<boolean>(false);
    const [cancelReason, setCancelReason] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'history' | 'hold'>('history');
    const [detailActiveTab, setDetailActiveTab] = useState<'items' | 'review' | 'logs'>('items');

    const dispatch = useDispatch<AppDispatch>();

    const { data: orders, loading, limit, page, total, orderLogs } = useSelector((state: RootState) => state.orders);
    const { rate } = useSelector((state: RootState) => state.rate);
    const { orderAnalyticsData } = useSelector((state: RootState) => state.analytics);

    useLayoutEffect(() => {
        const socket = SocketService.getInstance();
        socket.on("order-status", "order_status_update", (data: any) => {
            dispatch(updateOrderStatus({ orderId: data.orderId, status: data.status }))
        });
    }, [dispatch])

    useLayoutEffect(() => {
        if (allowedRoles.includes(user!.role!)) {
            dispatch(fetchOrderAnalyticsDataRequest({ restaurantId: user?.restaurant?.id ?? "" }))
        } else {
            dispatch(fetchKotAnalyticsDataRequest({ restaurantId: user?.restaurant?.id ?? "" }))
        }
    }, [])

    useLayoutEffect(() => {
        dispatch(fetchAllOrdersRequest({
            page: Number(page),
            limit: Number(limit),
            orderType: orderTypeFilter === 'all' ? undefined : orderTypeFilter,
            status: statusFilter === 'all' ? undefined : statusFilter,
            isHold: activeTab === 'hold',
            startDate: dateFrom,
            endDate: dateTo,
            paymentMethod: paymentTypeFilter === 'all' ? undefined : paymentTypeFilter
        }))
    }, [dispatch, page, limit, statusFilter, activeTab, dateFrom, dateTo, paymentTypeFilter, orderTypeFilter])

    useLayoutEffect(() => {
        return () => { dispatch(resetPagination()); }
    }, [dispatch])

    const handleRowClick = (item: OrderItemResponse) => {
        if (item.id) {
            dispatch(fetchOrderRateRequest(item.id))
            dispatch(fetchOrderLogsRequest(item.id))
        }
        setSelectedItem(item)
        setDetailActiveTab('items')
    }

    const handleCancel = () => {
        setOrderCancelModelShow(true)
    }

    const handleCloseModal = () => {
        setOrderCancelModelShow(false)
    }

    const handleOrderCancelConfirm = () => {
        dispatch(cancelOrderRequest({ orderId: selectedItem?.id ?? "", reason: cancelReason, updatedBy: user?.id ?? "" }))
    }

    const handleReleaseOrder = () => {
        navigation(`${RouteLinks.MENU_LIST}/${selectedItem?.orderType}`, {
            state: {
                order: selectedItem
            }
        });
    }

    const handleTabChange = (tab: 'history' | 'hold') => {
        setActiveTab(tab)
        setSelectedItem(null)
    }

    const handleChangePage = (_: unknown, newPage: number) => {
        dispatch(pagination(String(newPage + 1)));
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        dispatch(increaseLimit(event.target.value));
    };

    const handlePrint = () => {
        if (selectedItem) {
            generateInvoicePDF({
                order: selectedItem,
                restaurantName: user?.restaurant?.name || 'Restaurant',
                restaurantAddress: `${user?.restaurant?.address?.lane}, ${user?.restaurant?.address?.city}, ${user?.restaurant?.address?.district}, ${user?.restaurant?.address?.country}`,
                restaurantPhone: user?.restaurant?.contactPhoneNumber,
                color: hexToRgbTuple(primaryColor)
            });
        }
    }

    const columns: Column<OrderItemResponse>[] = useMemo(() => [...orderTableData(activeTab, user), {
        key: 'actions',
        label: 'Actions',
        width: '120px',
        align: 'center',
        render: (order) => (
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(order);
                    }}
                    className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all duration-200 hover:scale-110"
                    title="View Details"
                >
                    <Eye className="w-4 h-4" />
                </button>
                {order.status !== OrderStatus.CANCELLED && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(order);
                            setTimeout(() => handlePrint(), 100);
                        }}
                        className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                        title="Print Invoice"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                )}
            </div>
        ),
    }], [activeTab, user]);

    return (
        <div className="relative">
            {/* Main Content */}
            <div className="w-full">

                {/* KPI Dashboard */}
                {activeTab === 'history' && (
                    <QuickStatsBar
                        className="mb-6 border-none! bg-transparent! px-0!"
                        collapsible={false}
                        stats={[
                            {
                                label: 'Pending Orders',
                                value: orderAnalyticsData?.statusCounts?.pending ?? 0,
                                icon: <Clock />,
                                color: 'orange',
                                onClick: () => setStatusFilter(OrderStatus.PENDING),
                                loading: loading
                            },
                            {
                                label: 'Preparing Orders',
                                value: orderAnalyticsData?.statusCounts?.preparing ?? 0,
                                icon: <Flame />,
                                color: 'blue',
                                onClick: () => setStatusFilter(OrderStatus.CONFIRMED),
                                loading: loading
                            },
                            {
                                label: 'Ready for Pickup',
                                value: orderAnalyticsData?.statusCounts?.ready ?? 0,
                                icon: <Package />,
                                color: 'green',
                                onClick: () => setStatusFilter(OrderStatus.READY),
                                loading: loading
                            },
                            {
                                label: 'Completed Today',
                                value: orderAnalyticsData?.statusCounts?.completedToday ?? 0,
                                icon: <CheckCircle />,
                                color: 'gray',
                                loading: loading
                            }
                        ]}
                    />
                )}

                {/* Order Table */}

                <div className="space-y-6">

                    {/* Filter Section */}
                    <OrderFilter
                        orderLength={orders.length}
                        primaryColor={primaryColor}
                        onChangeSearch={setSearchTerm}
                        onChangeTab={handleTabChange}
                        onChangeStatusFilter={setStatusFilter}
                        onChangeOrderTypeFilter={setOrderTypeFilter}
                        onChangePaymentTypeFilter={setPaymentTypeFilter}
                        onChangeDateFrom={setDateFrom}
                        onChangeDateTo={setDateTo}
                    />

                    {loading ? (
                        <TableSkeleton rows={10} columns={activeTab === 'hold' ? 8 : 7} height={600} />
                    ) : (
                        <EnhancedDataTable
                            data={orders as OrderItemResponse[]}
                            columns={columns}
                            onRowClick={handleRowClick}
                            isLoading={false}
                            stickyHeader={true}
                            zebraStripes={true}
                            hoverEffect={true}
                            height={600}
                        />
                    )}

                    <Pagination
                        page={page}
                        limit={limit}
                        total={total}
                        handleChangePage={handleChangePage}
                        handleChangeRowsPerPage={handleChangeRowsPerPage}
                    />
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
            <div className={`fixed top-0 right-0 h-screen w-full md:w-[500px] lg:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${selectedItem ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className='flex flex-col h-full overflow-hidden'>
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
                                {selectedItem?.vehicleNumber && selectedItem?.vehicleModel && selectedItem?.orderType === OrderType.PARKING ? (
                                    <div className="flex items-center gap-2 pl-4 border-l-2 border-gray-200">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Vehicle Details</span>
                                            <div className="flex items-center gap-2 bg-linear-to-r from-gray-900 to-gray-700 text-white pl-2 pr-3 py-1 rounded-md shadow-md animate-in fade-in zoom-in duration-300">
                                                <div className="p-1 bg-white/20 rounded-full">
                                                    <CarIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm border-r border-white/20 pr-2">{selectedItem?.vehicleModel}</span>
                                                    <span className="font-mono font-bold text-amber-400 tracking-wider text-sm">{selectedItem?.vehicleNumber}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className='flex items-center gap-1'>
                                        <TableIcon className="w-4 h-4" />
                                        Table {selectedItem?.tableNo}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 px-6 bg-white sticky top-0 z-10 transition-all">
                        <button
                            onClick={() => setDetailActiveTab('items')}
                            className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-all font-semibold text-sm ${detailActiveTab === 'items'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Order Items
                        </button>
                        {user?.role !== UserRole.KITCHEN_STAFF && user?.role !== UserRole.WAITER && (
                            <button
                                onClick={() => setDetailActiveTab('review')}
                                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-all font-semibold text-sm ml-8 ${detailActiveTab === 'review'
                                    ? 'border-amber-500 text-amber-500'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Star className="w-4 h-4" />
                                Customer Review
                                {rate && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                            </button>
                        )}
                        <button
                            onClick={() => setDetailActiveTab('logs')}
                            className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-all font-semibold text-sm ml-8 ${detailActiveTab === 'logs'
                                ? 'border-primary-500 text-primary-500'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            Activity Logs
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className='flex-1 overflow-hidden h-full relative'>
                        {detailActiveTab === 'items' ? (
                            <ItemTab selectedItem={selectedItem} primaryColor={primaryColor} />

                        ) : detailActiveTab === 'review' ? (
                            <ReviewTab rate={rate} />
                        ) : (
                            <LogsTab orderLogs={orderLogs} />
                        )}
                    </div>

                    {/* Fixed Bottom Action Footer */}
                    <BottomActionFooter
                        loading={loading}
                        detailActiveTab={detailActiveTab}
                        selectedItem={selectedItem}
                        handleReleaseOrder={handleReleaseOrder}
                        handlePrintReceipt={handlePrint}
                        handleCancelOrder={handleCancel}
                    />
                </div>
            </div>

            {/* Cancel Order Modal */}
            <Modal
                isOpen={isOrderCancelModelShow}
                onClose={handleCloseModal}
                title={`Cancel Order ${selectedItem?.id ? `#${selectedItem.id.slice(-8)}` : ''}`}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3" >
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button disabled={cancelReason.length <= 0} variant="danger" onClick={handleOrderCancelConfirm} isLoading={loading}>
                            Confirm Cancellation
                        </Button>
                    </div>
                }
            >
                <div className='space-y-3'>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        <p className="font-semibold mb-1">⚠️ This action cannot be undone</p>
                        <p>Canceling this order will notify the customer and kitchen staff immediately.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason *</label>
                        <TextArea
                            placeholder="Please provide a reason for cancellation..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)} />
                    </div>
                </div>
            </Modal>
        </div >
    );
};
