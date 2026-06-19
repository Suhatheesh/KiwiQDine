import type { FC } from "react";
import { Route, Routes } from "react-router-dom";
import { RouteLinks } from "./type";
import { Login } from "../pages/Login";
import { Layout } from "../components/Layout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import { UserRole } from "../utils/constants";
import { Dashboard, Analytics, Invoices, Notifications, Settings, Subscriptions, NotFound } from "../pages";
import { Wallet } from "../pages";
import MenuManage from "../pages/MenuManage";
import { Users } from "../pages/Users";
import { Orders } from "../pages/Orders";
import QRTable from "../pages/QR";
import MenuList from "../pages/MenuList";
import Kitchen from "../pages/Kitchen";
import Payments from "../pages/Payments";
import { Cashier } from "../pages/Cashier";
import { Tables } from "../pages/Tables";
import Unauthorized from "../pages/Unauthorized";
import { StaffAnalytics } from "../pages/StaffAnalytics";
import { StaffDetail } from "../pages/StaffDetail";
import WaiterConfirmation from "../pages/WaiterConfirmation";
import ViewTableOngoingOrder from "../pages/ViewTableOngoingOrder";

const WebRouter: FC = () => {
    return (
        <Routes>
            <Route
                path={RouteLinks.LOGIN}
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />

            <Route element={<Layout />}>
                <Route
                    path={RouteLinks.DASHBOARD}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]}>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.ANALYTICS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]}>
                            <Analytics />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.MENU_MANAGE}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF]}>
                            <MenuManage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.ORDERS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.WAITER, UserRole.MANAGER]}>
                            <Orders allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.TABLES}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.WAITER]}>
                            <Tables />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.CASHIER}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]}>
                            <Cashier />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={`${RouteLinks.CASHIER}/${RouteLinks.PAYMENTS}/:orderId`}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.WAITER, UserRole.MANAGER]}>
                            <Payments />
                        </ProtectedRoute>
                    } />
                <Route
                    path={RouteLinks.QRCODE}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]}>
                            <QRTable />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.INVOICES}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN]}>
                            <Invoices />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.USERS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN]}>
                            <Users />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/analytics"
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]}>
                            <StaffAnalytics />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/staff/:staffId"
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]}>
                            <StaffDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.KITCHEN}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.KITCHEN_STAFF, UserRole.WAITER, UserRole.MANAGER]}>
                            <Kitchen />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.WAITER_CONFIRMATION}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.KITCHEN_STAFF, UserRole.WAITER, UserRole.MANAGER]}>
                            <WaiterConfirmation />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={`${RouteLinks.TABLES}${RouteLinks.VIEW_TABLE_ONGOING_ORDERS}`}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.KITCHEN_STAFF, UserRole.WAITER, UserRole.MANAGER]}>
                            <ViewTableOngoingOrder />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.NOTIFICATIONS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]}>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={RouteLinks.SETTINGS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN]}>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={RouteLinks.WALLET}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN]}>
                            <Wallet />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={`${RouteLinks.INVOICES}${RouteLinks.SUBSCRIPTIONS}`}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN]}>
                            <Subscriptions />
                        </ProtectedRoute>
                    }
                />
                {[
                    `${RouteLinks.MENU_LIST}/:orderType?/:type?`,
                    `${RouteLinks.MENU_LIST}/:table/:tableId/:orderId?/:orderType?`,
                    `${RouteLinks.TABLES}${RouteLinks.MENU_LIST}/:orderType?`,
                    `${RouteLinks.TABLES}${RouteLinks.MENU_LIST}/:table/:tableId/:orderType?`
                ].map((path) => (
                    <Route
                        key={path}
                        path={path}
                        element={
                            <ProtectedRoute allowedRoles={[UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.WAITER, UserRole.MANAGER]}>
                                <MenuList />
                            </ProtectedRoute>
                        }
                    />
                ))}

            </Route>

            <Route
                path={RouteLinks.UNAUTHORIZED}
                element={<Unauthorized />}
            />

            <Route
                path="*"
                element={<NotFound />}
            />
        </Routes>
    )
}

export default WebRouter;