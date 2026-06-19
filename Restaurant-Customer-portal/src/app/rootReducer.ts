import { combineReducers } from "@reduxjs/toolkit";
import qrReducer from '../features/QR/QRSlice';
import menuReducer from '../features/Menu/menuSlice';
import cartReducer from '../features/Cart/cartSlice';
import orderReducer from '../features/Order/orderSlice';
import paymentReducer from '../features/Payment/paymentSlice';
import customerReducer from '../features/Customer/customerSlice';
import reviewReducer from '../features/Review/reviewSlice';
import restaurantReducer from '../features/Restaurants/restaurantSlice';

const rootReducer = combineReducers({
    qr: qrReducer,
    menu: menuReducer,
    cart: cartReducer,
    customer: customerReducer,
    order: orderReducer,
    payment: paymentReducer,
    review: reviewReducer,
    restaurant: restaurantReducer
})

export default rootReducer