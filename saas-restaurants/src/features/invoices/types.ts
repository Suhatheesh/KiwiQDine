import { FetchAllRequestType, InitialCommonType } from "../../models/BaseType";

export interface InvoiceRequest extends FetchAllRequestType {
    restaurantId?: string;
    restaurantName?: string;
    status?: string;
    city?: string;
    district?: string;
    planCode?: string;
    billingPeriod?: string;
    fromDate?: string;
    toDate?: string;
    minAmount?: number;
    maxAmount?: number;
    minWalletBalance?: number;
    maxWalletBalance?: number;
}

export interface Invoice {
    id: string;
    invoiceName: string;
    restaurantId: string;
    restaurantName: string;
    billing_period: string;
    plan: string;
    amount: number;
    base_amount: number;
    fees: number;
    status: string;
    due_date: string;
    paid_date: string;
    invoiceAttachmentUrl: string;
    created_at: string;
    updated_at: string;
}

export interface InvoiceGracePeriod {
    status: string;
    gracePeriodStartDate: string;
    gracePeriodEndDate: string;
}

export interface InvoicePayResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        invoiceName: string;
        restaurantId: string;
        amount: number;
        status: string;
        due_date: string;
        paid_date: string;
        billing_period: string;
    }
}

export interface InvoiceSummary {
    totalRevenue: number;
    monthlyRevenue: number;
    pending: number;
    overdue: number;
}

export interface InvoiceResponse {
    data: Invoice[];
    total: number
    page: string
    limit: string
    totalPages: number
}

export interface InvoiceInitialState extends InitialCommonType {
    invoices: InvoiceResponse;
    summary: InvoiceSummary;
}
