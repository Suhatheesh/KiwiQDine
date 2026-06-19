import { FC, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button } from "./Button";
import { OrderItems } from "../features/orders/types";
import { OrderStatus } from "../utils/constants";
import { calculateRemainingTime, formatRemainingTime, getTimeStatusColor } from "../utils/timeUtils";
import { Clock } from "lucide-react";
import PrepTimeEditor from "./PrepTimeEditor";
import { AppDispatch } from "../app/store";
import { updatePreparationTimeRequest } from "../features/kitchen/kitchenSlice";
import { KitchenItemSkeleton } from "./CustomSkeleton";

interface KitchenItemProps {
    userId?: string;
    item: OrderItems;
    orderStatus: string;
    isEditingTimeLoading?: boolean;
    onStatusClick?: (status: string, itemId: string) => void;
}

const KitchenItem: FC<KitchenItemProps> = ({ userId, item, orderStatus, isEditingTimeLoading, onStatusClick }) => {
    const dispatch = useDispatch<AppDispatch>();

    const [remainingTime, setRemainingTime] = useState<number | null>(
        calculateRemainingTime(item)
    );
    const [isEditingTime, setIsEditingTime] = useState(false);

    useEffect(() => {
        setRemainingTime(calculateRemainingTime(item));
        const interval = setInterval(() => {
            setRemainingTime(calculateRemainingTime(item));
            if (remainingTime === 0) {
                clearInterval(interval);
                return;
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [item.startedAt, item.estimatedPreparationTime, item.status]);

    const validateButtonLabel = () => {
        switch (item.status) {
            case OrderStatus.PENDING:
                return "Start Preparing"
            case OrderStatus.INPROGRESS:
                return "Mark it Ready"
            case OrderStatus.READY:
                return "Ready"
        }
    }

    const validateButtonColor = () => {
        switch (item.status) {
            case OrderStatus.PENDING:
                return "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            case OrderStatus.INPROGRESS:
                return "from-green-400 to-green-300 hover:from-green-300 hover:to-green-400 text-green"
            case OrderStatus.READY:
                return "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
        }
    }

    const getStatusBadgeColor = () => {
        switch (item.status) {
            case OrderStatus.PENDING:
                return "from-orange-400 to-orange-500"
            case OrderStatus.INPROGRESS:
                return "from-orange-500 to-orange-600"
            case OrderStatus.READY:
                return "from-green-500 to-green-600"
            default:
                return "from-gray-400 to-gray-500"
        }
    }

    const handleAdditionalTimeUpdate = useCallback((newTime: number) => {
        if (userId) {
            dispatch(updatePreparationTimeRequest({
                orderItemId: item.id ?? "",
                additionalPreparationTime: newTime,
                status: OrderStatus.INPROGRESS,
                updatedBy: userId
            }));
        }
        setIsEditingTime(false);
    }, [])

    if (isEditingTimeLoading) {
        return (
            <KitchenItemSkeleton />
        );
    }

    return (
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all hover-lift animate-scale-in mb-5">
            <div className="flex items-center space-x-4 border-b border-gray-200 pb-4">
                <div className="flex flex-1 space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-linear-to-br ${getStatusBadgeColor()} text-white items-center justify-center flex font-bold text-lg shadow-md`}>
                        {item.menuImage ? (
                            <img src={item.menuImage} alt={item.menuName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            item.quantity
                        )}
                    </div>
                    <div className="flex flex-col flex-1 text-left">
                        <p className="font-semibold text-gray-900 text-lg">{item.menuName}</p>
                        <p className="text-sm text-gray-600">Quantity : {item.quantity}x item</p>
                        <p className="text-sm text-gray-600">{item.specialInstructions?.portion}</p>

                        {/* Countdown Timer Display */}
                        {item.status === OrderStatus.INPROGRESS && remainingTime !== null && (
                            <div className={`flex items-center gap-1.5 mt-2 ${getTimeStatusColor(remainingTime)} font-semibold text-sm`}>
                                <Clock className="w-4 h-4" />
                                <span>
                                    {remainingTime === 0 ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                                                <span className="text-red-600 font-bold animate-pulse">⚠️ Overdue!</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>🔥 {formatRemainingTime(remainingTime)} remaining</>
                                    )}
                                </span>
                            </div>
                        )}

                        {item.status === OrderStatus.PENDING && item.estimatedPreparationTime && (
                            <div className="flex items-center gap-1.5 mt-2 text-gray-500 text-sm">
                                <Clock className="w-4 h-4" />
                                <span>Est. {item.estimatedPreparationTime} min</span>
                            </div>
                        )}

                        {item.status === OrderStatus.READY && (
                            <div className="flex items-center gap-1.5 mt-2 text-green-600 font-semibold text-sm">
                                <span>✅ Ready to serve!</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Button
                        className={`bg-linear-to-r ${validateButtonColor()} shadow-sm transition-all px-4 py-2 rounded-lg font-medium text-sm`}
                        onClick={() => onStatusClick && onStatusClick(item.status ?? OrderStatus.PENDING, item.id ?? "")}
                        disabled={(item.status === OrderStatus.READY && orderStatus !== OrderStatus.PREPARING)}
                    >
                        {validateButtonLabel()}
                    </Button>
                    {item.status === OrderStatus.INPROGRESS && (
                        <Button
                            variant="secondary"
                            className={`bg-gray-200 text-gray-700 shadow-sm transition-all px-4 py-2 rounded-lg font-medium text-sm`}
                            onClick={() => setIsEditingTime(true)}
                        >
                            Update the time
                        </Button>
                    )}
                </div>
            </div>
            {item.specialInstructions && item.specialInstructions.note && (
                <div className="pt-4 flex items-start space-x-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                    <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <div>
                        <p className="text-xs font-semibold text-amber-900 mb-1">Special Note</p>
                        <p className="text-sm text-amber-800">{item.specialInstructions.note}</p>
                    </div>
                </div>
            )}
            {item.addons && item.addons.length > 0 && (
                <div className="pt-4 flex flex-col space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-xs font-semibold text-blue-900">Add-ons</p>
                    </div>
                    <div className="ml-7 space-y-1">
                        {item.addons.map((addon, idx) => (
                            <p key={idx} className="text-sm text-blue-800">
                                • {addon.name}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Preparation Time Editor Modal */}
            {isEditingTime && item.estimatedPreparationTime && (
                <PrepTimeEditor
                    currentTime={1}
                    onSave={handleAdditionalTimeUpdate}
                    onCancel={() => setIsEditingTime(false)}
                />
            )}
        </div>
    )
}

export default KitchenItem;