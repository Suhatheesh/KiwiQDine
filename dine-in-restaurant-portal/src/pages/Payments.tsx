import { CreditCard, QrCode, User } from "lucide-react";
import { FC, useLayoutEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import { PaymentMethod } from "../utils/constants";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store";
import { fetchOrdersByIdRequest } from "../features/orders/ordersSlice";
import { formatCurrency, hexToRgba } from "../utils";
import { processPaymentRequest, resetStates } from "../features/payment/paymentSlice";
import { RouteLinks } from "../routers/type";
import CashPaymentSection from "../sections/Cashier/CashPaymentSection";
import CardPaymentSection from "../sections/Cashier/CardPaymentSection";
import QRPaymentSection from "../sections/Cashier/QRPaymentSection";
import { CircularProgress } from "@mui/material";
import { useAuth } from "../hooks/useAuth";

const Payments: FC = () => {

    const { orderId } = useParams();
    const { user, primaryColor } = useAuth();

    const navigate = useNavigate();

    const dispatch = useDispatch<AppDispatch>();

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH)
    const [payAmount, setPayAmount] = useState<string>("");

    const { order, isOrderConfirmed, loading: orderLoading } = useSelector((state: RootState) => state.orders);
    const { loading, isPaymentConfirm } = useSelector((state: RootState) => state.payment);

    useLayoutEffect(() => {
        dispatch(fetchOrdersByIdRequest(orderId ?? ""))
        return () => { dispatch(resetStates()); }
    }, [dispatch, orderId])

    useLayoutEffect(() => {
        if (isOrderConfirmed || isPaymentConfirm) {
            navigate(RouteLinks.CASHIER, { replace: true })
        }
    }, [isOrderConfirmed, isPaymentConfirm, navigate])

    const handlePaymentMethod = (method: PaymentMethod) => {
        setSelectedPaymentMethod(method)
    }

    const handleNumberPad = (value: any) => {
        if (!isNaN(Number(value))) {
            setPayAmount((prev) => prev + value)
        } else if (value === "clear") {
            setPayAmount("")
        } else if (value === ".") {
            setPayAmount(prev => prev.includes(".") ? prev : prev + ".");
        } else {
            setPayAmount(prev => prev.slice(0, -1));
        }
    }

    const handlePayment = () => {
        // Map the selected payment method to cashier-specific method
        let paymentMethod = selectedPaymentMethod;

        // Convert generic payment methods to cashier-specific ones
        if (selectedPaymentMethod === PaymentMethod.CASH) {
            paymentMethod = PaymentMethod.CASHIER_CASH;
        } else if (selectedPaymentMethod === PaymentMethod.CARD) {
            paymentMethod = PaymentMethod.CASHIER_CARD;
        } else if (selectedPaymentMethod === PaymentMethod.QR) {
            paymentMethod = PaymentMethod.CASHIER_QR;
        }

        dispatch(processPaymentRequest({
            restaurantId: user?.restaurant?.id ?? "",
            paymentMethod: paymentMethod,
            orderId: orderId ?? "",
            paymentTiming: user?.restaurant?.paymentTiming,
            // For cash payments, include amount tendered and change
            ...(selectedPaymentMethod === PaymentMethod.CASH && payAmount && {
                amountTendered: Number(payAmount),
                changeReturned: validateBalance > 0 ? validateBalance : 0
            })
        }))
    }

    const handleBack = () => {
        navigate(RouteLinks.CASHIER)
    }

    const paymentSectionMethodWise = () => {
        switch (selectedPaymentMethod) {
            case PaymentMethod.CASH:
                return <CashPaymentSection
                    payAmount={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    onPadClick={handleNumberPad}
                />
            case PaymentMethod.CARD:
                return <CardPaymentSection />
            case PaymentMethod.QR:
                return <QRPaymentSection />
        }
    }

    const validateBalance = useMemo(() => {
        const due = Number(payAmount) - Number(order?.totalAmount)
        return due
    }, [order, payAmount])


    return (
        <div className="bg-gray-50 overflow-y-scroll">
            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-4">

                {/* Left Side - Order Summary */}
                <div className="bg-gray-50 flex flex-col">

                    {/* Order Header */}
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">{order?.orderNumber}</h2>
                        <p className="text-gray-500 text-sm">Dine-In • Table {order?.tableNo || 'N/A'}</p>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <div className="flex-2">Item</div>
                                <div className="w-16 text-center">Qty</div>
                                <div className="w-24 text-right">Price</div>
                            </div>
                        </div>

                        {orderLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <CircularProgress />
                            </div>
                        ) : (
                            <div className="h-64 lg:h-[calc(100vh-428px)] overflow-y-scroll">
                                {order?.itemsByCategory?.map((category, i) => (
                                    <div key={i}>
                                        {category.items.map((item, j) => (
                                            <div
                                                key={j}
                                                className={`px-6 py-4 flex items-center transition-colors ${j % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex-2">
                                                    <p className="font-medium text-gray-800">{item.menuName}</p>
                                                    {item.specialInstructions && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{item.specialInstructions?.portion}</p>
                                                    )}
                                                    {item.addons && item.addons.length > 0 && (
                                                        <div className='mt-1 space-y-0.5'>
                                                            <p className='text-xs font-semibold text-blue-600'>Add-ons:</p>
                                                            {item.addons.map((addon, aIdx) => (
                                                                <p key={aIdx} className='text-xs text-gray-500 ml-2'>
                                                                    • {addon.name}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-16 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                                                        {item.quantity}
                                                    </span>
                                                </div>
                                                <div className="w-24 text-right font-semibold text-gray-800">
                                                    {formatCurrency(Number(item.totalPrice))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Order Total Summary */}

                    <div className="mt-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-2">
                        <div className='flex justify-between items-center text-xs font-bold'>
                            <p className='text-gray-400 uppercase tracking-widest'>Subtotal</p>
                            <p className='text-gray-900'>{formatCurrency(Number(order?.subtotal))}</p>
                        </div>
                        <div className='flex justify-between items-center text-xs font-bold'>
                            <p className='text-gray-400 uppercase tracking-widest'>Service Charge</p>
                            <p className='text-gray-900'>{formatCurrency(Number(order?.serviceCharge))}</p>
                        </div>
                        <div className='flex justify-between items-center text-xs font-bold'>
                            <p className='text-gray-400 uppercase tracking-widest'>Tax & Fees</p>
                            <p className='text-gray-900'>{formatCurrency(Number(order?.tax))}</p>
                        </div>
                        <div className='flex justify-between items-center text-xs font-bold'>
                            <p className='text-gray-400 uppercase tracking-widest'>Discount</p>
                            <p className='text-rose-500'>- {formatCurrency(Number(order?.discount))}</p>
                        </div>
                        <div className='flex justify-between items-center text-xs font-bold'>
                            <span className="text-gray-400 uppercase tracking-widest">Balance</span>
                            <span className="text-gray-600 font-medium">{formatCurrency(Number(validateBalance))}</span>
                        </div>
                        <div className="pt-2 border-t border-dashed border-gray-200" />
                        <div className='flex justify-between text-xl'>
                            <p className='font-bold'>Grand Total</p>
                            <p className='font-bold'>{formatCurrency(Number(order?.totalAmount))}</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Payment Section */}
                <div className="h-auto lg:h-[calc(100vh-95px)] bg-white p-6 flex flex-col rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Payment Header with Customer Info */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-3 pb-3 border-b border-gray-200 gap-4 sm:gap-0">
                        <div className="w-full sm:w-auto text-center sm:text-left">
                            <p className="text-xs text-gray-500 mb-1">Payable Amount</p>
                            <p className="text-3xl font-bold text-green-600">
                                {formatCurrency(Number(order?.totalAmount))}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
                            <div style={{ background: `linear-gradient(to bottom right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})` }} className="w-12 h-12 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{order?.customerName}</p>
                                <p className="text-xs text-gray-500">#{orderId?.slice(0, 6)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Tabs */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => handlePaymentMethod(PaymentMethod.CASH)}
                            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedPaymentMethod === PaymentMethod.CASH
                                ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Cash
                        </button>
                        <button
                            onClick={() => setSelectedPaymentMethod(PaymentMethod.CARD)}
                            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedPaymentMethod === PaymentMethod.CARD || selectedPaymentMethod === PaymentMethod.QR
                                ? 'bg-linear-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Other Modes
                        </button>
                    </div>

                    {/* Payment Method Icons (for Other Modes) */}
                    {(selectedPaymentMethod === PaymentMethod.CARD || selectedPaymentMethod === PaymentMethod.QR) && (
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => handlePaymentMethod(PaymentMethod.CARD)}
                                style={{
                                    borderColor: selectedPaymentMethod === PaymentMethod.CARD ? primaryColor : '',
                                    backgroundColor: selectedPaymentMethod === PaymentMethod.CARD ? hexToRgba(primaryColor, 0.05) : ''
                                }}
                                className={`flex-1 py-3 rounded-lg border-2 transition-all ${selectedPaymentMethod === PaymentMethod.CARD
                                    ? ''
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <CreditCard style={{ color: selectedPaymentMethod === PaymentMethod.CARD ? primaryColor : '' }} className={`w-5 h-5 mx-auto ${selectedPaymentMethod === PaymentMethod.CARD ? '' : 'text-gray-400'}`} />
                                <p style={{ color: selectedPaymentMethod === PaymentMethod.CARD ? primaryColor : '' }} className={`text-xs mt-1 font-medium ${selectedPaymentMethod === PaymentMethod.CARD ? '' : 'text-gray-600'}`}>Card</p>
                            </button>
                            <button
                                onClick={() => handlePaymentMethod(PaymentMethod.QR)}
                                style={{
                                    borderColor: selectedPaymentMethod === PaymentMethod.QR ? primaryColor : '',
                                    backgroundColor: selectedPaymentMethod === PaymentMethod.QR ? hexToRgba(primaryColor, 0.05) : ''
                                }}
                                className={`flex-1 py-3 rounded-lg border-2 transition-all ${selectedPaymentMethod === PaymentMethod.QR
                                    ? ''
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <QrCode style={{ color: selectedPaymentMethod === PaymentMethod.QR ? primaryColor : '' }} className={`w-5 h-5 mx-auto ${selectedPaymentMethod === PaymentMethod.QR ? '' : 'text-gray-400'}`} />
                                <p style={{ color: selectedPaymentMethod === PaymentMethod.QR ? primaryColor : '' }} className={`text-xs mt-1 font-medium ${selectedPaymentMethod === PaymentMethod.QR ? '' : 'text-gray-600'}`}>QR</p>
                            </button>
                        </div>
                    )}

                    {/* Payment Content */}
                    <div className="flex-1 tab-content-enter">
                        {paymentSectionMethodWise()}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-1 space-y-2">
                        <Button
                            disabled={(selectedPaymentMethod === PaymentMethod.CASH && validateBalance < 0)}
                            onClick={handlePayment}
                            size="lg"
                            className="w-full text-white font-semibold py-3 shadow-lg transition-all"
                            isLoading={loading || orderLoading}
                        >
                            Confirm Payment
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full border-2 border-gray-300 hover:bg-gray-50 font-semibold py-3 transition-all"
                            onClick={handleBack}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Payments;