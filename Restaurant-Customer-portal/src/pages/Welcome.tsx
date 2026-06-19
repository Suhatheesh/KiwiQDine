import { useLayoutEffect, useState, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { RootLinks } from "../routers/types";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from "../app/store";
import { useParams } from "react-router-dom";
import useRestaurant from "../hooks/useRestaurant";
import { Button } from "../components/Button";
import BottomSheet from "../components/BottomSheet";
import EnterUserDetailSection from "../sections/EnterUserDetailSection";
import { CustomerOTPRequest } from "../features/Customer/types";
import { RestaurantType } from "../utils/Constant";
import { fetchQRRequest } from "../features/QR/QRSlice";
import { resetCustomerState } from "../features/Customer/customerSlice";

const Welcome: FC = () => {

    const { restaurantType, setData, setPhoneNumber, setPaymentTimingStatus, onServiceCharge } = useRestaurant();
    const navigate = useNavigate();
    const { tenantId, qrId, tableId, tableNo, orderType } = useParams();

    const dispatch = useDispatch<AppDispatch>()
    const { item } = useSelector((state: RootState) => state.qr);
    const { customer } = useSelector((state: RootState) => state.customer);

    const [tableNumber] = useState(tableNo);
    const [isBottomSheetOpen, setBottomSheetOpen] = useState<boolean>(false);

    useLayoutEffect(() => {
        if (item) {
            if (item.restaurant.tenant.type === RestaurantType.RESTAURANT) {
                onServiceCharge({ type: item?.restaurant?.serviceChargeType ?? "", value: item?.restaurant.serviceChargeType === 'fixed' ? Number(item?.restaurant.fixedServiceCharge) : Number(item?.restaurant.serviceChargePercentage) });
            }
            setPaymentTimingStatus(item?.restaurant?.paymentTiming ?? "");
        }
        setData({
            restaurantId: item?.restaurant?.id ?? "",
            tableId: tableId ?? "",
            orderType: orderType ?? "",
            tenantId: item?.tenantId ?? tenantId ?? "",
            qrId: qrId ?? "",
            restaurantType: item?.restaurant.tenant.type
        });
    }, [item, tableId, orderType, tenantId, qrId])

    useLayoutEffect(() => {
        if (qrId) {
            dispatch(fetchQRRequest(qrId))
        }
    }, [dispatch, qrId])

    useLayoutEffect(() => {
        return () => { dispatch(resetCustomerState()); }
    }, [customer]);

    const handleConfirm = () => {
        if (item?.restaurant.tenant.type === RestaurantType.FOOD_COURT) {
            navigate(RootLinks.RESTAURANTLIST);
            return;
        }
        navigate(RootLinks.MENU, { state: { logo: item?.restaurant?.logo, title: item?.restaurant?.name } });
    };

    const handleOpenBottomSheet = () => {
        setBottomSheetOpen(true);
    };

    const handleCloseBottomSheet = () => {
        setBottomSheetOpen(false);
    };

    const handleVerify = (value?: CustomerOTPRequest) => {
        if (!value) return;
        setPhoneNumber(value.phoneNumber);
        setBottomSheetOpen(false);
        navigate(RootLinks.OTPVERIFICATION, { state: { existingOrder: true } });
    };

    return (
        <div className="h-screen bg-white flex flex-col">
            {/* Hero Image Section */}
            <div className="relative w-full overflow-hidden">
                <img
                    src="https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg?auto=compress&cs=tinysrgb&w=1200"
                    alt="Restaurant interior"
                    className="w-full object-cover"
                />
            </div>

            <div className="grow px-6 py-8 flex justify-center items-center">
                <div className="w-full max-w-md space-y-6 flex-1 flex flex-col">
                    {/* Welcome Heading */}
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome to {restaurantType === RestaurantType.FOOD_COURT ? item?.restaurant?.tenant?.name : item?.restaurant?.name}
                        </h1>
                    </div>

                    {tableNo && restaurantType !== RestaurantType.FOOD_COURT && (
                        <div className="bg-gray-50 rounded-2xl p-8 text-center space-y-4">
                            <p className="text-gray-600 text-sm">Your Table Number</p>
                            <p className="text-6xl font-bold text-gray-900">{tableNumber}</p>
                            <p className="text-gray-600 text-sm">
                                Pease confirm this is your correct table number before ordering
                            </p>
                        </div>
                    )}
                </div>
            </div>
            {/* Action Buttons */}
            <div className="space-y-3 px-6 pb-6 :sm:px-0 flex flex-col">
                {/* Primary CTA Button */}
                <Button
                    size="lg"
                    onClick={handleConfirm}
                >
                    {restaurantType === RestaurantType.FOOD_COURT ? "View Food Courts" : "View Menu"}
                </Button>
                <Button
                    variant="outline"
                    onClick={handleOpenBottomSheet}
                    size="lg"
                >
                    View Exist Orders
                </Button>
            </div>

            <BottomSheet isOpen={isBottomSheetOpen} onClose={handleCloseBottomSheet}>
                <EnterUserDetailSection onConfirm={handleVerify} />
            </BottomSheet>

        </div>
    );
}

export default Welcome;