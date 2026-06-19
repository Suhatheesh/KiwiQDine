import axiosClient from "../../api/axiosClient";
import { CustomerOTPRequest, CustomerVerifyRequest } from "./types";

const CustomerAPI = {
    customerRefreshToken: (refreshToken: string) => axiosClient.post('/api/customer-portal/auth/refresh', { refreshToken }),
    customerSendOTP: (customer: CustomerOTPRequest) => axiosClient.post('/api/customer-portal/auth/send-otp', customer),
    customerVerify: (customer: CustomerVerifyRequest) => axiosClient.post('/api/customer-portal/auth/verify-otp', customer)
}

export default CustomerAPI;