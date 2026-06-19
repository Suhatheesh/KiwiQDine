import { FetchAllResponse, InitialCommonType } from "../../models/BaseType";
import { Customer } from "../orders/types";

export interface CustomerInsertRequest {
    customerName: string;
    phone: string;
}
export interface CustomerResponse extends FetchAllResponse {
    data: Customer[];
}

export interface InitialCustomerType extends InitialCommonType {
    customers: Customer[] | null;
}