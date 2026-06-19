import { InitialCommonType } from "../../models/BaseType";

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

export interface WalletBalance {
    restaurantId: string;
    totalBalance: number;
    walletTotalEarned: number;
    walletTotalWithdrawn: number;
}

export interface TransactionFilters {
    status?: 'Pending' | 'Completed' | 'Cancelled' | 'Failed';
    startDate?: string;
    endDate?: string;
    type?: 'payout' | 'earned' | 'adjustment';
}

export interface TransactionsResponse {
    transactions: Transaction[];
    total: number;
    page?: number;
    limit?: number;
}

export interface InitialTransactionsState extends InitialCommonType {
    transactions: Transaction[];
    walletBalance: WalletBalance | null;
    selectedTransaction: Transaction | null;
    total: number;
    filters: TransactionFilters;
}
