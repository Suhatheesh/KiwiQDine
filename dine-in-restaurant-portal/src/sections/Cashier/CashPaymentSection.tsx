import { Delete } from "lucide-react";
import { FC } from "react";

const numberPad = [1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, <Delete />]

interface CashPaymentSectionProps {
    payAmount: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>
    onPadClick: (value: any) => void;
}

const CashPaymentSection: FC<CashPaymentSectionProps> = ({ onPadClick, onChange, payAmount }) => {

    return (
        <div className="space-y-3">
            {/* Amount Input */}
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <input
                    type="text"
                    placeholder="0.00"
                    value={payAmount}
                    onChange={onChange}
                    className="w-full bg-transparent text-3xl font-bold text-gray-900 text-center focus:outline-none placeholder-gray-300"
                />
                <p className="text-center text-xs text-gray-500 mt-1">Enter Amount</p>
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-2">
                {numberPad.map((item: any, i) => (
                    <button
                        key={i}
                        onClick={() => onPadClick(item)}
                        className="flex items-center justify-center number-pad-button bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg py-3 text-lg font-semibold text-gray-800 transition-all hover:shadow-md"
                    >
                        {item}
                    </button>
                ))}
                <button
                    onClick={() => onPadClick("clear")}
                    className="number-pad-button col-span-3 bg-orange-100 hover:bg-orange-200 active:bg-orange-300 rounded-lg py-2 text-sm font-semibold text-orange-700 transition-all hover:shadow-md"
                >
                    Clear
                </button>
            </div>
        </div>
    )
}

export default CashPaymentSection;