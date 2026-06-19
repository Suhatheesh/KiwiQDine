export interface Transaction {
    id: string;
    restaurantId: string;
    invoiceId: string;
    amount: number;
    type: 'payout' | 'earned' | 'adjustment';
    date: string;
    description: string;
    status: 'Pending' | 'Completed' | 'Cancelled' | 'Failed';
    attachmentUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTransactionPayload {
    amount: number;
    type?: 'payout' | 'earned' | 'adjustment';
    description?: string;
    attachmentUrl?: string;
    status?: string;
}

export interface TransactionUploadResponse {
    key: string;
    url: string;
    publicUrl: string;
    bucket: string;
    size: number;
    contentType: string;
}

export interface TransactionFilters {
    status?: string;
    startDate?: string;
    endDate?: string;
}
