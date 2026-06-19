import { all, fork } from "redux-saga/effects";
import { watchAuthSaga } from "../features/auth/authSaga";
import { watchUserFoleSaga } from "../features/userRoles/userRolesSaga";
import { watchCategorySaga } from "../features/category/categorySaga";
import { watchMenuItemSaga } from "../features/menuItems/menuItemSaga";
import { watchQRSaga } from "../features/qr/qrSaga";
import { watchOrdersSaga } from "../features/orders/ordersSaga";
import { watchKitchenOrdersSaga } from "../features/kitchen/kitchenSaga";
import { watchPaymentsSaga } from "../features/payment/paymentSaga";
import { watchTablesSaga } from "../features/tables/tablesSaga";
import { watchRestaurantSaga } from "../features/restaurants/restaurantsSaga";
import watchDashboardSaga from "../features/dashboard/dashboardSaga";
import { watchAnalyticsSaga } from "../features/analytics/analyticsSaga";
import { watchCustomerSaga } from "../features/customers/customerSaga";
import { watchSubscriptionSaga } from "../features/subscriptions/subscriptionsSaga";
import { watchRateSaga } from "../features/rates/rateSaga";
import transactionsSaga from "../features/transactions/transactionsSaga";
import { watchAddOnSaga } from "../features/addOns/addOnSaga";
import staffSaga from "../features/staff/staffSaga";
import { watchCashierSaga } from "../features/cashier/cashierSaga";

export default function* rootSaga() {
        yield all([
                fork(watchAuthSaga),
                fork(watchCategorySaga),
                fork(watchMenuItemSaga),
                fork(watchUserFoleSaga),
                fork(watchQRSaga),
                fork(watchOrdersSaga),
                fork(watchKitchenOrdersSaga),
                fork(watchPaymentsSaga),
                fork(watchTablesSaga),
                fork(watchRestaurantSaga),
                fork(watchDashboardSaga),
                fork(watchAnalyticsSaga),
                fork(watchCustomerSaga),
                fork(watchSubscriptionSaga),
                fork(watchRateSaga),
                fork(transactionsSaga),
                fork(watchAddOnSaga),
                fork(staffSaga),
                fork(watchCashierSaga),
        ])
}