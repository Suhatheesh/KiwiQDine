import { FC } from "react";
import { Route, Routes } from "react-router-dom";
import { RouteLinks } from "./type";
import { Login } from "../pages/Login";
import { Layout } from "../components/Layout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import { UserRole } from "../utils/constants";
import { SuperAdminDashboard, Invoices, Notifications, Reports, Restaurants, Settings, Subscriptions, Tenants, Users, RestaurantDetail } from "../pages";
import TenantDetail from "../pages/TenantDetail";
import Unauthorized from "../pages/Unauthorized";

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
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <SuperAdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.RESTAURANTS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <Restaurants />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.RESTAURANT_DETAIL}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <RestaurantDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.TENANT}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <Tenants />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={`${RouteLinks.TENANT}/:tenantId`}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <TenantDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.SUBSCRIPTIONS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <Subscriptions />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.INVOICES}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <Invoices />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.USERS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <Users />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.REPORTS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <Reports />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={RouteLinks.NOTIFICATIONS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path={RouteLinks.SETTINGS}
                    element={
                        <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                            <Settings />
                        </ProtectedRoute>
                    }
                />
            </Route>

            <Route
                path={RouteLinks.UNAUTHORIZED}
                element={<Unauthorized />}
            />
        </Routes>
    )
}

export default WebRouter;