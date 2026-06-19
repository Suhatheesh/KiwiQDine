import { FetchAllRequestType, InitialCommonType } from "../../models/BaseType";
import { Restaurant } from "../restaurants/types";

export interface FetchQRRequest extends FetchAllRequestType {
    restaurantId?: string | null;
    tenantId?: string | null;
}

export interface CreateQRRquest {
    type: string;
    restaurantId?: string | null;
    tableId?: string | null;
    name?: string;
    description?: string;
    tenantId?: string;
}

export interface QR extends CreateQRRquest {
    id: string;
    qrUrl: string;
    type: string;
    status: string;
    restaurant: Restaurant;
    createdAt: string;
}

export interface AllQRResponse {
    data: QR[];
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface InitialQRType extends InitialCommonType {
    qr: QR[];
    isCreateQR: boolean;
    isDeleteQR: boolean;
}
