import { CreditCard, CheckCircle, Shield } from "lucide-react";
import { FC } from "react";

const CardPaymentSection: FC = () => {
    return (
        <div className="flex flex-1 flex-col items-center justify-center pt-2">

            {/* Title */}
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform">
                        <CreditCard className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-gray-800">Card Payment Selected</h3>
                    <p className="text-sm text-gray-500">Ready to process card payment</p>
                </div>
            </div>

            {/* Features */}
            <div className="w-full max-w-md space-y-3 pt-4">
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">All Cards Accepted</p>
                        <p className="text-xs text-gray-500">Visa, Mastercard, Amex & more</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">Secure Transaction</p>
                        <p className="text-xs text-gray-500">PCI DSS compliant payment</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CardPaymentSection;