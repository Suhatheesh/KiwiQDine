import { FetchAllResponse, InitialCommonType } from "../../models/BaseType";
import { Restaurant } from "../restaurants/types";

export interface TableLocation {
    section: string;
    floor: number;
    coordinates?: {
        x: number;
        y: number;
    };
}

export interface Table {
    id: string;
    name: string;
    tableNumber: string;
    capacity: number;
    location: TableLocation;
    status: string;
    qrCode?: string | null;
    qrCodeImage?: string | null;
    restaurantId: string;
    settings?: any;
    restaurant?: Restaurant;
    createdAt: string;
    updatedAt: string;
    orderStatus: OrderStatus
}

export interface OrderStatus {
    activeOrdersCount: number;
    pendingOrdersCount: number;
    hasPendingOrders: boolean;
    latestOrder: LatestOrder,
    activeOrders: LatestOrder[]
}

export interface LatestOrder {
    id: string;
    orderNumber: string;
    status: string;
    customerName: string;
    totalAmount: string;
    itemCount: number;
    createdAt: string;
    createdByType: string;
}

export interface FetchTablesRequest {
    restaurantId?: string;
    page?: number;
    limit?: number;
    status?: string;
}

export interface FetchAllTableResponse extends FetchAllResponse {
    data?: Table[];
}

export interface CreateTableRequest {
    name: string;
    tableNumber: string;
    capacity: number;
    location: TableLocation;
    restaurantId: string;
    status?: string;
    type?: string;
}

export interface DeleteTableRequest {
    tableId: string;
    restaurantId: string;
    qrId: string;
}

export interface UpdateTableRequest extends CreateTableRequest {
    tableId?: string;
}

export interface UpdateTableStatusRequest {
    tableId: string;
    status: string;
    restaurantId: string;
}

export interface InitialTableType extends InitialCommonType, FetchAllTableResponse {
    table: Table | null;
    isTableCreated: boolean;
    isTableUpdated: boolean;
    isTableDeleted: boolean;
}
