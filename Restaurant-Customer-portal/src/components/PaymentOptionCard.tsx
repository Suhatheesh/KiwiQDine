import { FC } from "react";
import { PaymentMethod } from "../utils/Constant";

interface PaymentOptionCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    value: PaymentMethod;
    selected: boolean;
    onSelect: (value: PaymentMethod) => void;
}

const PaymentOptionCard: FC<PaymentOptionCardProps> = ({
    icon: Icon,
    title,
    description,
    value,
    selected,
    onSelect,
}) => {
    return (
        <button
            onClick={() => onSelect(value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${selected
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${selected ? 'bg-orange-500' : 'bg-gray-200'
                    }`}>
                    <Icon className={`w-5 h-5 ${selected ? 'text-white' : 'text-gray-600'}`} />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base mb-1">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </button>
    );
};

export default PaymentOptionCard;