import { FC } from "react";
import { formatPrice } from "../utils";

interface AddonsListItemProps {
    type: 'single' | 'multiple'
    label: string;
    value: number;
    originalValue?: number; // Original price before discount
    isChecked?: boolean
    onChange?: (value: boolean) => void
}

const AddonsListItem: FC<AddonsListItemProps> = ({ type, label, value, originalValue, isChecked, onChange }) => {
    const hasDiscount = originalValue && originalValue > value;

    return (
        <label className="flex justify-between items-center cursor-pointer border border-gray-300 px-3.5 py-3.5 rounded-xl">
            <div className="flex items-center">
                {type === 'single' ? (
                    <div className="flex relative items-center justify-center ">
                        <input
                            type="radio"
                            name="size"
                            value={value}
                            onChange={(e) => onChange && onChange(e.target.checked)}
                            className={`h-5 w-5 border ${isChecked ? 'border-orange-400' : 'border-gray-400'} rounded-full  appearance-none shrink-0`}
                        />
                        {isChecked && <div className="absolute w-3 h-3 rounded-full bg-orange-400 " />}
                    </div>
                ) : (
                    <label className="flex items-center cursor-pointer relative">
                        <input type="checkbox" checked={isChecked} onChange={(e) => onChange && onChange(e.target.checked)} className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow hover:shadow-md border border-slate-300 checked:bg-orange-400 checked:border-orange-400" id="check1" />
                        {isChecked && (
                            <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </span>
                        )}
                    </label>
                )}
                <span className="ml-3 text-gray-600 font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {hasDiscount && (
                    <span className="text-sm text-gray-400 line-through font-medium">
                        {formatPrice(originalValue)}
                    </span>
                )}
                <span className={`font-medium ${hasDiscount ? 'text-orange-600' : 'text-gray-600'}`}>
                    {formatPrice(value)}
                </span>
            </div>
        </label>
    )
}

export default AddonsListItem;