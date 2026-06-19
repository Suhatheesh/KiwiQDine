import axiosClient from "../../api/axiosClient";
import { Customer } from "../orders/types";
import { CustomerInsertRequest, CustomerResponse } from "./types";

const CustomerAPI = {
    searchCustomers: (search: string) => axiosClient.get<CustomerResponse>(`/api/customers`, {
        params: { search, page: 1, limit: 10 }
    }),
    insertCustomer: (customer: CustomerInsertRequest) => axiosClient.post<Customer>(`/api/customer-portal/customer/verify`, customer),
}

export default CustomerAPI;
