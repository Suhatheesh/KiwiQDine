import { all, fork } from "redux-saga/effects";
import { watchQRSaga } from "../features/QR/QRSaga";
import { watchMenuSaga } from "../features/Menu/menuSaga";
import { watchOrderSaga } from "../features/Order/orderSaga";
import { watchPaymentsSaga } from "../features/Payment/paymentSaga";
import { watchCustomerSaga } from "../features/Customer/customerSaga";
import { watchReviewSaga } from "../features/Review/reviewSaga";
import { watchRestaurantSaga } from "../features/Restaurants/restaurantSaga";
import { watchCartSaga } from "../features/Cart/cartSaga";

export default function* rootSaga() {
    yield all([
        fork(watchQRSaga),
        fork(watchMenuSaga),
        fork(watchOrderSaga),
        fork(watchPaymentsSaga),
        fork(watchCustomerSaga),
        fork(watchReviewSaga),
        fork(watchRestaurantSaga),
        fork(watchCartSaga),
    ])
}