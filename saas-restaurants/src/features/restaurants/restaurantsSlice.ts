import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RestaurantRequestResponse, InitialRestaurantType, RestaurantAllRequest, RestaurantAllRequestByTenant, Data, Restaurant, BankDetails, RestaurantSummary, GracePeriodResponse } from "./types";
import { UploadMenuItemImageResponse } from "../menuItems/types";
import { SubscriptionOrderUsage } from "../subscriptions/types";

const initalRestaurantState: InitialRestaurantType = {
    isCreateRestaurant: false,
    isDeleteRestaurant: false,
    data: [],
    loading: false,
    error: null,
    total: 0,
    page: "1",
    limit: "10",
    totalPages: 0,
    image: null,
    restaurant: null,
    bankDetails: {
        bankName: "",
        accountName: "",
        accountNumber: "",
        branch: "",
        iban: "",
        swiftCode: "",
    },
    summary: null,
    imageLoading: false,
    subscriptionOrderUsage: null
}

const restaurantSlice = createSlice({
    name: "/restaurantSlice",
    initialState: initalRestaurantState,
    reducers: {
        increaseLimit: (state, action: PayloadAction<string>) => {
            state.limit = action.payload
        },
        pagination: (state, action: PayloadAction<string>) => {
            state.page = action.payload;
        },

        /** Fetch All Restaurant**/
        fetchAllRestaurantRequest: (state, _: PayloadAction<RestaurantAllRequest>) => {
            state.loading = true;
            state.error = null;
        },
        fetchAllRestaurantSuccess: (state, action: PayloadAction<Data>) => {
            const { limit, page, total, totalPages, data } = action.payload
            state.loading = false;
            state.data = data
            state.limit = limit;
            state.page = page
            state.total = total
            state.totalPages = totalPages
        },
        fetchAllRestaurantFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Fetch Restaurant By Id **/
        fetchRestaurantByIdRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchRestaurantByIdSuccess: (state, action: PayloadAction<Restaurant>) => {
            state.loading = false;
            state.restaurant = action.payload
        },
        fetchRestaurantByIdFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Fetch All Restaurant By Tenant **/
        fetchAllRestaurantsByTenantRequest: (state, _: PayloadAction<RestaurantAllRequestByTenant>) => {
            state.loading = true;
            state.data = []
            state.error = null;
        },
        fetchAllRestaurantsByTenantSuccess: (state, action: PayloadAction<Data>) => {
            const { limit, page, total, totalPages, data } = action.payload
            state.loading = false;
            state.data = data
            state.limit = limit;
            state.page = page
            state.total = total
            state.totalPages = totalPages
            state.loading = false;
            state.data = action.payload.data.map((restaurant) => ({
                ...restaurant,
                isActive: true,
                auditCreatedDateTime: restaurant.createdAt,
            }));
        },
        fetchAllRestaurantsByTenantFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Create Restaurant **/
        createRestaurantsRequest: (state, _: PayloadAction<RestaurantRequestResponse>) => {
            state.loading = true
            state.isCreateRestaurant = false;
            state.error = null
        },
        createRestaurantsSuccess: (state, action: PayloadAction<RestaurantRequestResponse>) => {
            state.loading = false
            state.isCreateRestaurant = true;
            state.data = [{ ...action.payload, isActive: true, auditCreatedDateTime: action.payload.createdAt ?? "" }, ...state.data]
        },
        createRestaurantsFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isCreateRestaurant = false;
            state.error = action.payload;
        },

        /** Update Restaurant **/
        updateRestaurantsRequest: (state, _: PayloadAction<RestaurantRequestResponse>) => {
            state.loading = true
            state.isCreateRestaurant = false;
            state.error = null
        },
        updateRestaurantsSuccess: (state, action: PayloadAction<RestaurantRequestResponse>) => {
            state.loading = false
            state.isCreateRestaurant = true;
            state.data = state.data.map(restaurant =>
                restaurant.id === action.payload.id ? { ...action.payload, isActive: true, auditCreatedDateTime: action.payload.createdAt } : restaurant
            );
        },
        updateRestaurantsFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isCreateRestaurant = false;
            state.error = action.payload;
        },

        /** Delete Restaurant **/
        deleteRestaurantsRequest: (state, _: PayloadAction<RestaurantRequestResponse>) => {
            state.loading = true
            state.isDeleteRestaurant = false;
            state.error = null
        },
        deleteRestaurantsSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false
            state.isDeleteRestaurant = true;
            state.data = state.data.map(restaurant =>
                restaurant.id === action.payload ? { ...restaurant, isActive: false } : restaurant
            );
        },
        deleteRestaurantsFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isDeleteRestaurant = false;
            state.error = action.payload;
        },

        /** Upload Menu Item Image **/
        uploadRestaurantImageRequest: (state, _: PayloadAction<{ image: string }>) => {
            state.imageLoading = true;
            state.image = null;
            state.error = null;
        },
        uploadRestaurantImageSuccess: (state, action: PayloadAction<UploadMenuItemImageResponse>) => {
            state.imageLoading = false;
            state.image = action.payload;
        },
        uploadRestaurantImageFaliure: (state, action: PayloadAction<string>) => {
            state.imageLoading = false;
            state.error = action.payload;
        },

        /** Fetch Bank Details **/
        fetchBankDetailsRequest: (state, _: PayloadAction<string>) => {
            state.error = null;
        },
        fetchBankDetailsSuccess: (state, action: PayloadAction<BankDetails>) => {
            console.log(action.payload);

            state.bankDetails = action.payload;
        },
        fetchBankDetailsFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Update Bank Details **/
        updateBankDetailsRequest: (state, _: PayloadAction<{ restaurantId: string, bankDetails: BankDetails }>) => {
            state.loading = true;
            state.error = null;
        },
        updateBankDetailsSuccess: (state, action: PayloadAction<BankDetails>) => {
            state.loading = false;
            state.bankDetails = action.payload;
        },
        updateBankDetailsFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Reactivate Restaurant **/
        reactivateRestaurantsRequest: (state, _: PayloadAction<{ tenantId: string, restaurantId: string }>) => {
            state.loading = true;
            state.isDeleteRestaurant = false;
            state.error = null;
        },
        reactivateRestaurantsSuccess: (state, action: PayloadAction<Restaurant>) => {
            state.loading = false;
            state.isDeleteRestaurant = true;
            state.data = state.data.map(restaurant =>
                restaurant.id === action.payload.id ? { ...action.payload, isActive: true } : restaurant
            );
        },
        reactivateRestaurantsFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isDeleteRestaurant = false;
            state.error = action.payload;
        },
        /** Fetch Restaurant Summary **/
        fetchRestaurantSummaryRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchRestaurantSummarySuccess: (state, action: PayloadAction<RestaurantSummary>) => {
            state.loading = false;
            state.summary = action.payload;
        },
        fetchRestaurantSummaryFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Fetch Subscription Order Usage */
        fetchSubscriptionOrderUsageRequest: (state, _: PayloadAction<string>) => {
            state.error = null;
        },
        fetchSubscriptionOrderUsageSuccess: (state, action: PayloadAction<SubscriptionOrderUsage>) => {
            state.subscriptionOrderUsage = action.payload;
        },
        fetchSubscriptionOrderUsageFaliure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
        },

        /* Update Grace Period End Date */
        updateGracePeriodEndDateRequest: (state, _: PayloadAction<{ restaurantId: string, gracePeriodEndDate: string }>) => {
            state.loading = true;
            state.error = null;
        },
        updateGracePeriodEndDateSuccess: (state, action: PayloadAction<GracePeriodResponse>) => {
            state.loading = false;
            state.restaurant = { ...state.restaurant!, gracePeriodEndDate: action.payload.data.restaurant.gracePeriodEndDate }
        },
        updateGracePeriodEndDateFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
});

