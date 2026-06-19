import { InitialCommonType } from "../../model/BaseType";
import { MenuItem } from "../Menu/types";

export type RestaurantListResponse = RestaurantResponse[]

export interface RestaurantResponse {
    restaurant: Restaurant;
    menus?: MenuItem[];
}

export interface Restaurant {
    id: string;
    tenantId: string;
    name: string;
    logo: string | null;
    address: Address;
    contactEmail: string;
    contactPhoneNumber: string;
    banner?: string | null;
    isActive: boolean;
    openTime: string;
    closeTime: string;
    openHours: string | null;
    status: string;
    paymentTiming: string;
    walletBalance: string;
    serviceChargePercentage?: string;
    applyServiceCharge?: boolean;
    serviceChargeType?: string;
    fixedServiceCharge?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Address {
    city: string;
    lane: string;
    country: string;
    district: string;
}

export interface InitialRestaurantState extends InitialCommonType {
    restaurants: RestaurantListResponse;
}