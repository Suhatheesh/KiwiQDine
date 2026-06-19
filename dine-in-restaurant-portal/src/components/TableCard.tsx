import { FC } from "react";
import { Table } from "../features/tables/types";
import { TableStatus } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";
import { hexToRgba } from "../utils";
import { Clock } from "lucide-react";

interface TableCardProps {
    table: Table;
    index: number;
    selectedTable: Table | null;
    setSelectedTable: (table: Table | null) => void;
}

const TableCard: FC<TableCardProps> = ({ table, index, selectedTable, setSelectedTable }) => {
    const { primaryColor } = useAuth();

    const getTableShape = (index: number) => {
        return index % 3 === 1 ? 'rounded-full' : 'rounded-2xl';
    };

    return (
        <div
            key={table.id}
            onClick={() => setSelectedTable(table)}
            style={{
                borderColor: selectedTable?.id === table.id ? primaryColor : '',
                boxShadow: selectedTable?.id === table.id ? `0 0 0 4px ${hexToRgba(primaryColor, 0.1)}` : ''
            }}
            className={`group relative bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-2xl border-2 ${selectedTable?.id === table.id
                ? 'shadow-xl scale-105'
                : 'border-gray-100'
                }`}
        >
            {/* Pending Order Label - Top Left */}
            {table.orderStatus?.hasPendingOrders && (
                <div className="absolute -top-2 -left-2 z-10">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-200 ring-2 ring-white transform transition-transform hover:scale-105">
                        <Clock className="w-3 h-3 animate-pulse" strokeWidth={3} />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider">Pending</span>
                    </div>
                </div>
            )}

            {/* Status Badge - Top Right */}
            <div className="absolute top-3 right-3">
                <div
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${table.status === TableStatus.AVAILABLE
                        ? 'bg-linear-to-r from-green-500 to-green-600'
                        : table.status === TableStatus.OCCUPIED
                            ? 'bg-linear-to-r from-red-500 to-red-600'
                            : 'bg-linear-to-r from-gray-500 to-gray-600'
                        }`}
                >
                    {table.status === TableStatus.AVAILABLE ? '✓' : '●'}
                </div>
            </div>

            {/* Table Visual */}
            <div className="flex flex-col items-center gap-4 mb-4">
                <div
                    style={{
                        background: selectedTable?.id === table.id
                            ? `linear-gradient(to bottom right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})`
                            : 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)',
                        borderColor: selectedTable?.id === table.id ? hexToRgba(primaryColor, 0.5) : '#d1d5db'
                    }}
                    className={`relative w-28 h-28 ${getTableShape(
                        index
                    )} flex items-center justify-center border-4 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
                >
                    {/* Table Number */}
                    <div className="text-center">
                        <div
                            className={`text-2xl font-bold ${selectedTable?.id === table.id
                                ? 'text-white'
                                : 'text-gray-700'
                                } transition-colors`}
                        >
                            {table.tableNumber}
                        </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div style={{ backgroundColor: primaryColor }} className="absolute inset-0 opacity-0 group-hover:opacity-10 rounded-inherit transition-opacity"></div>
                </div>
            </div>

            {/* Table Info */}
            <div className="space-y-2">
                <h3 className="font-bold text-gray-800 text-center text-sm truncate">
                    {table.name}
                </h3>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">{table.capacity} seats</span>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{table.location.section}</span>
                </div>
            </div>

            {/* Selection Indicator */}
            {selectedTable?.id === table.id && (
                <div style={{ background: `linear-gradient(to right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 1)})` }} className="absolute mx-1 bottom-0 left-0 right-0 h-1 rounded-b-full"></div>
            )}

            {/* Hover Glow Effect */}
            <div style={{ backgroundColor: primaryColor }} className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"></div>
        </div>
    )
}

export default TableCard