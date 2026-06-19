import { InitialCommonType } from "../../model/BaseType";

export interface PaymentProcessRequest {
    paymentMethod: string;
    paymentReference?: string;
    amount?: string;
    orderId: string;
    phone?: string;
}

export interface PaymentProcessResponse {
    success: boolean;
    payment: {
        id: string;
        orderId: string;
        method: string;
        amount: number;
        status: string;
        createdAt: string;
    };
    order: {
        id: string;
        orderNumber: string;
        totalAmount: number;
        status: string;
    };
    phone?: string;
}

export interface InitialPaymentType extends InitialCommonType {
    payment: PaymentProcessResponse | null;
    isPaymentConfirm: boolean;
}

export interface UpdateRestaurantWalletDto {
    restaurantId: string;
    totalBalance: number;
}

export interface UpdateRestaurantWalletResponse {
    success: boolean;
    walletBalance?: number;
}