import axiosClient from "../../api/axiosClient";

const RateAPI = {
    fetchOrderRate: (orderId: string) => axiosClient.get(`/api/customer-ratings`, { params: { orderId } })
}

export default RateAPI
