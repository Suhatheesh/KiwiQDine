import { all, fork } from "redux-saga/effects";
import { watchAuthSaga } from "../features/auth/authSaga";
import { watchTenantsSaga } from "../features/tenants/tenantsSaga";
import { watchRestaurantSaga } from "../features/restaurants/restaurantsSaga";
import { watchUserFoleSaga } from "../features/userRoles/userRolesSaga";
import { watchSubscriptionSaga } from "../features/subscriptions/subscriptionsSaga";
import { watchTablesSaga } from "../features/tables/tablesSaga";
import { watchMenuItemSaga } from "../features/menuItems/menuItemSaga";
import { watchCategorySaga } from "../features/category/categorySaga";
import { watchAnalyticsSaga } from "../features/analytics/analyticsSaga";
import { watchQRSaga } from "../features/qr/qrSaga";
import { watchAddOnSaga } from "../features/addOns/addOnSaga";
import { watchInvoiceSaga } from "../features/invoices/invoiceSaga";

export default function* rootSaga() {
    yield all([
        fork(watchAuthSaga),
        fork(watchTenantsSaga),
        fork(watchRestaurantSaga),
        fork(watchSubscriptionSaga),
        fork(watchUserFoleSaga),
        fork(watchInvoiceSaga),
        fork(watchTablesSaga),
        fork(watchMenuItemSaga),
        fork(watchCategorySaga),
        fork(watchAnalyticsSaga),
        fork(watchQRSaga),
        fork(watchAddOnSaga)
    ])
}