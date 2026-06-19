import axiosClient from "../../api/axiosClient";
import { OrderItemResponse } from "../orders/types";
import { CashierOrderRequest } from "./type";

const CashierAPI = {
    fetchCashierOrders: (args: CashierOrderRequest) => axiosClient.get<OrderItemResponse[]>(`/api/orders/cashier/pending`, { params: args }),
}

export default CashierAPI;