import { Delete } from "lucide-react";
import { FC } from "react";

interface NumberPadProps {
    onPadClick: (value: string | number) => void;
}

const numberPad = [
    { value: 1, display: "1" },
    { value: 2, display: "2" },
    { value: 3, display: "3" },
    { value: 4, display: "4" },
    { value: 5, display: "5" },
    { value: 6, display: "6" },
    { value: 7, display: "7" },
    { value: 8, display: "8" },
    { value: 9, display: "9" },
    { value: "00", display: "00" },
    { value: 0, display: "0" },
    { value: ".", display: "." },
];

export const NumberPad: FC<NumberPadProps> = ({ onPadClick }) => {
    return (
        <div className="grid grid-cols-3 gap-3">
            {numberPad.map((item, i) => (
                <button
                    key={i}
                    onClick={() => onPadClick(item.value)}
                    className="number-pad-button bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold text-xl py-4 rounded-lg transition-all duration-150 active:scale-95"
                >
                    {item.display}
                </button>
            ))}
            <button
                onClick={() => onPadClick("clear")}
                className="number-pad-button bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-sm py-4 rounded-lg transition-all duration-150 active:scale-95"
            >
                Clear
            </button>
            <button
                onClick={() => onPadClick("backspace")}
                className="number-pad-button bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-4 rounded-lg transition-all duration-150 active:scale-95 flex items-center justify-center col-span-2"
            >
                <Delete className="w-5 h-5" />
            </button>
        </div>
    );
};
