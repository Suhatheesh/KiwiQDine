import { FC } from "react";
import placeholder from '../assets/placeholder.png'
import { MenuItem } from "../features/menuItems/types";
import { formatCurrency } from "../utils";
import { useAuth } from "../hooks/useAuth";
import { IOSSwitch } from "./Switch";

interface MenuItemCardrops {
    item: MenuItem;
    allowedRoles: string[]
    onEdit?: (item: MenuItem) => void
    onAvailability?: (available: boolean, menuId: string) => void;
    onDelete?: (itemId: string) => void
}

const MenuItemCard: FC<MenuItemCardrops> = ({ item, allowedRoles, onDelete, onEdit, onAvailability }) => {

    const { user, primaryColor } = useAuth()

    const height = allowedRoles.includes(user!.role!) ? 'h-[360px]' : 'h-[290px]'

    return (
        <div className={`${height} bg-white rounded-xl duration-300 ease-in-out shadow-md hover:shadow-lg hover:-translate-y-2 transition-all overflow-hidden group`}>

            <div className="relative h-1/2 overflow-hidden rounded-t-xl group">
                {item.image ? (
                    <img src={item.image} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <img src={placeholder} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                )}

                {/* Discount Badge */}
                {item.discount && item.discount > 0 && (
                    <div className="absolute top-3 left-3 z-10">
                        <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded-full shadow-lg border border-white/20 uppercase tracking-wider">
                            {item.discount}% OFF
                        </span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10">
                    {item.badges?.map((badge) => (
                        <div
                            key={badge.id}
                            style={{ backgroundColor: badge.backgroundColor, color: badge.textColor }}
                            className="text-[9px] font-black px-2 py-1 rounded-lg shadow-sm border border-white/10 uppercase tracking-widest backdrop-blur-xs"
                        >
                            {badge.name}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex h-14 justify-between px-4 pt-2.5 pb-1.5 space-x-2 items-center">
                <p className="text-base/tight font-bold flex-1 line-clamp-2">{item.name}</p>
                <div className="bg-[#FEF9C3] text-[#854D0E] justify-center items-center h-fit rounded-full px-3 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-tight">{item.category?.name}</p>
                </div>
            </div >

            <div className="flex px-4 space-x-2 items-center">
                {item.discount && item.discount > 0 ? (
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-emerald-600">
                            {formatCurrency(item.price - (item.price * item.discount / 100))}
                        </p>
                        <p className="text-xs font-medium text-gray-400 line-through">
                            {formatCurrency(item.price)}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm font-semibold text-gray-600">{formatCurrency(item.price)}</p>
                )}
                <p className="text-xs text-gray-400 font-light"> • {item.preparationTime} min</p>
            </div>

            <div>
                <div className="h-px bg-gray-300 mx-5 my-3" />
                <div className="flex justify-between px-4">
                    <div className={`${item.isAvailable ? 'bg-[#65C466]' : 'bg-[#FF6B6B]'} text-white justify-center items-center flex rounded-full px-4 py-1`}>
                        <p className="text-xs">{item.isAvailable ? 'Available' : 'Not Available'}</p>
                    </div>
                    <IOSSwitch primaryColor={primaryColor} checked={item.isAvailable} onChange={(e) => onAvailability && onAvailability(e.target.checked, item.id ?? "")} />
                </div>
            </div>

            {allowedRoles.includes(user!.role!) && (
                <div className="flex justify-between text-gray-400 px-10 mt-4 pt-2 border-gray-200 border-t text-sm uppercase font-semibold cursor-pointer">
                    <p className="hover:text-gray-800" onClick={() => onEdit && onEdit(item)}>Update</p>
                    <div className="w-px max-h-full bg-gray-300" />
                    <p className="hover:text-red-800" onClick={() => onDelete && onDelete(item.id ?? "")}>Remove</p>
                </div>
            )}
        </div >
    )
}

export default MenuItemCard;
