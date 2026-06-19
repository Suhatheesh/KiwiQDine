import axiosClient from "../../api/axiosClient";
import { UpdateSubscriptionPlan } from "./types";

const SubscriptionsAPI = {
    fetchAllPlans: () => axiosClient.get('/api/subscription/plans'),
    fetchSubscriptionUsage: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/subscription-usage`),
    fetchSubscriptionOrderUsage: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/order-usage`),
    fetchSubscriptionSummary: (restaurantId: string) => axiosClient.get(`api/invoices/restaurant/${restaurantId}`),
    changePlan: (args: UpdateSubscriptionPlan) => {
        const { restaurantId, ...plan } = args;
        return axiosClient.post(`api/subscription/restaurants/${restaurantId}/change-plan`, plan);
    },
    checkCanCreateOrder: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/can-create-order`),
    checkCanTableCreate: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/can-create-table`),
    checkCanQRCreate: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/can-create-qr`),
    checkCanUserCreate: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/can-create-user`),
}

export default SubscriptionsAPI;