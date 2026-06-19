import { combineReducers } from "@reduxjs/toolkit";
import authReducer from '../features/auth/authSilce'
import tenantsReducer from '../features/tenants/tenantsSlice'
import restaurantReducer from '../features/restaurants/restaurantsSlice'
import userRoleReducer from '../features/userRoles/userRolesSlice'
import subscriptionReducer from '../features/subscriptions/subscriptionsSlice'
import tablesReducer from '../features/tables/tablesSlice'
import menuItemsReducer from '../features/menuItems/menuItemSlice'
import categoriesReducer from '../features/category/categorySlice'
import analyticsReducer from '../features/analytics/analyticsSlice'
import qrReducer from '../features/qr/qrSlice'
import addOnReducer from '../features/addOns/addOnSlice'
import invoiceReducer from '../features/invoices/invoiceSlice'

const rootReducer = combineReducers({
    auth: authReducer,
    tenants: tenantsReducer,
    restaurant: restaurantReducer,
    subscriptions: subscriptionReducer,
    userRole: userRoleReducer,
    tables: tablesReducer,
    menuItems: menuItemsReducer,
    categories: categoriesReducer,
    analytics: analyticsReducer,
    qr: qrReducer,
    addOns: addOnReducer,
    invoice: invoiceReducer
})

export default rootReducer