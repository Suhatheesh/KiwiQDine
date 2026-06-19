import axiosClient from "../../api/axiosClient";
import { CreateTableRequest, FetchAllTableResponse, FetchTablesRequest, Table, UpdateTableRequest, UpdateTableStatusRequest } from "./types";

const TablesAPI = {
    fetchTables: ({ restaurantId, page = 1, limit = 10, status }: FetchTablesRequest) => {
        const params: any = { page, limit };
        if (restaurantId) params.restaurantId = restaurantId;
        if (status && status !== 'all') params.status = status;
        return axiosClient.get<FetchAllTableResponse>('/api/tables', { params });
    },
    createTable: (args: CreateTableRequest) => {
        const { type, ...rest } = args;
        return axiosClient.post<FetchTablesRequest>('/api/tables', rest)
    },
    updateTable: (args: UpdateTableRequest) => {
        const { tableId, restaurantId, ...rest } = args;
        return axiosClient.patch<Table>(`/api/tables/${tableId}`, rest, { params: { restaurantId } });
    },
    updateTableStatus: (args: UpdateTableStatusRequest) => {
        const { tableId, restaurantId, ...rest } = args;
        return axiosClient.patch<Table>(`/api/tables/${tableId}/status`, rest, { params: { restaurantId } });
    },
    deleteTable: (tableId: string, restaurantId: string) => axiosClient.delete(`/api/tables/${tableId}`, { params: { restaurantId } }),
}

export default TablesAPI;
