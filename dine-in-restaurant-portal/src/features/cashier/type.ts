
import { InitialCommonType } from "../../models/BaseType";
import { FetchAllOrdersResponse } from "../orders/types";

export interface CashierOrderRequest {
    restaurantId: string;
    orderType?: string;
    date?: string;
    customerName?: string;
    tableNo?: string;
    orderNumber?: string;
    page: number;
    limit: number;
}

export interface InitialCashierType extends InitialCommonType, FetchAllOrdersResponse { }