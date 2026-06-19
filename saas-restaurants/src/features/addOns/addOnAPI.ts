import axiosClient from "../../api/axiosClient";
import { CreateAddOnRequest } from "./types";

const AddOnAPI = {
    createAddOn: (data: CreateAddOnRequest) => {
        const { restaurantId, ...rest } = data;
        return axiosClient.post("/api/addons", rest);
    },
    updateAddOn: (data: CreateAddOnRequest) => {
        const { id, restaurantId, ...rest } = data;
        return axiosClient.patch(`/api/addons/${id}`, rest);
    },
    deleteAddOn: (id: string) => {
        return axiosClient.delete(`/api/addons/${id}`);
    },
    fetchAllAddOns: (restaurantId: string) => {
        return axiosClient.get(`/api/addons/public`, { params: { restaurantId } });
    }

}

export default AddOnAPI