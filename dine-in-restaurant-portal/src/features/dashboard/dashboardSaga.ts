import { call, put, takeLatest, all } from 'redux-saga/effects';
import DashboardAPI from './dashboardAPI';
import {
    fetchSummaryDataRequest,
    fetchSummaryDataSuccess,
    fetchSummaryDataFailure,
} from './dashboardSlice';
import { PayloadAction } from '@reduxjs/toolkit';
import { handleApiError } from '../../api/handleApiError';
import { toast } from 'react-toastify';
import { PeriodType } from './types';

function* safeCall<T>(apiCall: () => Promise<{ data: T }>) {
    try {
        const response: { data: T } = yield call(apiCall);
        return response.data || response;
    } catch (error: any) {
        toast.error(handleApiError(error));
        return null;
    }
}

function* fetchSummaryDataSaga(action: PayloadAction<PeriodType | undefined>): Generator<any, void, any> {
    try {
        const period = action.payload || 'today';

        const [
            summaryResponse,
            salesResponse,
            categoryResponse,
            paymentResponse,
            tableResponse,
            ordersResponse,
            topFoodsResponse,
        ] = yield all([
            call(safeCall, () => DashboardAPI.fetchSummaryCards(period)),
            call(safeCall, () => DashboardAPI.fetchSalesOverview(period)),
            call(safeCall, () => DashboardAPI.fetchOrderByCategory(period)),
            call(safeCall, () => DashboardAPI.fetchPaymentOverview(period)),
            call(safeCall, () => DashboardAPI.fetchTableOverview(period)),
            call(safeCall, () => DashboardAPI.fetchRecentOrders(10)),
            call(safeCall, () => DashboardAPI.fetchTopfoods(period)),
        ]);

        const summaryCards = summaryResponse ? {
            todaysSales: {
                totalRevenue: summaryResponse.todaysSales?.totalRevenue || 0,
                changePercent: summaryResponse.todaysSales?.changePercent || 0,
                trend: summaryResponse.todaysSales?.trend || 'up'
            },
            totalOrdersToday: {
                count: summaryResponse.totalOrdersToday?.count || 0,
                dineIn: summaryResponse.totalOrdersToday?.dineIn || 0,
                takeaway: summaryResponse.totalOrdersToday?.takeaway || 0
            },
            activeTables: {
                occupied: summaryResponse.activeTables?.occupied || 0,
                total: summaryResponse.activeTables?.total || 0,
                available: summaryResponse.activeTables?.available || 0
            },
            topSellingItem: {
                name: summaryResponse.topSellingItem?.name || 'N/A',
                quantity: summaryResponse.topSellingItem?.quantity || 0
            },
        } : null;

        const salesOverview = (salesResponse || []).map((item: any) => ({
            time: item.date || item.time,
            hour: item.hour || 0,
            revenue: item.revenue || 0
        }));

        yield put(
            fetchSummaryDataSuccess({
                summaryCards,
                salesOverview,
                orderByCategory: categoryResponse || [],
                paymentOverview: paymentResponse || [],
                tableOverview: tableResponse || [],
                recentOrders: ordersResponse || [],
                topFoods: topFoodsResponse,
            })
        );
    } catch (error: any) {
        toast.error(handleApiError(error));
        yield put(fetchSummaryDataFailure(handleApiError(error)));
    }
}

export default function* dashboardSaga() {
    yield takeLatest(fetchSummaryDataRequest.type, fetchSummaryDataSaga);
}
