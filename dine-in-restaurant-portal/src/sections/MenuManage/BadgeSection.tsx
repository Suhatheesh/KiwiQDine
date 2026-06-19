import { FC, useState, useMemo } from "react";
import { Badge } from "../../features/menuItems/types";
import { CategoryCardSkeleton } from "../../components/CustomSkeleton";
import EmptyState from "../../components/EmptyState";
import { FolderOpen, Pencil, Trash2, Tag, Search, ShieldCheck, Sparkles, Plus } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../utils/constants";
import { hexToRgba } from "../../utils";

interface BadgeSectionProps {
    dataList: Badge[];
    loading?: boolean;
    onEdit?: (badge: Badge) => void;
    onDelete?: (id: string) => void;
    onLinkItems?: (badge: Badge) => void;
}

const BadgeSection: FC<BadgeSectionProps> = ({ dataList, loading, onEdit, onDelete, onLinkItems }) => {
    const { user, primaryColor } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const canEdit = user?.role !== UserRole.WAITER && user?.role !== UserRole.KITCHEN_STAFF;

    const filteredBadges = useMemo(() => {
        return dataList.filter(badge =>
            badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            badge.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [dataList, searchTerm]);

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex space-x-2 rounded-lg items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search badges by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                </div>
            </div>

            {/* List View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 8 }).map((_, index) => (
                        <CategoryCardSkeleton key={index} />
                    ))
                ) : filteredBadges.length === 0 ? (
                    <div className="col-span-full py-12">
                        <EmptyState
                            icon={FolderOpen}
                            title={searchTerm ? "No badges match your search" : "No badges found"}
                            description={searchTerm ? "Try adjusting your search term." : "Create a new badge to highlight special features of your items."}
                        />
                    </div>
                ) : (
                    filteredBadges.map((badge) => (
                        <div
                            key={badge.id}
                            className="group relative flex flex-col bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-transparent transition-all duration-300 overflow-hidden"
                        >
                            {/* Decorative background element */}
                            <div
                                className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150"
                                style={{ backgroundColor: badge.backgroundColor || primaryColor }}
                            />

                            {/* Badge Preview Header */}
                            <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                                <div
                                    className="px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm"
                                    style={{
                                        backgroundColor: badge.backgroundColor,
                                        color: badge.textColor,
                                        border: `1px solid ${hexToRgba(badge.textColor, 0.2)}`
                                    }}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {badge.name}
                                </div>

                                {canEdit && !badge.isSystem && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit && onEdit(badge);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                                            title="Edit Badge"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete && onDelete(badge.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                                            title="Delete Badge"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Link Items Action */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                {canEdit && (
                                    <button
                                        onClick={() => onLinkItems && onLinkItems(badge)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white shadow-md border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600 hover:text-blue-600 hover:border-blue-100 transition-all"
                                    >
                                        <Plus className="w-3 h-3" />
                                        <span>Link Items</span>
                                    </button>
                                )}
                            </div>

                            {/* Badge Content */}
                            <div className="flex-1 space-y-3 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="p-2.5 rounded-xl shadow-inner flex items-center justify-center"
                                        style={{ backgroundColor: hexToRgba(badge.backgroundColor, 0.1) }}
                                    >
                                        <Tag className="w-5 h-5" style={{ color: badge.backgroundColor }} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-base">{badge.name}</h3>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                            <span>Code: {badge.code}</span>
                                            {badge.isSystem && (
                                                <span className="flex items-center gap-0.5 text-blue-500">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    SYSTEM
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed h-10">
                                    {badge.description || "No description provided for this badge."}
                                </p>
                            </div>

                            {/* Status and Order Footer */}
                            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${badge.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                        {badge.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="text-[11px] font-black text-gray-300 uppercase">
                                    Display Order: {badge.displayOrder}
                                </div>
                            </div>

                            {/* Hover Overlay Button (Subtle) */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BadgeSection;