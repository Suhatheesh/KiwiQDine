import { FC } from "react"
import { TabType } from "../../utils/constants"
import { hexToRgba } from "../../utils"

interface TabHeaderProps {
    selectedTab: TabType
    handleCategoryTypeClick: (tab: TabType) => void
    menuItemCount: number;
    categoies: any[]
    addOns: any[]
    badges: any[]
    primaryColor: string
}

const TabHeader: FC<TabHeaderProps> = ({ selectedTab, handleCategoryTypeClick, menuItemCount, categoies, addOns, badges, primaryColor }) => {
    return (
        <div className="flex space-x-2 w-full md:w-auto">
            <div
                onClick={() => handleCategoryTypeClick(TabType.MENUITEM)}
                style={{ background: selectedTab === TabType.MENUITEM ? `linear-gradient(to right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})` : "" }}
                className={`
                                       px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer whitespace-nowrap flex-1 md:flex-none text-center
                                       transition-all duration-300 ease-in-out
                                       ${selectedTab === TabType.MENUITEM
                        ? 'text-white shadow-lg shadow-blue-200 scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }
                                   `}
            >
                <span className="flex items-center justify-center space-x-2">
                    <span>Menu Items</span>
                    <span className={`
                                           px-2 py-0.5 rounded-full text-xs font-bold
                                           ${selectedTab === TabType.MENUITEM ? 'bg-white/20' : 'bg-gray-200'}
                                       `}>
                        {menuItemCount}
                    </span>
                </span>
            </div>
            <div
                onClick={() => handleCategoryTypeClick(TabType.CATEGORY)}
                style={{ background: selectedTab === TabType.CATEGORY ? `linear-gradient(to right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})` : "" }}
                className={`
                                       px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer whitespace-nowrap flex-1 md:flex-none text-center
                                       transition-all duration-300 ease-in-out
                                       ${selectedTab === TabType.CATEGORY
                        ? 'text-white shadow-lg shadow-blue-200 scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }
                                   `}
            >
                <span className="flex items-center justify-center space-x-2">
                    <span>Categories</span>
                    <span className={`
                                           px-2 py-0.5 rounded-full text-xs font-bold
                                           ${selectedTab === TabType.CATEGORY ? 'bg-white/20' : 'bg-gray-200'}
                                       `}>
                        {categoies.length}
                    </span>
                </span>
            </div>
            <div
                onClick={() => handleCategoryTypeClick(TabType.ADDON)}
                style={{ background: selectedTab === TabType.ADDON ? `linear-gradient(to right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})` : "" }}
                className={`
                                       px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer whitespace-nowrap flex-1 md:flex-none text-center
                                       transition-all duration-300 ease-in-out
                                       ${selectedTab === TabType.ADDON
                        ? 'text-white shadow-lg shadow-blue-200 scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }
                                   `}
            >
                <span className="flex items-center justify-center space-x-2">
                    <span>Add-ons</span>
                    <span className={`
                                           px-2 py-0.5 rounded-full text-xs font-bold
                                           ${selectedTab === TabType.ADDON ? 'bg-white/20' : 'bg-gray-200'}
                                       `}>
                        {addOns.length}
                    </span>
                </span>
            </div>
            <div
                onClick={() => handleCategoryTypeClick(TabType.BADGES)}
                style={{ background: selectedTab === TabType.BADGES ? `linear-gradient(to right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})` : "" }}
                className={`
                                       px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer whitespace-nowrap flex-1 md:flex-none text-center
                                       transition-all duration-300 ease-in-out
                                       ${selectedTab === TabType.BADGES
                        ? 'text-white shadow-lg shadow-blue-200 scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }
                                   `}
            >
                <span className="flex items-center justify-center space-x-2">
                    <span>Badges</span>
                    <span className={`
                                           px-2 py-0.5 rounded-full text-xs font-bold
                                           ${selectedTab === TabType.BADGES ? 'bg-white/20' : 'bg-gray-200'}
                                       `}>
                        {badges.length}
                    </span>
                </span>
            </div>
        </div>
    )
}

export default TabHeader