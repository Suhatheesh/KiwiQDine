import axiosClient from "../../api/axiosClient";
import { ReviewRequest, ReviewResponse } from "./types";

export const ReviewAPI = {
    submitReview: (data: ReviewRequest) => axiosClient.post<ReviewResponse>('/api/customer-ratings', data)
};
