import React, { useLayoutEffect, useState } from 'react';
import { Banknote } from 'lucide-react';
import { OrderType, PaymentMethod, PaymentTiming, RestaurantType } from '../utils/Constant';
import PaymentOptionCard from '../components/PaymentOptionCard';
import { useNavigate, useParams } from 'react-router-dom';
import { RootLinks } from '../routers/types';
import Header from '../components/Header';
import { useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { useDispatch } from 'react-redux';
import { Button } from '../components/Button';
import useRestaurant from '../hooks/useRestaurant';
import { calculateOrderTotalRequest, resetOrderState } from '../features/Order/orderSlice';
import { orderCheckoutRequest, resetCartState, selectCartItems } from '../features/Cart/cartSlice';
import { OrderRequest } from '../features/Order/types';
import { processPaymentRequest, resetStates } from '../features/Payment/paymentSlice';

const CompleteOrder: React.FC = () => {

    const { orderId, total } = useParams();
    const { qrId, restaurantId, tableId, phone, name, orderType, paymentTiming, restaurantType, vehicleDetails } = useRestaurant();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const cartItems = useSelector(selectCartItems);
    const { order, loading: orderLoading } = useSelector((state: RootState) => state.order)
    const { payment, loading: paymentLoading } = useSelector((state: RootState) => state.payment)
    const { order: cartOrder, loading: cartLoading, notes } = useSelector((state: RootState) => state.cart)

    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('card');
    const [isDisable, setIsDisable] = useState<boolean>(false);

    useLayoutEffect(() => {
        if (payment?.success) {
            setIsDisable(false);
            navigate(`${RootLinks.ORDERSUMMARY}/${orderId}`, { replace: true })
        }
        return () => { dispatch(resetStates()); }
    }, [payment])

    useLayoutEffect(() => {
        if (order) {
            setIsDisable(false);
            navigate(`${RootLinks.ORDERSUMMARY}/${order?.id}`, { replace: true })
        }
        return () => { dispatch(resetOrderState()); }
    }, [order])

    useLayoutEffect(() => {
        if (cartOrder) {
            setIsDisable(false);
            dispatch(resetCartState());
            navigate(`${RootLinks.FOODCOURT_ORDER_SUMMARY}`, { state: { cartOrder } })
        }
        return () => { dispatch(resetOrderState()); }
    }, [cartOrder])

    const handleCreateOrderRequest = () => {
        setIsDisable(true);
        if (restaurantType === RestaurantType.FOOD_COURT) {
            const basePayload: OrderRequest = {
                customerName: name,
                phone: phone,
                qrCodeId: qrId,
                orderType: orderType,
                ...vehicleDetails,
            }
            const payload = selectedPayment === 'card' ?
                { ...basePayload, paymentMethod: 'card' } :
                basePayload
            dispatch(orderCheckoutRequest(payload))
            return;
        }
        if (orderType === OrderType.DINEIN && paymentTiming === PaymentTiming.PAY_AT_LAST) {
            dispatch(processPaymentRequest({ orderId: orderId ?? "", paymentMethod: selectedPayment, amount: total, phone: phone }))
            return;
        }
        const basePayload: OrderRequest = {
            customerName: name,
            phone: phone,
            qrCodeId: qrId,
            paymentMethod: selectedPayment,
            restaurantId: restaurantId,
            orderType: orderType,
            ...vehicleDetails,
            orderItems: cartItems.map((item) => ({
                menuId: item.item.id,
                quantity: item.qty,
                specialInstructions: {
                    portion: item.selectedVariants?.find((v) => v.variantName === "Size")?.options[0].name,
                    note: item.specialInstructions
                },
                selectedAddons: item.selectedAddOns?.map((addon) => ({
                    addonId: addon.id,
                    quantity: addon.quantity
                }))
            })),
            notes: notes
        }
        const payload = tableId.length > 0
            ? { ...basePayload, tableId }
            : basePayload;
        dispatch(calculateOrderTotalRequest(payload))
    }

    return (
        <div className=" min-h-screen relative overflow-hidden">
            <div className="relative z-10 w-full flex flex-col min-h-screen">

                {/* Header */}
                <Header title='Finalize Your Order' />

                {/* Content Area */}
                <div className="flex-1 p-4 sm:p-6 md:p-8 mt-16 mb-40 max-w-3xl mx-auto w-full">

                    {/* Introductory Message */}
                    <div className="mb-6 animate-fade-in">
                        <p className="text-gray-700 leading-relaxed">
                            This order will be sent to the kitchen. Please confirm your items and choose a payment method.
                        </p>
                    </div>

                    {/* Payment Method Section */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900">How would you like to pay?</h2>

                        <div className="space-y-4">
                            {/* Card Payment Option */}
                            {/* <div className="animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                                <PaymentOptionCard
                                    icon={CreditCard}
                                    title="Card payment(Pay Now)"
                                    description="Securely pay with your card and complete the order"
                                    value="card"
                                    selected={selectedPayment === 'card'}
                                    onSelect={() => setSelectedPayment('card')}
                                />
                            </div> */}

                            {/* Cash Payment Option */}
                            <div className="animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                                <PaymentOptionCard
                                    icon={Banknote}
                                    title="Cash Payment(Pay at Counter)"
                                    description="Settle your bill with the cashier when you leave."
                                    value="cashier"
                                    selected={selectedPayment === 'cashier'}
                                    onSelect={() => setSelectedPayment('cashier')}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Enhanced Sticky Footer Button */}
                <footer className="fixed bottom-0 left-0 right-0 w-full p-4 sm:p-6 bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-2xl mt-auto z-50">
                    <div className="max-w-3xl mx-auto">
                        <Button
                            disabled={orderLoading || paymentLoading || cartLoading || isDisable}
                            isLoading={orderLoading || paymentLoading || cartLoading || isDisable}
                            onClick={handleCreateOrderRequest}
                            size="lg"
                            className="relative w-full group/btn overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl"
                        >
                            <span className="text-white font-medium tracking-wide sm:text-lg">{paymentTiming === PaymentTiming.PAY_AT_LAST ? "Confirm & Send to Kitchen" : "Confirm & Pay"}</span>
                        </Button>

                        {/* Additional info */}
                        <p className="text-center text-sm text-gray-500 mt-3">
                            {paymentTiming === PaymentTiming.PAY_AT_LAST ? "By confirming, you agree to send this order to the kitchen" : "By confirming, you agree to pay for this order"}
                        </p>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default CompleteOrder;