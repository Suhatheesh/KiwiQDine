import { FC } from "react"
import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import placeholder from '../assets/placeholder.png'
import { MenuItem } from "../features/menuItems/types"
import { formatCurrency } from "../utils"
import { useAuth } from "../hooks/useAuth"

interface ListMenuItemCardProps {
    selected?: boolean;
    item: MenuItem
    onClick?: (item: MenuItem) => void
}

const ListMenuItemCard: FC<ListMenuItemCardProps> = ({ selected, item, onClick }) => {
    const { primaryColor } = useAuth();
    const { badges } = useSelector((state: RootState) => state.menu);

    return (
        <div
            onClick={() => onClick && onClick(item)}
            style={{
                boxShadow: selected ? `0 0 0 2px ${primaryColor}` : ''
            }}
            className={`
                h-[200px] bg-white rounded-xl cursor-pointer
                transition-all duration-300 ease-in-out
                hover:shadow-xl hover:-translate-y-1
                ${selected
                    ? 'shadow-lg'
                    : 'shadow-md border border-gray-100'
                }
                overflow-hidden group
            `}
        >
            {/* Image with gradient overlay */}
            <div className="relative w-full h-1/2 overflow-hidden">
                {item.image ? (
                    <img
                        src={item.image}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <img
                        src={placeholder}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                {/* Selected indicator */}
                {selected && (
                    <div className="absolute top-2 right-2">
                        <div style={{ backgroundColor: primaryColor }} className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Discount Badge */}
                {item.discount && item.discount > 0 && (
                    <div className="absolute top-2 left-2 z-10">
                        <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded-full shadow-lg">
                            {item.discount}% OFF
                        </span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                    {badges?.filter((b: any) => item.badges?.includes(b.code) || item.badges?.includes(b.id)).map((badge: any) => (
                        <div
                            key={badge.id}
                            style={{ backgroundColor: badge.backgroundColor, color: badge.textColor }}
                            className="text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm border border-white/10 uppercase tracking-tighter"
                        >
                            {badge.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col h-1/2 px-3 py-2">
                <p className="text-center font-bold text-gray-900 line-clamp-2 flex-1">{item.name}</p>
                <div className="border-t border-gray-100 pt-2">
                    {item.discount && item.discount > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-center font-medium text-sm text-gray-400 line-through">
                                {formatCurrency(item.price)}
                            </p>
                            <div className="flex items-center gap-2">
                                <p style={{ color: selected ? primaryColor : '#059669' }} className="text-center font-bold text-lg">
                                    {formatCurrency(item.price - (item.price * item.discount / 100))}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: selected ? primaryColor : '#374151' }} className="text-center font-bold text-lg">
                            {formatCurrency(item.price)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ListMenuItemCard;