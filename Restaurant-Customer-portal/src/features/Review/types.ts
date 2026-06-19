import { InitialCommonType } from "../../model/BaseType";

export interface ReviewMetadata {
    foodQuality: number;
    service: number;
    ambiance: number;
    valueForMoney: number;
}

export interface ReviewRequest {
    customerId?: string;
    restaurantId: string;
    orderId: string;
    rating: number;
    comment: string;
    metadata: ReviewMetadata;
}

export interface ReviewResponse {
    id?: string;
}

export interface InitialReviewType extends InitialCommonType {
    review: ReviewResponse | null;
    isSubmitting: boolean;
}
