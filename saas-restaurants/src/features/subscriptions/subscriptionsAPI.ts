import axiosClient from "../../api/axiosClient";
import { CreateSubscriptionPlan, SubscriptionPlan, fetchSubscriptionPlan } from "./types";

const SubscriptionsAPI = {
    fetchAllPlans: (args: fetchSubscriptionPlan) => axiosClient.get('api/subscription/plans/all', { params: { isArchived: args.includeArchived, isSpecializedPlan: args.isSpecializedPlan, planName: args.planName, tenantName: args.tenantName } }),
    createPlan: (args: CreateSubscriptionPlan) => {
        const { isSpecializedPlan, tenantIds, ...rest } = args;
        return axiosClient.post('/api/subscription/plans', rest);
    },
    updatePlan: (args: SubscriptionPlan) => {
        const { id, createdAt, updatedAt, tenantIds, isSpecializedPlan, specializedPlanId, olderId, tenantNames, ...rest } = args;
        return axiosClient.patch(`/api/subscription/plans/${id}`, rest)
    },
    deletePlan: (id: string) => axiosClient.delete(`/api/subscription/plans/${id}`),
    archivePlan: (planId: string) => axiosClient.post(`/api/subscription/plans/${planId}/archive`),
    unarchivePlan: (planId: string) => axiosClient.post(`/api/subscription/plans/${planId}/unarchive`),
    createSpecialPlan: (args: CreateSubscriptionPlan) => {
        const { tenantIds, ...rest } = args;
        return axiosClient.post('api/subscription/plans/specialized', { plan: rest, tenantIds })
    },
    fetchCurrentPlan: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/active-subscription`),
    checkCanCreateOrder: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/can-create-order`),
    checkCanTableCreate: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/can-create-table`),
    checkCanQRCreate: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/can-create-qr`),
    checkCanUserCreate: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/can-create-user`),
}

export default SubscriptionsAPI;