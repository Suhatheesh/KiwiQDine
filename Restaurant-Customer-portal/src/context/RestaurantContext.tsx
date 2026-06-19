import { createContext, FC, useLayoutEffect, useState } from "react";
import { RestaurantType } from "../utils/Constant";

interface RestaurantContextType {
    restaurantType: string;
    tenantId: string;
    restaurantId: string;
    tableId: string;
    qrId: string;
    phone: string;
    name: string;
    orderType: string;
    paymentTiming: string;
    serviceCharge: { type: string, value: number } | undefined;
    vehicleDetails: { vehicleModel: string, vehicleNumber: string } | undefined;
    setData: ({ restaurantId, tableId, qrId, orderType, tenantId }: { restaurantId: string, tableId?: string, qrId?: string, orderType?: string, tenantId?: string, restaurantType?: string }) => void;
    setPhoneNumber: (phone: string) => void;
    setCustomerName: (customerName: string) => void;
    setPaymentTimingStatus: (paymentTiming: string) => void;
    setRestaurantIdv2: (restaurantId: string) => void;
    onServiceCharge: (serviceCharge: { type: string, value: number } | undefined) => void;
    setCartSessionId: (cartSessionId: string) => void;
    setVehicleDetail: (vehicleDetails: { vehicleModel: string, vehicleNumber: string } | undefined) => void;
}

interface RestaurantContextProviderProps {
    children: React.ReactNode;
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

const RestaurantContextProvider: FC<RestaurantContextProviderProps> = ({ children }) => {

    const [tenantId, setTenantId] = useState<string>("");
    const [restaurantId, setRestaurantId] = useState<string>("");
    const [tableId, setTableId] = useState<string>("");
    const [qrId, setQrId] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [orderType, setType] = useState<string>("");
    const [paymentTiming, setPaymentTiming] = useState<string>("");
    const [restaurantType, setRestaurantType] = useState<string>(RestaurantType.FOOD_COURT);
    const [vehicleDetails, setVehicleDetails] = useState<{ vehicleModel: string, vehicleNumber: string } | undefined>();
    const [serviceCharge, setServiceCharge] = useState<{ type: string, value: number } | undefined>();

    useLayoutEffect(() => {
        const phone = sessionStorage.getItem('phone') ?? "";
        const qrId = sessionStorage.getItem('qrId') ?? "";
        const tableId = sessionStorage.getItem('tableId') ?? "";
        const restaurantId = sessionStorage.getItem('restaurantId') ?? "";
        const tenantId = sessionStorage.getItem('tenantId') ?? "";
        const name = sessionStorage.getItem('customerName') ?? "";
        const orderType = sessionStorage.getItem('orderType') ?? "";
        const paymentTiming = sessionStorage.getItem('paymentTiming') ?? "";
        const restaurantType = sessionStorage.getItem('restaurantType') ?? "";
        const vehicleDetails = sessionStorage.getItem('vehicleDetails') ?? "";
        const serviceCharge = sessionStorage.getItem('serviceCharge') ?? "";
        if (vehicleDetails.length > 0) {
            setVehicleDetails(JSON.parse(vehicleDetails));
        }
        if (serviceCharge.length > 0) {
            setServiceCharge(JSON.parse(serviceCharge));
        }
        setPhone(phone);
        setQrId(qrId);
        setTableId(tableId);
        setRestaurantId(restaurantId);
        setTenantId(tenantId);
        setName(name);
        setType(orderType);
        setPaymentTiming(paymentTiming);
        setRestaurantType(restaurantType);
    }, [phone, qrId, tableId, restaurantId, tenantId, name, orderType, paymentTiming, restaurantType])

    const setData = ({ restaurantId, tableId, qrId, orderType, tenantId, restaurantType }: { restaurantId: string, tableId?: string, qrId?: string, orderType?: string, tenantId?: string, restaurantType?: string }) => {
        sessionStorage.setItem('qrId', qrId ?? "");
        sessionStorage.setItem('tableId', tableId ?? "");
        sessionStorage.setItem('restaurantId', restaurantId);
        sessionStorage.setItem('tenantId', tenantId ?? "");
        sessionStorage.setItem('orderType', orderType ?? "");
        sessionStorage.setItem('restaurantType', restaurantType ?? "");
        setRestaurantId(restaurantId);
        setTableId(tableId ?? "");
        setQrId(qrId ?? "");
        setTenantId(tenantId ?? "");
        setType(orderType ?? "");
        setRestaurantType(restaurantType ?? "");
    };

    const setPhoneNumber = (phone: string) => {
        sessionStorage.setItem('phone', phone);
        setPhone(phone);
    };
    const setCustomerName = (customerName: string) => {
        sessionStorage.setItem('customerName', customerName);
        setName(customerName);
    };
    const setPaymentTimingStatus = (paymentTiming: string) => {
        sessionStorage.setItem('paymentTiming', paymentTiming);
        setPaymentTiming(paymentTiming);
    };
    const setRestaurantIdv2 = (restaurantId: string) => {
        sessionStorage.setItem('restaurantId', restaurantId);
        setRestaurantId(restaurantId);
    };
    const setCartSessionId = (cartSessionId: string) => {
        sessionStorage.setItem('cartSessionId', cartSessionId);
    };
    const setVehicleDetail = (vehicleDetails: { vehicleModel: string, vehicleNumber: string } | undefined) => {
        sessionStorage.setItem('vehicleDetails', JSON.stringify(vehicleDetails));
        setVehicleDetails(vehicleDetails);
    };
    const onServiceCharge = (serviceCharge: { type: string, value: number } | undefined) => {
        sessionStorage.setItem('serviceCharge', JSON.stringify(serviceCharge));
        setServiceCharge(serviceCharge);
    };

    return (
        <RestaurantContext.Provider value={{ vehicleDetails, restaurantId, tableId, qrId, phone, name, orderType, paymentTiming, tenantId, restaurantType, serviceCharge, setData, setPhoneNumber, setCustomerName, setPaymentTimingStatus, setRestaurantIdv2, setCartSessionId, setVehicleDetail, onServiceCharge }}>
            {children}
        </RestaurantContext.Provider>
    );
};

export { RestaurantContext };
export default RestaurantContextProvider;