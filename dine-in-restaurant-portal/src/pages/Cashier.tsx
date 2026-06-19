import { useLayoutEffect, useMemo, useState } from 'react';
import { PhoneIcon, Search, DollarSign, ShoppingCart, TrendingUp, Eye } from 'lucide-react';
import { EnhancedDataTable, Column } from '../components/ui/DataTable';
import { QuickStatsBar } from '../components/ui/Card/QuickStatsBar';
import { TableSkeleton } from '../components/ui/Skeleton/TableSkeleton';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { fetchAllOrdersRequest, increaseLimit, pagination, resetPagination, updateOrderStatus } from '../features/orders/ordersSlice';
import { OrderItemResponse } from '../features/orders/types';
import { formatCurrency, hexToRgba, hexToRgbTuple } from '../utils';
import { useNavigate } from 'react-router-dom';
import { RouteLinks } from '../routers/type';
import SocketService from '../services/SocketService';
import { OrderStatus, PaymentMethod, PaymentStatus, PaymentTiming, TenantType } from '../utils/constants';
import { Button } from '../components/Button';
import Pagination from '../components/Pagination';
import { StarRating } from '../components/StarRating';
import { fetchOrderRateRequest } from '../features/rates/rateSlice';
import { useAuth } from '../hooks/useAuth';
import { fetchOrderAnalyticsDataRequest } from '../features/analytics/analyticsSlice';
import { fetchCashierOrdersRequest } from '../features/cashier/cashierSlice';
import CashierFilters from '../components/CashierFilters';
import { fetchTablesRequest } from '../features/tables/tablesSlice';
import { cashierTableColumn } from '../lib/CashierTableColumn';
import { generateInvoicePDF } from '../utils/invoiceGenerator';

