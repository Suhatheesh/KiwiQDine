import { Calendar, CreditCard, Package, User, UtensilsCrossed, XCircle } from "lucide-react";
import { OrderType, TenantType } from "../utils/constants";
import { FC } from "react";
import { Select } from "./Select";
import { useAuth } from "../hooks/useAuth";

interface CashierFilterProps {
    tables: { value: string, label: string }[];
    filterDate: string;
    onChangeFilterDate: (date: string) => void;
    filterOrderType: string;
    onChangeFilterOrderType: (orderType: string) => void;
    filterCustomerName: string;
    onChangeFilterCustomerName: (customerName: string) => void;
    filterTableNo: string;
    onChangeFilterTableNo: (tableNo: string) => void;
    filterOrderNumber: string;
    onChangeFilterOrderNumber: (orderNumber: string) => void;
}

const CashierFilters: FC<CashierFilterProps> = ({
    tables,
    filterDate,
    onChangeFilterDate,
    filterOrderType,
    onChangeFilterOrderType,
    filterCustomerName,
    onChangeFilterCustomerName,
    filterTableNo,
    onChangeFilterTableNo,
    filterOrderNumber,
    onChangeFilterOrderNumber,
}) => {
    const { user } = useAuth();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Date</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => onChangeFilterDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Order Type</label>
                <div className="relative">
                    <UtensilsCrossed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={filterOrderType}
                        onChange={(e) => onChangeFilterOrderType(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="">All Types</option>
                        <option value={OrderType.DINEIN}>Dine In</option>
                        <option value={OrderType.TAKEAWAY}>Takeaway</option>
                        <option value={OrderType.PARKING}>Parking</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Customer</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Name..."
                        value={filterCustomerName}
                        onChange={(e) => onChangeFilterCustomerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {(user?.restaurantId && user?.tenant?.type === TenantType.RESTAURANT) && (
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Table No</label>
                    <div className="relative">
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Select
                                value={filterTableNo}
                                onChange={(e) => onChangeFilterTableNo(e.target.value)}
                                options={[{ value: "", label: "All" }, ...tables]}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            />
                        </div>
                    </div>
                </div>)}

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Order ID</label>
                <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="#ID..."
                        value={filterOrderNumber}
                        onChange={(e) => onChangeFilterOrderNumber(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {(filterDate || filterOrderType || filterCustomerName || filterTableNo || filterOrderNumber) && (
                <div className="col-span-full flex justify-end">
                    <button
                        onClick={() => {
                            onChangeFilterDate('');
                            onChangeFilterOrderType('');
                            onChangeFilterCustomerName('');
                            onChangeFilterTableNo('');
                            onChangeFilterOrderNumber('');
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                        <XCircle className="w-3 h-3" />
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    )
}

export default CashierFilters