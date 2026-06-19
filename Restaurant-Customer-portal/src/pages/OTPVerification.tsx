import { FC, useLayoutEffect, useState } from "react";
import OTPInput from "../components/OTPInput";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import { RootLinks } from "../routers/types";
import Header from "../components/Header";
import { OrderType, PaymentTiming, RestaurantType } from "../utils/Constant";
import useRestaurant from "../hooks/useRestaurant";
import { calculateOrderTotalRequest, resetOrderState } from "../features/Order/orderSlice";
import { OrderRequest } from "../features/Order/types";
import { AppDispatch, RootState } from "../app/store";
import { useDispatch, useSelector } from "react-redux";
import { createCustomerOTPRequest, createCustomerVerifyRequest } from "../features/Customer/customerSlice";
import { useLocation } from "react-router-dom";
import { OTP_TIMEOUT } from "../api/axiosClient";

const OTPVerification: FC = () => {

    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const existingOrder = (location.state as { existingOrder?: boolean } | null)?.existingOrder ?? false;
    const { qrId, restaurantId, tableId, phone, name, orderType, paymentTiming, restaurantType } = useRestaurant();

    const { customer, error: customerError, loading: customerLoading } = useSelector((state: RootState) => state.customer);

    const { cartItem: cartItems, notes } = useSelector((state: RootState) => state.cart);
    const { order } = useSelector((state: RootState) => state.order);

    const [otp, setOTP] = useState<string>("")
    const [timeLeft, setTimeLeft] = useState<number>(OTP_TIMEOUT);
    const [isResendEnabled, setIsResendEnabled] = useState<boolean>(false);
    const [isReset, setIsReset] = useState<boolean>(false);

    useLayoutEffect(() => {
        if (timeLeft > 0) {
            const timerId = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timerId);
        } else {
            setIsReset(false);
            setIsResendEnabled(true);
        }
    }, [timeLeft]);

    useLayoutEffect(() => {
        if (customer) {
            handleOrder();
        }
    }, [customer])

    useLayoutEffect(() => {
        if (customerError) {
            setOTP("")
        }
    }, [customerError])

    useLayoutEffect(() => {
        if (order) {
            navigate(`${RootLinks.ORDERSTATUS}/${order?.id}`, { replace: true })
        }
        return () => { dispatch(resetOrderState()); }
    }, [order])

    const handleResend = () => {
        if (isResendEnabled) {
            dispatch(createCustomerOTPRequest({
                name: name,
                phoneNumber: phone
            }))
            setIsResendEnabled(false);
            setTimeLeft(25);
            setIsReset(true);
            setOTP("")
        }
    }

    const handleVerify = () => {
        dispatch(createCustomerVerifyRequest({
            name: name,
            phoneNumber: phone,
            otp
        }))
    }
    const handleOrder = () => {
        if (existingOrder) {
            navigate(RootLinks.ONGOINGORDERS, { replace: true });
        } else if (restaurantType === RestaurantType.RESTAURANT && orderType === OrderType.DINEIN && paymentTiming === PaymentTiming.PAY_AT_LAST) {
            handleCreateOrderRequest();
        } else {
            navigate(RootLinks.FINALISEORDER, { replace: true });
        }
    }

    const handleCreateOrderRequest = () => {
        const basePayload: OrderRequest = {
            customerName: customer?.customer.name ?? name,
            phone: customer?.customer.phone ?? phone,
            qrCodeId: qrId,
            restaurantId: restaurantId,
            orderType: orderType,
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
        <div className="flex flex-1 relative flex-col h-screen">

            <Header title="Verification" />

            <div className="mt-16 flex flex-col items-center justify-center py-20">
                <p className="text-2xl font-semibold">Verify it’s you</p>
                <p className="text-gray-500 px-10 text-center pt-4">We’ve sent a 6-digit code to {phone.substring(0, 3) + "******" + phone.substring(phone.length - 2)}</p>
                {customerError && <p className="text-red-500 text-sm mt-8 text-center px-10">{customerError}</p>}
            </div>

            <div className="flex flex-col items-center justify-center px-6">
                <OTPInput length={6} onComplete={setOTP} isReset={isReset} isError={!!customerError} />
                <div className="flex space-x-1.5 items-center pt-6">
                    <p className="flex text-gray-500">Didn’t Receive a code?</p>
                    <p className={isResendEnabled ? "text-orange-400 cursor-pointer" : "text-gray-500 cursor-not-allowed"} onClick={handleResend}>Resend</p>
                </div>
                <p className="pt-2 text-gray-500 ">Resend code in {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}</p>
            </div>

            <div className="flex flex-1 flex-col justify-end p-6">
                <Button disabled={otp.length < 6 || customerLoading} isLoading={customerLoading} size="lg" onClick={handleVerify}>
                    <p>Verify and Proceed to Payment</p>
                </Button>
            </div>
        </div>
    )
}

export default OTPVerification;