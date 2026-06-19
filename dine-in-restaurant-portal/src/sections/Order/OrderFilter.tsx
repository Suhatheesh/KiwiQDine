import { Search } from "lucide-react";
import { CustomDatePicker } from "../../components/CustomDatePicker";
import { hexToRgba } from "../../utils";
import { OrderStatus, OrderType, PaymentMethod } from "../../utils/constants";
import { FC, useState } from "react";

interface OrderFilterProps {
    orderLength: number;
    primaryColor: string;
    onChangeSearch: (searchTerm: string) => void;
    onChangeDateFrom: (date: string) => void;
    onChangeDateTo: (date: string) => void;
    onChangeStatusFilter: (filter: string) => void;
    onChangePaymentTypeFilter: (filter: string) => void;
    onChangeOrderTypeFilter: (filter: string) => void;
    onChangeTab: (tab: 'history' | 'hold') => void;
}

const OrderFilter: FC<OrderFilterProps> = ({ orderLength, primaryColor, onChangeDateFrom, onChangeOrderTypeFilter, onChangePaymentTypeFilter, onChangeStatusFilter, onChangeTab, onChangeSearch, onChangeDateTo }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('history');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [orderTypeFilter, setOrderTypeFilter] = useState('all');
    const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        onChangeSearch(e.target.value);
    };

    const handleTabChange = (tab: 'history' | 'hold') => {
        setActiveTab(tab);
        onChangeTab(tab);
    };

    const handleDateFromChange = (date: string) => {
        setDateFrom(date);
        onChangeDateFrom(date);
    };

    const handleDateToChange = (date: string) => {
        setDateTo(date);
        onChangeDateTo(date);
    };

    const handleOrderTypeFilterChange = (filter: string) => {
        setOrderTypeFilter(filter);
        onChangeOrderTypeFilter(filter);
    };

    const handlePaymentTypeFilterChange = (filter: string) => {
        setPaymentTypeFilter(filter);
        onChangePaymentTypeFilter(filter);
    };

    const handleStatusFilterChange = (filter: string) => {
        setStatusFilter(filter);
        onChangeStatusFilter(filter);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Filter Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }} className="p-2 rounded-lg">
                        <svg style={{ color: primaryColor }} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                        <p className="text-xs text-gray-500">Refine your search results</p>
                    </div>
                </div>
                {(dateFrom || dateTo || orderTypeFilter !== 'all' || paymentTypeFilter !== 'all' || statusFilter !== 'all') && (
                    <button
                        onClick={() => {
                            handleDateFromChange('');
                            handleDateToChange('');
                            handleOrderTypeFilterChange('all');
                            handlePaymentTypeFilterChange('all');
                            handleStatusFilterChange('all');
                        }}
                        className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear All
                    </button>
                )}
            </div>

            {/* Tab Bar */}
            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 mb-4">
                <button
                    style={{ color: activeTab === 'history' ? primaryColor : '#4a5565' }}
                    onClick={() => handleTabChange('history')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white shadow-sm' : 'hover:text-gray-900'}`}
                >
                    Order History
                </button>
                <button
                    style={{ color: activeTab === 'hold' ? primaryColor : '#4a5565' }}
                    onClick={() => handleTabChange('hold')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'hold' ? 'bg-white shadow-sm' : 'hover:text-gray-900'}`}
                >
                    Order On Hold
                </button>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3 mb-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={handleSearch}
                        onFocus={(e) => (e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`)}
                        onBlur={(e) => (e.target.style.boxShadow = "none")}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-transparent text-sm"
                    />
                </div>

                {/* Date Range Filters */}
                <div className="flex gap-3 items-center">
                    <CustomDatePicker
                        value={dateFrom}
                        onChange={handleDateFromChange}
                        placeholder="From Date"
                    />
                    <span className="text-gray-400 text-sm font-medium">to</span>
                    <CustomDatePicker
                        value={dateTo}
                        onChange={handleDateToChange}
                        placeholder="To Date"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    onFocus={(e) => (e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`)}
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-transparent text-sm min-w-[140px]"
                >
                    <option value="all">All Status</option>
                    <option value={OrderStatus.PENDING}>Pending</option>
                    <option value={OrderStatus.READY}>Ready</option>
                    <option value={OrderStatus.COMPLETED}>Completed</option>
                    <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                    <option value={OrderStatus.CANCELLED}>Cancelled</option>
                </select>

                {/* Order Type Filter */}
                <select
                    value={orderTypeFilter}
                    onChange={(e) => handleOrderTypeFilterChange(e.target.value)}
                    onFocus={(e) => (e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`)}
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-transparent text-sm min-w-[150px]"
                >
                    <option value="all">All Order Types</option>
                    <option value={OrderType.DINEIN}>Dine In</option>
                    <option value={OrderType.TAKEAWAY}>Takeaway</option>
                    <option value={OrderType.PARKING}>Parking</option>
                </select>

                {/* Payment Type Filter */}
                <select
                    value={paymentTypeFilter}
                    onChange={(e) => handlePaymentTypeFilterChange(e.target.value)}
                    onFocus={(e) => (e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`)}
                    onBlur={(e) => (e.target.style.boxShadow = "none")}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-transparent text-sm min-w-[160px]"
                >
                    <option value="all">All Payment Types</option>
                    <option value={PaymentMethod.CASH}>Cash</option>
                    <option value={PaymentMethod.CARD}>Card</option>
                    <option value={PaymentMethod.QR}>QR</option>
                    <option value={PaymentMethod.CASHIER}>Cashier</option>
                </select>
            </div>

            {/* Active Filters Tags */}
            {(statusFilter !== 'all' || orderTypeFilter !== 'all' || paymentTypeFilter !== 'all' || dateFrom || dateTo) && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Active Filters:</span>

                    {statusFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200">
                            Status: {statusFilter}
                            <button onClick={() => handleStatusFilterChange('all')} className="hover:text-blue-900">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    )}

                    {orderTypeFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-200">
                            Order Type: {orderTypeFilter === OrderType.DINEIN ? 'Dine In' : 'Takeaway'}
                            <button onClick={() => handleOrderTypeFilterChange('all')} className="hover:text-purple-900">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    )}

                    {paymentTypeFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-md border border-orange-200">
                            Payment: {paymentTypeFilter}
                            <button onClick={() => handlePaymentTypeFilterChange('all')} className="hover:text-orange-900">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    )}

                    {dateFrom && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-200">
                            From: {dateFrom}
                            <button onClick={() => handleDateFromChange('')} className="hover:text-green-900">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    )}

                    {dateTo && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-200">
                            To: {dateTo}
                            <button onClick={() => handleDateToChange('')} className="hover:text-green-900">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Results Count */}
            <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{orderLength}</span> of <span className="font-semibold text-gray-900">{orderLength}</span> orders
                </p>
            </div>
        </div>
    )
}

export default OrderFilter