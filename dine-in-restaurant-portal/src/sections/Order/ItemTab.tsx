import { Clock, Flame, CheckCircle, XCircle, Package } from "lucide-react";
import { hexToRgba, formatCurrency } from "../../utils";
import { FC } from "react";
import { OrderItemResponse } from "../../features/orders/types";

interface ItemTabProps {
    selectedItem?: OrderItemResponse | null;
    primaryColor: string;
}

const ItemTab: FC<ItemTabProps> = ({ selectedItem, primaryColor }) => {
    return (
        <div className='flex flex-col h-full'>
            <div className='flex-1 overflow-y-auto p-6 custom-scrollbar'>
                <div className='space-y-2.5'>
                    {selectedItem && selectedItem.itemsByCategory ? selectedItem.itemsByCategory.map((mainItem, i) => (
                        <div key={i} className="space-y-2.5">
                            {mainItem.items.map((item, j) => {
                                const itemStatusConfig: Record<string, { label: string, color: string, textColor: string, borderColor: string, icon: any }> = {
                                    'pending': { label: 'Pending', color: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200', icon: Clock },
                                    'preparing': { label: 'Cooking', color: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', icon: Flame },
                                    'ready': { label: 'Ready', color: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200', icon: CheckCircle },
                                    'served': { label: 'Served', color: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200', icon: CheckCircle },
                                    'cancelled': { label: 'Cancelled', color: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200', icon: XCircle },
                                };

                                const status = item.status || 'pending';
                                const config = itemStatusConfig[status] || itemStatusConfig.pending;
                                const StatusIcon = config.icon;

                                // Calculate progress and estimated completion time
                                const now = new Date().getTime();
                                const startTime = item.startedAt ? new Date(item.startedAt).getTime() : now;
                                const estimatedMs = (item.estimatedPreparationTime || 0) * 60000;
                                const elapsedMs = now - startTime;
                                const progress = item.startedAt && item.estimatedPreparationTime
                                    ? Math.min(Math.round((elapsedMs / estimatedMs) * 100), 100)
                                    : 0;

                                // Calculate estimated ready time
                                const estimatedReadyTime = status === 'preparing' && item.startedAt && item.estimatedPreparationTime
                                    ? new Date(startTime + estimatedMs)
                                    : null;

                                return (
                                    <div key={j} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                                        <div className="flex gap-2.5">
                                            {/* Quantity Badge */}
                                            <div
                                                style={{ color: primaryColor, backgroundColor: hexToRgba(primaryColor, 0.1) }}
                                                className='flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm shrink-0'
                                            >
                                                {item.quantity}×
                                            </div>

                                            <div className='flex-1 min-w-0'>
                                                {/* Item Name & Price */}
                                                <div className="flex justify-between items-start gap-2 mb-1.5">
                                                    <h4 className='font-semibold text-gray-900 text-sm leading-tight'>{item.menuName}</h4>
                                                    <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">{formatCurrency(parseInt(item.totalPrice ?? "0"))}</span>
                                                </div>

                                                {/* Status & Timing Info */}
                                                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${config.color} ${config.textColor} border ${config.borderColor} text-xs font-medium`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {config.label}
                                                    </div>


                                                    {/* Estimated Ready Time for Cooking Items */}
                                                    {estimatedReadyTime && (
                                                        <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Ready by {estimatedReadyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}

                                                    {/* Estimated Time for Pending Items */}
                                                    {item.estimatedPreparationTime && status === 'pending' && (
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            ~{item.estimatedPreparationTime} min
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Progress Bar for Cooking Items */}
                                                {status === 'preparing' && item.startedAt && item.estimatedPreparationTime && (
                                                    <div className="mb-1.5">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <span className="text-xs text-gray-500">Progress</span>
                                                            <span className="text-xs text-blue-600 font-semibold">{progress}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Add-ons */}
                                                {item.addons && item.addons.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-1">
                                                        {item.addons.map((addon: any, k: number) => (
                                                            <span key={k} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                                                                + {addon.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Special Instructions */}
                                                {item.specialInstructions?.portion && (
                                                    <p className='text-xs text-gray-500 italic'>
                                                        {item.specialInstructions.portion}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )) : (
                        <div className="text-center py-12 text-gray-400">
                            <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No items found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ItemTab