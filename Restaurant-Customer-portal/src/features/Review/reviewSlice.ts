import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialReviewType, ReviewRequest, ReviewResponse } from "./types";

const initialState: InitialReviewType = {
    review: null,
    isSubmitting: false,
    loading: false,
    error: null
};

const reviewSlice = createSlice({
    name: "review",
    initialState,
    reducers: {
        submitReviewRequest: (state, _action: PayloadAction<ReviewRequest>) => {
            state.loading = true;
            state.isSubmitting = true;
            state.error = null;
        },
        submitReviewSuccess: (state, action: PayloadAction<ReviewResponse>) => {
            state.loading = false;
            state.isSubmitting = false;
            state.review = action.payload;
        },
        submitReviewFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isSubmitting = false;
            state.error = action.payload;
        },
        resetReviewState: (state) => {
            state.review = null;
            state.isSubmitting = false;
            state.loading = false;
            state.error = null;
        }
    }
});

export const {
    submitReviewRequest,
    submitReviewSuccess,
    submitReviewFailure,
    resetReviewState
} = reviewSlice.actions;

export default reviewSlice.reducer;