export const {
    increaseLimit,
    pagination,

    fetchAllRestaurantRequest,
    fetchAllRestaurantSuccess,
    fetchAllRestaurantFaliure,

    fetchRestaurantByIdRequest,
    fetchRestaurantByIdSuccess,
    fetchRestaurantByIdFaliure,

    fetchAllRestaurantsByTenantRequest,
    fetchAllRestaurantsByTenantSuccess,
    fetchAllRestaurantsByTenantFaliure,

    createRestaurantsRequest,
    createRestaurantsSuccess,
    createRestaurantsFaliure,

    updateRestaurantsRequest,
    updateRestaurantsSuccess,
    updateRestaurantsFaliure,

    deleteRestaurantsRequest,
    deleteRestaurantsSuccess,
    deleteRestaurantsFaliure,


    fetchRestaurantSummaryRequest,
    fetchRestaurantSummarySuccess,
    fetchRestaurantSummaryFaliure,
    uploadRestaurantImageRequest,
    uploadRestaurantImageSuccess,
    uploadRestaurantImageFaliure,

    fetchBankDetailsRequest,
    fetchBankDetailsSuccess,
    fetchBankDetailsFaliure,

    updateBankDetailsRequest,
    updateBankDetailsSuccess,
    updateBankDetailsFaliure,

    reactivateRestaurantsRequest,
    reactivateRestaurantsSuccess,
    reactivateRestaurantsFaliure,

    fetchSubscriptionOrderUsageRequest,
    fetchSubscriptionOrderUsageSuccess,
    fetchSubscriptionOrderUsageFaliure,

    updateGracePeriodEndDateRequest,
    updateGracePeriodEndDateSuccess,
    updateGracePeriodEndDateFaliure,
} = restaurantSlice.actions;

export default restaurantSlice.reducer;