export const Cashier = () => {

    const { primaryColor, user } = useAuth()
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<OrderItemResponse | null>(null);
    const [activeTab, setActiveTab] = useState<'todayorder' | 'allhistory' | 'todayhistory'>('todayorder');

    // Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [filterOrderType, setFilterOrderType] = useState('');
    const [filterCustomerName, setFilterCustomerName] = useState('');
    const [filterTableNo, setFilterTableNo] = useState('');
    const [filterOrderNumber, setFilterOrderNumber] = useState('');

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { data: cashierOrders, loading } = useSelector((state: RootState) => state.cashier);
    const { data: orders, limit, total, page } = useSelector((state: RootState) => state.orders);
    const { rate } = useSelector((state: RootState) => state.rate);
    const { orderAnalyticsData } = useSelector((state: RootState) => state.analytics);
    const { data: tables } = useSelector((state: RootState) => state.tables);

    useLayoutEffect(() => {
        if (user?.restaurantId && user?.tenant?.type === TenantType.RESTAURANT) {
            dispatch(fetchTablesRequest({ restaurantId: user.restaurantId }));
        }
    }, [dispatch, user]);

    useLayoutEffect(() => {
        const socket = SocketService.getInstance();
        socket.on("order-status", 'order_status_update', (data: any) => {
            dispatch(updateOrderStatus({ orderId: data.orderId, status: data.status }))
        });
        socket.on("order-status", 'new_order', () => {
            const status =
                user?.restaurant?.paymentTiming === PaymentTiming.PAY_AT_LAST
                    ? OrderStatus.SERVED
                    : OrderStatus.CONFIRMED;
            dispatch(fetchAllOrdersRequest({ date: new Date().toISOString().split("T")[0], paymentStatus: PaymentStatus.PENDING, page: Number(page), limit: Number(limit), status: status }))
        });
        return () => {
            socket.off('order-status', 'order_status_update');
            socket.off("order-status", 'new_order');
        };
    }, [dispatch])

    useLayoutEffect(() => {
        if (activeTab === 'allhistory') {
            dispatch(fetchAllOrdersRequest({ paymentStatus: PaymentStatus.PAID, page: Number(page), limit: Number(limit) }))
        } else if (activeTab === 'todayorder') {
            if (user?.restaurant?.paymentTiming === PaymentTiming.PAY_AT_LAST) {
                dispatch(fetchCashierOrdersRequest({
                    restaurantId: user?.restaurant?.id ?? "",
                    page: Number(page),
                    limit: Number(limit),
                    date: filterDate,
                    orderType: filterOrderType,
                    customerName: filterCustomerName,
                    tableNo: filterTableNo,
                    orderNumber: filterOrderNumber
                }));
            } else {
                dispatch(fetchAllOrdersRequest({ date: new Date().toISOString().split("T")[0], paymentStatus: PaymentStatus.PENDING, page: Number(page), limit: Number(limit) }))
            }
        } else {
            dispatch(fetchAllOrdersRequest({ date: new Date().toISOString().split("T")[0], paymentStatus: PaymentStatus.PAID, page: Number(page), limit: Number(limit) }))
        }
    }, [dispatch, activeTab, page, limit, filterDate, filterOrderType, filterCustomerName, filterTableNo, filterOrderNumber])

    useLayoutEffect(() => {
        dispatch(fetchOrderAnalyticsDataRequest({ restaurantId: user?.restaurant?.id ?? "" }))
    }, [dispatch, user])

    useLayoutEffect(() => {
        return () => { dispatch(resetPagination()); }
    }, [dispatch])

    const handleRowClick = (item: OrderItemResponse) => {
        if (item.status === OrderStatus.COMPLETED && item.id) {
            dispatch(fetchOrderRateRequest(item.id))
        }
        setSelectedItem(item)
    }

    const handleProcessPayment = () => {
        navigate(`${RouteLinks.CASHIER}/${RouteLinks.PAYMENTS}/${selectedItem?.id}`)
    }

    const handleChangePage = (_: unknown, newPage: number) => {
        dispatch(pagination(String(newPage + 1)));
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        dispatch(increaseLimit(event.target.value));
    };

    const handleTabClick = (type: 'todayorder' | 'allhistory' | 'todayhistory') => {
        setSelectedItem(null);
        setActiveTab(type);
    }

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

    const columns: Column<OrderItemResponse>[] = useMemo(() => [...cashierTableColumn, {
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
                {order.paymentStatus === 'pending' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${RouteLinks.CASHIER}/${RouteLinks.PAYMENTS}/${order.id}`);
                        }}
                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-200 hover:scale-110"
                        title="Process Payment"
                    >
                        <DollarSign className="w-4 h-4" />
                    </button>
                )}
            </div>
        ),
    },], [navigate, handleRowClick]);

    const filterOrderList = useMemo(() => {
        if (user?.restaurant?.paymentTiming === PaymentTiming.PAY_AT_LAST && activeTab === 'todayorder') {
            return cashierOrders;
        }
        return orders;
    }, [user, cashierOrders, orders, activeTab])

    return (
        <div className="flex flex-col overflow-hidden">
            <div className={`w-full`}>

                <div>
                    {/* Search and Filter Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                {/* Tab Bar */}
                                <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                                    <button
                                        style={{ backgroundColor: activeTab === 'allhistory' ? hexToRgba(primaryColor, 0.1) : 'transparent', color: activeTab === 'allhistory' ? primaryColor : '#4a5565' }}
                                        onClick={() => handleTabClick('allhistory')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'allhistory' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
                                    >
                                        Sales History
                                    </button>
                                    <button
                                        style={{ backgroundColor: activeTab === 'todayorder' ? hexToRgba(primaryColor, 0.1) : 'transparent', color: activeTab === 'todayorder' ? primaryColor : '#4a5565' }}
                                        onClick={() => handleTabClick('todayorder')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'todayorder' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
                                    >
                                        Today Pending Payments
                                    </button>
                                    <button
                                        style={{ backgroundColor: activeTab === 'todayhistory' ? hexToRgba(primaryColor, 0.1) : 'transparent', color: activeTab === 'todayhistory' ? primaryColor : '#4a5565' }}
                                        onClick={() => handleTabClick('todayhistory')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'todayhistory' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
                                    >
                                        Today Sales History
                                    </button>
                                </div>

                                <div className="flex gap-4 items-center">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${showFilters ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <TrendingUp className="w-4 h-4 rotate-90" /> {/* Using TrendingUp rotated as a filter icon placeholder if 'Filter' is not imported, but let's assume I can use existing icons. Replace with list icon if needed. Actually I'll use 'List' or specific filter icon if available, but for now reuse existing. Changing to 'List' or just text "Filters" */}
                                        <span className="text-sm font-medium">Filters</span>
                                    </button>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Filter Panel */}
                            {showFilters && (
                                <CashierFilters
                                    tables={tables ? tables.map((table) => ({ value: table.tableNumber, label: table.name })) : []}
                                    filterDate={filterDate}
                                    filterOrderType={filterOrderType}
                                    filterCustomerName={filterCustomerName}
                                    filterTableNo={filterTableNo}
                                    filterOrderNumber={filterOrderNumber}
                                    onChangeFilterDate={setFilterDate}
                                    onChangeFilterOrderType={setFilterOrderType}
                                    onChangeFilterCustomerName={setFilterCustomerName}
                                    onChangeFilterTableNo={setFilterTableNo}
                                    onChangeFilterOrderNumber={setFilterOrderNumber}
                                />
                            )}
                        </div>
                    </div>

                    {/* Today's Sales Section */}
                    <div className="mt-3">
                        <QuickStatsBar
                            type="cashier"
                            stats={[
                                {
                                    label: "Today's Sales",
                                    value: formatCurrency(orderAnalyticsData?.summary.totalRevenue ?? 0),
                                    icon: <DollarSign className="w-5 h-5" />,
                                    color: 'green',
                                },
                                {
                                    label: 'Total Orders',
                                    value: orderAnalyticsData?.summary.totalOrders ?? 0,
                                    icon: <ShoppingCart className="w-5 h-5" />,
                                    color: 'blue',
                                },
                                {
                                    label: 'Avg. Order Value',
                                    value: formatCurrency(orderAnalyticsData?.summary.averageOrderValue ?? 0),
                                    icon: <TrendingUp className="w-5 h-5" />,
                                    color: 'orange',
                                },
                            ]}
                            collapsible={true}
                            defaultCollapsed={false}
                        />
                    </div>

                    {/* Data Table - Scrollable */}
                    <div className="flex-1 overflow-hidden mt-3">
                        {loading ? (
                            <TableSkeleton rows={10} columns={9} height={600} />
                        ) : (
                            <EnhancedDataTable
                                data={filterOrderList as OrderItemResponse[]}
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
                                onClick={() => setSelectedItem(null)}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Customer Rating Section */}
                        {rate && (
                            <div className="mx-6 mt-4 p-4 bg-linear-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 p-2 bg-white rounded-lg shadow-sm">
                                        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-gray-800 mb-1">Customer Rating</h4>
                                        <StarRating rating={rate.rating} showLabel={true} size="md" />
                                        {rate.comment && (
                                            <p className="mt-2 text-sm text-gray-700 italic bg-white p-3 rounded-lg border border-amber-200">
                                                "{rate.comment}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

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
                                <div className="pt-2 border-t border-dashed border-gray-200" />
                                <div className='flex justify-between text-xl'>
                                    <p className='font-bold'>Grand Total</p>
                                    <p className='font-bold'>{formatCurrency(Number(selectedItem?.totalAmount))}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}

                            <div className='flex space-x-2'>
                                {(selectedItem?.paymentStatus?.toLowerCase() === PaymentStatus.PENDING ||
                                    selectedItem?.status === OrderStatus.PENDING) && (
                                        <Button onClick={handleProcessPayment} size='lg' className='flex flex-1 mt-2 cursor-pointer  bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'>
                                            <p>Process Payment</p>
                                        </Button>

                                    )}
                                {selectedItem && selectedItem.paymentStatus === PaymentStatus.PAID && (
                                    <Button onClick={handlePrint} size='lg' className='flex-1 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'>
                                        Print Invoice
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};
