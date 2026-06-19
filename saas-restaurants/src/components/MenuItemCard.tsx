import { FC } from 'react';
import { MenuItem } from '../features/menuItems/types';
import { IOSSwitch } from './Switch';
import placeholder from '../assets/placeholder.png';

interface MenuItemCardProps {
    item: MenuItem;
    onEdit?: (item: MenuItem) => void;
    onDelete?: (id: string) => void;
    onToggleAvailability?: (id: string, value: boolean) => void;
}

export const MenuItemCard: FC<MenuItemCardProps> = ({
    item,
    onEdit,
    onDelete,
    onToggleAvailability,
}) => {

    const handleAvailabilityToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (onToggleAvailability) {
            onToggleAvailability(item.id, event.target.checked);
        }
    };

    return (
        <div className="h-[360px] bg-white rounded-xl duration-300 ease-in-out shadow-md hover:shadow-lg hover:-translate-y-2 transition-all overflow-hidden group">

            {item.image === null ? (
                <img src={placeholder} className="h-1/2 w-full object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-110" />
            ) : (
                <img src={item.image} className="h-1/2 w-full object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-110" />
            )}

            {/* Discount Badge */}
            {item.discount && item.discount > 0 && (
                <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded-full shadow-lg border border-white/20 uppercase tracking-wider">
                        {item.discount}% OFF
                    </span>
                </div>
            )}

            <div className="flex h-14 justify-between px-4 pt-2.5 pb-1.5 space-x-2 items-center">
                <p className="text-base/tight font-bold flex-1">{item.name}</p>
                <div className="bg-[#FEF9C3] text-[#854D0E] justify-center items-center h-fit rounded-full px-4 py-2">
                    <p className="text-xs/tight font-semibold">{item.category?.name}</p>
                </div>
            </div >

            <div className="flex px-4 space-x-2 items-center">
                <p className="text-sm font-semibold text-gray-600">NZD {Number(item.price).toFixed(2)}</p>
                <p className="text-sm text-gray-400 font-light"> • {item.preparationTime} min prep</p>
            </div>

            <div className="h-px bg-gray-300 mx-5 my-3" />

            <div className="flex justify-between px-4">
                <div className={`${item.isAvailable ? 'bg-[#65C466]' : 'bg-[#FF6B6B]'} text-white justify-center items-center flex rounded-full px-4 py-1`}>
                    <p className="text-xs">{item.isAvailable ? 'Available' : 'Not Available'}</p>
                </div>
                <IOSSwitch checked={item.isAvailable} onChange={(e) => handleAvailabilityToggle(e)} />
            </div>

            <div className="flex justify-between text-gray-400 px-10 mt-4 pt-2 border-gray-200 border-t text-sm uppercase font-semibold cursor-pointer">
                <p className="hover:text-gray-800" onClick={() => onEdit && onEdit(item)}>Update</p>
                <div className="w-px max-h-full bg-gray-300" />
                <p className="hover:text-red-800" onClick={() => onDelete && onDelete(item.id)}>Remove</p>
            </div>
        </div >
    );
};
