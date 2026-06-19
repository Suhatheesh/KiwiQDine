import { Route, Routes } from "react-router-dom"
import { RootLinks } from "./types"
import Welcome from "../pages/Welcome"
import { Menu } from "../pages/Menu"
import ReviewOrder from "../pages/ReviewOrder"
import OrderSummary from "../pages/OrderSummary"
import CompleteOrder from "../pages/CompleteOrder"
import OTPVerification from "../pages/OTPVerification"
import OrderStatus from "../pages/OrderStatus"
import OngoingOrders from "../pages/OngoingOrders"
import ReviewPage from "../pages/ReviewPage"
import RestaurantList from "../pages/RestaurantList"
import ReviewFoodCourtOrder from "../pages/ReviewFoodCourtOrder"
import FoodCourtOrderSummary from "../pages/FoodCourtOrderSummary"
import FoodCourtMainLayout from "../pages/FoodCourtMainPage"

const WebRouter = () => {
    return (
        <Routes>
            {['/restaurant/qr/:tenantId/:restaurantId/:qrId/:orderType/:tableId?/:tableNo?',
                '/foodcourt/qr/:tenantId/:qrId/:orderType?'].map((path) => (
                    <Route
                        path={path}
                        element={<Welcome />}
                    />
                ))}
            <Route element={<FoodCourtMainLayout />}
            >
                <Route
                    path={RootLinks.RESTAURANTLIST}
                    element={<RestaurantList />}
                />
                <Route
                    path={RootLinks.MENU}
                    element={<Menu />}
                />
                <Route
                    path={RootLinks.REVIEWORDER}
                    element={<ReviewOrder />}
                />
                <Route
                    path={RootLinks.ONGOINGORDERS}
                    element={<OngoingOrders />}
                />
                <Route
                    path={RootLinks.FOODCOURT_ORDER_SUMMARY}
                    element={<FoodCourtOrderSummary />}
                />
                <Route
                    path={`${RootLinks.ORDERSTATUS}/:orderId`}
                    element={<OrderStatus />}
                />
            </Route>
            <Route
                path={`${RootLinks.FINALISEORDER}/:orderId?/:total?`}
                element={<CompleteOrder />}
            />
            <Route
                path={RootLinks.OTPVERIFICATION}
                element={<OTPVerification />}
            />
            <Route
                path={`${RootLinks.ORDERSUMMARY}/:orderId`}
                element={<OrderSummary />}
            />
            <Route
                path={`${RootLinks.REVIEW}/:orderId/:customerId`}
                element={<ReviewPage />}
            />
            <Route
                path={RootLinks.REVIEWFOODCOURTORDER}
                element={<ReviewFoodCourtOrder />}
            />
        </Routes>
    )
}

export default WebRouter;