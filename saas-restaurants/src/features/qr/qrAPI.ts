import axiosClient from "../../api/axiosClient";
import { FetchQRRequest } from "./types";
import { AllQRResponse, CreateQRRquest, QR } from "./types";

const QRAPI = {
    fetchAllQR: (args: FetchQRRequest) => axiosClient.get<AllQRResponse>('/api/qr-codes', { params: args }),
    createQR: (args: CreateQRRquest) => axiosClient.post<QR>('/api/qr-codes', args),
    updateStatusQR: (status: string, id: string) => axiosClient.patch(`/api/qr-codes/${id}/status`, { status }),
    deleteQR: (id: string) => axiosClient.delete(`/api/qr-codes/${id}`)
}

export default QRAPI;