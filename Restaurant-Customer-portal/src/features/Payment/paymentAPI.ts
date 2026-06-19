import axiosClient from "../../api/axiosClient";
import { PaymentProcessRequest, PaymentProcessResponse } from "./types";

const PaymentAPI = {
    paymentProcess: (args: PaymentProcessRequest) => {
        const { orderId, phone, ...rest } = args;
        return axiosClient.post<PaymentProcessResponse>(`/api/customer-portal/order/${orderId}/payment?phone=${phone}`, rest)
    },
    updateRestaurantWallet: (args: { restaurantId: string; totalBalance: number }) => 
        axiosClient.patch(`/api/customer-portal/order/${args.restaurantId}/wallet`, { totalBalance: args.totalBalance })
}

export { PaymentAPI }