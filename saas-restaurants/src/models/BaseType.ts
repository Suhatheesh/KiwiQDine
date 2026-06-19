import { LucideIcon } from "lucide-react";
import { RouteLinks } from "../routers/type";

export interface InitialCommonType {
    loading: boolean;
    error: string | null;
}

export interface SideMenuListType {
    id: RouteLinks;
    label: string;
    icon: LucideIcon;
}

export interface DynamicObject {
    [key: string]: any;
}

export interface FetchAllRequestType {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
}

export interface FetchAllResponse {
    total: number
    page: string
    limit: string
    totalPages: number
}
