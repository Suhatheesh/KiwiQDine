import { InitialCommonType } from "../../model/BaseType";

export interface QR {
    id: string;
    tableId: string;
    type: string;
}

export interface QRRestaurant {
    type: string;
    tenantId?: string;
    restaurantType?: string;
    restaurant: {
        id: string;
        name: string;
        logo: string;
        address: string | null;
        paymentTiming?: string;
        tenant: {
            id: string;
            name: string;
            type: string;
        }
        serviceChargePercentage?: string;
        applyServiceCharge?: boolean;
        serviceChargeType?: string;
        fixedServiceCharge?: string;
    }
}

export interface InitialQRType extends InitialCommonType {
    item: QRRestaurant | null;
}