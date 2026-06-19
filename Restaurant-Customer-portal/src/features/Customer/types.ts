import { InitialCommonType } from "../../model/BaseType";

export interface CustomerOTPRequest {
    phoneNumber: string;
    name: string;
}

export interface CustomerResponse {
    id: string;
    phone: string;
    name: string;
    message?: string;
}

export interface CustomerVerifyRequest {
    name: string;
    phoneNumber: string;
    otp: string;
}

export interface CustomerVerifyResponse {
    verified: boolean;
    accessToken: string;
    refreshToken: string;
    customer: CustomerResponse;
}

export interface InitialCustomerType extends InitialCommonType {
    customer: CustomerVerifyResponse | null;
    isOtpSend: boolean;
}
