import { call, put, takeLatest, all } from 'redux-saga/effects';
import {
    fetchSummaryDataRequest,
    fetchSummaryDataSuccess,
    fetchSummaryDataFailure,
    fetchDashboardAnalyticsSuccess,
    fetchDashboardAnalyticsFailure,
    fetchDashboardAnalyticsRequest,
} from './analyticsSlice';
import { PayloadAction } from '@reduxjs/toolkit';
import { PeriodType } from './types';
import AnalyticsAPI from './analyticsAPI';
import { handleApiError } from '../../api/handleApiError';
import { toast } from 'react-toastify';

function* safeCall<T>(apiCall: () => Promise<{ data: T }>) {
    try {
        const response: { data: T } = yield call(apiCall);
        return response.data || response;
    } catch (error: any) {
        console.error('Dashboard API Error:', error);
        return null;
    }
}

function* fetchSummaryDataSaga(action: PayloadAction<{ period: PeriodType, restaurantId: string }>): Generator<any, void, any> {
    try {
        const period = action.payload.period || 'today';
        const restaurantId = action.payload.restaurantId;
        const [
            salesResponse,
            categoryResponse,
            paymentResponse,
            analyticsResponse,
        ] = yield all([
            call(safeCall, () => AnalyticsAPI.fetchSalesOverview(period, restaurantId)),
            call(safeCall, () => AnalyticsAPI.fetchOrderByCategory(period, restaurantId)),
            call(safeCall, () => AnalyticsAPI.fetchPaymentOverview(period, restaurantId)),
            call(safeCall, () => AnalyticsAPI.fetchRestaurantAnalytics(period, restaurantId)),
        ]);

        const salesOverview = (salesResponse || []).map((item: any) => ({
            time: item.date || item.time,
            hour: item.hour || 0,
            revenue: item.revenue || 0
        }));

        yield put(
            fetchSummaryDataSuccess({
                salesOverview,
                orderByCategory: categoryResponse || [],
                paymentOverview: paymentResponse || [],
                restaurantAnalytics: analyticsResponse || null,
            })
        );
    } catch (error: any) {
        toast.error(handleApiError(error));
        yield put(fetchSummaryDataFailure(handleApiError(error)));
    }
}

function* fetchDashboardAnalyticsSaga(action: PayloadAction<{ period: PeriodType }>): Generator<any, void, any> {
    try {
        const period = action.payload.period || 'today';
        const [
            subscriptionRevenueResponse,
            platformGrowthResponse,
            userGrowthResponse,
            revenueByPlanResponse,
        ] = yield all([
            call(safeCall, () => AnalyticsAPI.fetchSubscriptionRevenueTrends(period)),
            call(safeCall, () => AnalyticsAPI.fetchPlatformGrowthTrends(period)),
            call(safeCall, () => AnalyticsAPI.fetchUserGrowthTrends(period)),
            call(safeCall, () => AnalyticsAPI.fetchRevenueByPlan(period)),
        ]);
        yield put(
            fetchDashboardAnalyticsSuccess({
                subscriptionRevenueResponse,
                platformGrowthResponse,
                userGrowthResponse,
                revenueByPlanResponse,
            })
        );
    } catch (error: any) {
        toast.error(handleApiError(error));
        yield put(fetchDashboardAnalyticsFailure(handleApiError(error)));
    }
}

export function* watchAnalyticsSaga() {
    yield takeLatest(fetchSummaryDataRequest.type, fetchSummaryDataSaga);
    yield takeLatest(fetchDashboardAnalyticsRequest.type, fetchDashboardAnalyticsSaga);
}
