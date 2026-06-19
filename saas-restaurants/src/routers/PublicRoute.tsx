import { FC } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { RouteLinks } from "./type";

interface PublicRouteProps {
    children: React.ReactNode;
}

const PublicRoute: FC<PublicRouteProps> = ({ children }) => {
    const { user } = useAuth();

    if (user) {
        return <Navigate to={RouteLinks.DASHBOARD} replace />
    }
    return <>{children}</>
}

export default PublicRoute;