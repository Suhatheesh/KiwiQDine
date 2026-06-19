import { InitialCommonType } from "../../models/BaseType";

export interface Rate {
    id: string;
    customerId: string;
    restaurantId: string;
    orderId: string;
    rating: number;
    comment: string;
    metadata: {
        foodQuality: number;
        service: number;
        ambiance: number;
        valueForMoney: number;
    };
    customer: {
        id: string;
        name: string;
        phone: string;
    };
    restaurant: {
        id: string;
        name: string;
    };
    order: {
        id: string;
        orderNumber: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface RateResponse {
    data: Rate[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface InitialRateState extends InitialCommonType {
    rate: Rate | null;
}