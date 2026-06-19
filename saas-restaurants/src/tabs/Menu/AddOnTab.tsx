import { FC } from "react";
import { AddOn } from "../../features/addOns/types";
import { CategoryCardSkeleton } from "../../components/CustomSkeleton";
import EmptyState from "../../components/EmptyState";
import { FolderOpen, Pencil, Trash2, Package } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../utils/constants";

interface AddOnTabProps {
    dataList: AddOn[];
    loading?: boolean;
    onEdit?: (addOn: AddOn) => void;
    onDelete?: (id: string) => void;
}

const AddOnTab: FC<AddOnTabProps> = ({ dataList, loading, onEdit, onDelete }) => {
    const { user } = useAuth();
    const canEdit = user?.role !== UserRole.WAITER && user?.role !== UserRole.KITCHEN_STAFF;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-flow-row gap-4">
            {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                    <CategoryCardSkeleton key={index} />
                ))
            ) : dataList.length === 0 ? (
                <div className="col-span-full">
                    <EmptyState
                        icon={FolderOpen}
                        title="No Add-ons found"
                        description="Create a new add-on to offer extra options to your customers."
                    />
                </div>
            ) : (
                dataList.map((addOn) => (
                    <div
                        key={addOn.id}
                        className="group flex flex-col bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-100 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        {/* Header: Name and Actions */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 flex-1">
                                <div className="p-1.5 bg-blue-50 rounded-lg">
                                    <Package className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{addOn.name}</h3>
                            </div>

                            {canEdit && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => onEdit && onEdit(addOn)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                        title="Edit Add-on"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => onDelete && onDelete(addOn.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                        title="Delete Add-on"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                            {addOn.description}
                        </p>

                        {/* Price and Quantity Badges */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                NZD {addOn.unitPrice}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Qty: {addOn.quantity}
                            </span>
                        </div>

                        {/* Linked Menus */}
                        {addOn.menus && addOn.menus.length > 0 && (
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-600 mb-1.5">Available on:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {addOn.menus.slice(0, 3).map((menu) => (
                                        <span
                                            key={menu.id}
                                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-50 text-gray-700 border border-gray-200"
                                        >
                                            {menu.name}
                                        </span>
                                    ))}
                                    {addOn.menus.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-50 text-gray-500">
                                            +{addOn.menus.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default AddOnTab;
