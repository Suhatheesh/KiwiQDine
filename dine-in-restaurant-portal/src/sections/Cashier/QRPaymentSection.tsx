import { QrCode, CheckCircle, Smartphone, Zap } from "lucide-react";
import { FC } from "react";

const QRPaymentSection: FC = () => {
    return (
        <div className="flex flex-1 flex-col items-center justify-center space-y-3 pt-2">
            {/* Title */}
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <div className="w-20 h-20 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform">
                        <QrCode className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-gray-800">QR Payment Selected</h3>
                    <p className="text-sm text-gray-500">Ready to process QR payment</p>
                </div>
            </div>


            {/* Features */}
            <div className="w-full max-w-md space-y-3 py-4">
                <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">Mobile Wallets</p>
                        <p className="text-xs text-gray-500">PayPal, Google Pay, Apple Pay & more</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">Instant Payment</p>
                        <p className="text-xs text-gray-500">Fast & contactless transaction</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default QRPaymentSection;