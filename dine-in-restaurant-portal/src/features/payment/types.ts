import { InitialCommonType } from "../../models/BaseType";

export interface PaymentProcessRequest {
    paymentMethod: string;
    paymentTiming?: string;
    paymentReference?: string;
    notes?: string;
    orderId: string;
    restaurantId: string;
}

export interface EnableServiceChargeRequest {
    restaurantId: string;
    applyServiceCharge: boolean;
    serviceChargeType: string;
    fixedServiceCharge?: number;
    serviceChargePercentage?: number;
}


export interface InitialPaymentType extends InitialCommonType {
    payment: any[];
    isPaymentConfirm: boolean;
    isServiceChargeEnabled: boolean;
}