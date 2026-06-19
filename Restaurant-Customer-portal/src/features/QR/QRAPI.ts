import axiosClient from "../../api/axiosClient"
import { QRRestaurant } from "./types"

const QRAPI = {
    fetchQR: (qrCode: string) => axiosClient.get<QRRestaurant>(`/api/customer-portal/qr/${qrCode}`),
}

export { QRAPI }