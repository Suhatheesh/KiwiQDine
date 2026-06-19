import { X, QrCode, Edit, Plus, ClipboardList } from "lucide-react";
import { Button } from "../../components/Button";
import { Select } from "../../components/Select";
import { TableStatus } from "../../utils/constants";
import { FC } from "react";
import { Table } from "../../features/tables/types";

interface SelectedTablePanelProps {
    selectedTable: Table;
    onAction: (action: 'edit' | 'delete' | 'viewQR') => void;
    onPlaceOrder: () => void;
    onClose: () => void;
    onHandleTableStatusChange: (status: string) => void;
    onViewOrder: () => void;
}

const SelectedTablePanel: FC<SelectedTablePanelProps> = ({ selectedTable, onAction, onPlaceOrder, onClose, onHandleTableStatusChange, onViewOrder }) => {
    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Premium Header with Indigo-Purple Gradient */}
            <div className="relative p-6 pb-8 bg-linear-to-br from-indigo-500 via-purple-500 to-indigo-600">
                <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30 shadow-lg">
                            <span className="text-2xl font-bold text-white">{selectedTable.tableNumber}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                {selectedTable.name}
                            </h3>
                            <p className="text-sm text-white/90 font-medium capitalize">Table Status</p>
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Status Badge */}
                <div className="absolute bottom-4 right-6">
                    <div
                        className={`px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm border-2 border-white/30 ${selectedTable.status === TableStatus.AVAILABLE
                            ? 'bg-green-500/90'
                            : selectedTable.status === TableStatus.OCCUPIED
                                ? 'bg-red-500/90'
                                : 'bg-gray-500/90'
                            }`}
                    >
                        {selectedTable.status === TableStatus.AVAILABLE ? '✓ Available' :
                            selectedTable.status === TableStatus.OCCUPIED ? '● Occupied' :
                                selectedTable.status}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-col flex-1 p-6 space-y-6">
                {/* Premium Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Capacity Card */}
                    <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <span className="text-xs font-semibold uppercase text-indigo-700">Capacity</span>
                        </div>
                        <p className="text-2xl font-bold text-indigo-600">{selectedTable.capacity}</p>
                        <p className="text-xs mt-1 text-indigo-500 font-medium">guests</p>
                    </div>

                    {/* Floor Card */}
                    <div className="bg-linear-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <span className="text-xs font-semibold uppercase text-purple-700">Floor</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">{selectedTable.location.floor}</p>
                        <p className="text-xs mt-1 text-purple-500 font-medium">level</p>
                    </div>
                </div>

                {/* Section Card */}
                <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-orange-700 uppercase mb-1">Section</p>
                            <p className="text-lg font-bold text-orange-900">{selectedTable.location.section}</p>
                        </div>
                    </div>
                </div>

                {/* Status Selector */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <label className="text-xs font-semibold text-gray-700 uppercase mb-2 block">Update Status</label>
                    <Select
                        value={selectedTable.status}
                        options={[
                            { value: TableStatus.AVAILABLE, label: '✓ Available' },
                            { value: TableStatus.OCCUPIED, label: '● Occupied' },
                            { value: TableStatus.RESERVED, label: '◐ Reserved' },
                            { value: TableStatus.MAINTENANCE, label: '🔧 Maintenance' },
                        ]}
                        onChange={(e) => onHandleTableStatusChange(e.target.value)}
                    />
                </div>

                {/* Premium Action Buttons */}
                <div className="flex flex-1 flex-col items-end justify-end pt-2 space-y-3">
                    {selectedTable.status === TableStatus.OCCUPIED && selectedTable.orderStatus.activeOrders.length > 0 && (
                        <Button
                            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all font-bold py-3"
                            onClick={onViewOrder}
                        >
                            <ClipboardList className="w-5 h-5 mr-2" />
                            View Active Order
                        </Button>
                    )}
                    <Button
                        disabled={selectedTable.status === TableStatus.MAINTENANCE}
                        className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all font-bold py-3"
                        onClick={onPlaceOrder}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Select & Place Order
                    </Button>
                    <Button
                        className="w-full bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all font-semibold"
                        onClick={() => onAction('viewQR')}
                    >
                        <QrCode className="w-5 h-5 mr-2" />
                        View QR Code
                    </Button>
                    <div className="flex w-full gap-3">
                        <Button
                            className="flex-1 bg-slate-700 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all font-semibold"
                            onClick={() => onAction('edit')}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1 shadow-md hover:shadow-lg transition-all font-semibold"
                            onClick={() => onAction('delete')}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectedTablePanel;
