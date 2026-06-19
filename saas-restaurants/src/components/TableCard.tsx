import { FC } from "react";
import { Table } from "../features/tables/types";
import { TableStatus } from "../utils/constants";

interface TableCardProps {
    table: Table;
    index: number;
    handleViewQR: () => void;
}

const TableCard: FC<TableCardProps> = ({ table, index, handleViewQR }) => {

    const getTableShape = (index: number) => {
        return index % 3 === 1 ? 'rounded-full' : 'rounded-2xl';
    };

    return (
        <div
            key={table.id}
            onClick={handleViewQR}
            className={`group relative bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-2xl border-2`}
        >
            {/* Status Badge - Top Right */}
            <div className="absolute top-3 right-3">
                <div
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${table.status === TableStatus.AVAILABLE
                        ? 'bg-green-500'
                        : table.status === TableStatus.OCCUPIED
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                        }`}
                >
                    {table.status === TableStatus.AVAILABLE ? '✓' : '●'}
                </div>
            </div>

            {/* Table Visual */}
            <div className="flex flex-col items-center gap-4 mb-4">
                <div
                    className={`relative w-28 h-28 ${getTableShape(
                        index
                    )} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-gray-300 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
                >
                    {/* Table Number */}
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-700 transition-colors">
                            {table.tableNumber}
                        </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 rounded-inherit transition-opacity"></div>
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
            <div className="absolute mx-1 bottom-0 left-0 right-0 h-1 bg-gradient-to-r rounded-b-full from-blue-500 to-purple-500"></div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 rounded-2xl bg-blue-400 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"></div>
        </div>
    )
}

export default TableCard