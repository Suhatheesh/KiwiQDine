import { FC, useState, useMemo } from "react";
import { Badge, FetchMenuItemLessWeightResponse } from "../../../features/menuItems/types";
import { Search, Tag, Check, CheckSquare, Square, Package, Sparkles } from "lucide-react";
import { hexToRgba } from "../../../utils";

interface BadgeLinkModelSectionProps {
    badge: Badge;
    menuItems: FetchMenuItemLessWeightResponse[];
    selectedItemIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

const BadgeLinkModelSection: FC<BadgeLinkModelSectionProps> = ({
    badge,
    menuItems,
    selectedItemIds,
    onSelectionChange
}) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredItems = useMemo(() => {
        return menuItems.filter(item =>
            item.menuName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [menuItems, searchTerm]);

    const toggleItem = (id: string) => {
        if (selectedItemIds.includes(id)) {
            onSelectionChange(selectedItemIds.filter(itemId => itemId !== id));
        } else {
            onSelectionChange([...selectedItemIds, id]);
        }
    };

    const toggleAll = () => {
        if (selectedItemIds.length === filteredItems.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(filteredItems.map(i => i.menuItemId));
        }
    };

    return (
        <div className="space-y-6">
            {/* Badge Preview Banner */}
            <div
                className="p-4 rounded-2xl flex items-center justify-between border overflow-hidden relative"
                style={{
                    backgroundColor: hexToRgba(badge.backgroundColor, 0.05),
                    borderColor: hexToRgba(badge.backgroundColor, 0.2)
                }}
            >
                <div className="absolute -right-6 -top-6 opacity-10">
                    <Sparkles size={80} style={{ color: badge.backgroundColor }} />
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div
                        className="p-3 rounded-xl shadow-sm flex items-center justify-center bg-white"
                        style={{ border: `1px solid ${hexToRgba(badge.backgroundColor, 0.3)}` }}
                    >
                        <Tag className="w-6 h-6" style={{ color: badge.backgroundColor }} />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight">{badge.name}</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest opacity-70">
                            Linking Badge to Menu Items
                        </p>
                    </div>
                </div>

                <div
                    className="px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-md"
                    style={{ backgroundColor: badge.backgroundColor, color: badge.textColor }}
                >
                    PREVIEW
                </div>
            </div>

            {/* Selection Area */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search items by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <button
                        onClick={toggleAll}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                    >
                        {selectedItemIds.length === filteredItems.length ? "Deselect All" : "Select All Available"}
                    </button>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => {
                            const isSelected = selectedItemIds.includes(item.menuItemId);
                            return (
                                <div
                                    key={item.menuItemId}
                                    onClick={() => toggleItem(item.menuItemId)}
                                    className={`
                                        group flex items-center p-3 rounded-xl border transition-all cursor-pointer
                                        ${isSelected
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-xs'
                                        }
                                    `}
                                >
                                    <div className={`mr-3 transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-300 group-hover:text-blue-300'}`}>
                                        {isSelected ? <CheckSquare className="w-5 h-5 fill-blue-50" /> : <Square className="w-5 h-5" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-3.5 h-3.5 text-gray-400" />
                                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                                {item.menuName}
                                            </p>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="bg-blue-600 p-1 rounded-full">
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-20" />
                            <p className="text-gray-500 font-bold text-sm">No menu items found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Selection Summary */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                        Selected: <span className="text-blue-600">{selectedItemIds.length}</span> Items
                    </span>
                </div>
                <div className="flex -space-x-2">
                    {selectedItemIds.slice(0, 5).map((id) => (
                        <div key={id} className="w-8 h-8 rounded-full bg-white border-2 border-gray-50 flex items-center justify-center z-[5-idx] shadow-xs">
                            <Package className="w-4 h-4 text-blue-300" />
                        </div>
                    ))}
                    {selectedItemIds.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-[10px] font-black border-2 border-white flex items-center justify-center z-0 shadow-sm">
                            +{selectedItemIds.length - 5}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BadgeLinkModelSection;
