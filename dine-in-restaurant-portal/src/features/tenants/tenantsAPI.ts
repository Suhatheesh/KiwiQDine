import axiosClient from "../../api/axiosClient";
import { TenantResponseLight, TenantsResponse } from "./types";

const TenantsAPI = {
    fetchAllTenants: () => axiosClient.get<TenantsResponse>('/api/tenants'),
    fetchTenantsIdName: () => axiosClient.get<TenantResponseLight[]>('/tenants/list')
}

export default TenantsAPI;