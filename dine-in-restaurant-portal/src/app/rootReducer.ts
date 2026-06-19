import { combineReducers } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSilce'
import tenantsReducer from '../features/tenants/tenantsSlice'
import restaurantReducer from '../features/restaurants/restaurantsSlice'
import userRoleReducer from '../features/userRoles/userRolesSlice'
import categoryReducer from '../features/category/categorySlice'
import menuItemReducer from '../features/menuItems/menuItemSlice'
import qrReducer from '../features/qr/qrSlice'
import orderReducer from '../features/orders/ordersSlice'
import kitchenReducer from "../features/kitchen/kitchenSlice";
import paymentReducer from "../features/payment/paymentSlice";
import tablesReducer from "../features/tables/tablesSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import analyticsReducer from "../features/analytics/analyticsSlice";
import customerReducer from "../features/customers/customerSlice";
import subscriptionReducer from "../features/subscriptions/subscriptionsSlice";
import rateReducer from "../features/rates/rateSlice";
import transactionsReducer from "../features/transactions/transactionsSlice";
import addOnReducer from "../features/addOns/addOnSlice";
import staffReducer from "../features/staff/staffSlice";
import cashierReducer from "../features/cashier/cashierSlice";

const rootReducer = combineReducers({
    auth: authReducer,
    tenants: tenantsReducer,
    restaurant: restaurantReducer,
    userRole: userRoleReducer,
    category: categoryReducer,
    menu: menuItemReducer,
    qr: qrReducer,
    orders: orderReducer,
    kitchen: kitchenReducer,
    payment: paymentReducer,
    tables: tablesReducer,
    dashboard: dashboardReducer,
    analytics: analyticsReducer,
    customer: customerReducer,
    subscription: subscriptionReducer,
    rate: rateReducer,
    transactions: transactionsReducer,
    addOn: addOnReducer,
    staff: staffReducer,
    cashier: cashierReducer,
})

const tempRootReducer = (state: any, action: { type: string; }) => {
    if (action.type === 'LOGOUT') {
        // 🔥 resets ALL reducers to initial state
        state = undefined;
    }

    return tempRootReducer(state, action);
};

export default rootReducer