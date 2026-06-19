import axiosClient from "../../api/axiosClient";
import { InvoiceRequest } from "./types";

const InvoiceAPI = {
    fetchInvoices: (args: InvoiceRequest) => axiosClient.get(`/api/invoices`, { params: args }),
    fetchInvoiceByRestaurantId: (restaurantId: string) => axiosClient.get(`/api/invoices`, { params: { restaurantId } }),
    fetchInvoiceSummary: () => axiosClient.get(`/api/invoices/summary`),
    payInvoice: (invoiceId: string) => axiosClient.patch(`/api/invoices/${invoiceId}/mark-paid`),
}

export default InvoiceAPI;
