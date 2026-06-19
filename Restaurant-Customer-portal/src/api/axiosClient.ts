import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const OTP_TIMEOUT = import.meta.env.VITE_OTP_TIME;

let tenantIdGetter: () => string | null = () => null;

export function setTenantIdGetter(getter: () => string | null) {
    tenantIdGetter = getter;
}

export function getSessionId() {
    return sessionStorage.getItem("cartSessionId");
}

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const axiosClient = axios.create({
    baseURL: apiBaseUrl,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    }
});

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axiosClient.interceptors.request.use(
    (value: InternalAxiosRequestConfig<any>) => {
        const token = sessionStorage.getItem("accessToken");
        if (token) {
            value.headers.Authorization = `Bearer ${token}`;
        }
        return value;
    },
    (error: any) => Promise.reject(error)
);

axiosClient.interceptors.request.use(
    (value: InternalAxiosRequestConfig<any>) => {
        const tenantId = tenantIdGetter();
        const sessionId = getSessionId();
        if (tenantId) {
            value.headers.set("x-tenant-id", tenantId)
        }
        if (sessionId) {
            value.headers.set("x-session-id", sessionId)
        }
        return value;
    },
    (error: any) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    async (error: any) => {
        const originalRequest = error.config;
        if (!error.response) {
            console.error("Network error:", error);
            return Promise.reject({ message: "Network Error. Please try again." });
        }
        const { status } = error.response;

        if (status === 401) {
            if (isRefreshing) {
                try {
                    const token = await new Promise(function (resolve, reject) {
                        failedQueue.push({ resolve, reject });
                    });
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return await axiosClient(originalRequest);
                } catch (err) {
                    return await Promise.reject(err);
                }
            }
            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = sessionStorage.getItem("refreshToken");

            try {
                const response = await axios.post(`${apiBaseUrl}/api/customer-portal/auth/refresh`, { refreshToken });
                const { accessToken: access_token, refreshToken: refresh_token } = response.data;

                sessionStorage.setItem("accessToken", access_token)
                sessionStorage.setItem("refreshToken", refresh_token)

                axiosClient.defaults.headers.Authorization = `Bearer ${access_token}`;
                processQueue(null, access_token);

                // Retry original request
                return axiosClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                sessionStorage.removeItem("accessToken");
                sessionStorage.removeItem("refreshToken");
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        } else if (status === 403) {
            console.warn("Forbidden: insufficient permissions");
        } else if (status >= 500) {
            console.error("Server error:", error.response);
        }

        return Promise.reject(error.response?.data || error);
    }
)

export default axiosClient;