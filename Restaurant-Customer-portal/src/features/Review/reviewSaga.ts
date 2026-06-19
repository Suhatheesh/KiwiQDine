import { call, CallEffect, put, PutEffect, takeLatest } from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import { ReviewAPI } from "./reviewAPI";
import { ReviewRequest, ReviewResponse } from "./types";
import { submitReviewRequest, submitReviewSuccess, submitReviewFailure } from "./reviewSlice";
import { handleApiError } from "../../api/handleApiError";
import { toast } from "react-toastify";

function* submitReviewSaga({ payload }: PayloadAction<ReviewRequest>): Generator<CallEffect | PutEffect, void, ReviewResponse> {
    try {
        const response = yield call(ReviewAPI.submitReview, payload);
        yield put(submitReviewSuccess(response));
        toast.success('Thank you for your feedback!');
    } catch (err) {
        const errorMessage = handleApiError(err);
        yield put(submitReviewFailure(errorMessage));
        toast.error('Failed to submit review. Please try again.');
    }
}

export function* watchReviewSaga() {
    yield takeLatest(submitReviewRequest.type, submitReviewSaga);
}
