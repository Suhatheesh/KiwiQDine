import { PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { CallEffect, PutEffect, SelectEffect, call, put, select, takeLatest } from "redux-saga/effects";
import { handleApiError } from "../../api/handleApiError";
import {
    fetchTablesRequest,
    fetchTablesSuccess,
    fetchTablesFailure,
    createTableRequest,
    createTableSuccess,
    createTableFailure,
    updateTableRequest,
    updateTableSuccess,
    updateTableFailure,
    deleteTableRequest,
    deleteTableSuccess,
    deleteTableFailure,
    updateTableStatusRequest,
} from "./tablesSlice";
import { CreateTableRequest, DeleteTableRequest, FetchAllTableResponse, FetchTablesRequest, Table, UpdateTableRequest, UpdateTableStatusRequest } from "./types";
import TablesAPI from "./tablesAPI";
import { createQRRequest, deleteQRRequest, fetchAllQRRequest } from "../qr/qrSlice";
import { QRTableType } from "../../utils/constants";
import { RootState } from "../../app/store";
import { QR } from "../qr/types";
import { fetchCanCreateTableRequest } from "../subscriptions/subscriptionsSlice";

function* fetchTablesSaga({ payload: args }: PayloadAction<FetchTablesRequest | undefined>): Generator<CallEffect | PutEffect, void, FetchAllTableResponse> {
    try {
        const response = yield call(TablesAPI.fetchTables, args || {});
        yield put(fetchTablesSuccess(response));
        yield put(fetchAllQRRequest({ restaurantId: args?.restaurantId, page: 1, limit: 10 }))
    } catch (error) {
        const errorMessage = handleApiError(error);
        toast.error(errorMessage);
        yield put(fetchTablesFailure(errorMessage));
    }
}

function* createTableSaga({ payload: args }: PayloadAction<CreateTableRequest>): Generator<CallEffect | PutEffect | SelectEffect, void, any> {
    try {
        const response = yield call(TablesAPI.createTable, args);
        const qrList: QR[] = yield select((state: RootState) => state.qr.qr);
        const qrExists = qrList.some((i) => i.type === QRTableType.TABLE)
        const foodCourtQrExists = qrList.some((i) => i.type === QRTableType.FOOD_COURT)

        if (!qrExists && args.type === QRTableType.TABLE) {
            yield put(createQRRequest({
                name: args?.name ?? "", type: QRTableType.TABLE, description: args.tableNumber ?? "",
                restaurantId: args?.restaurantId ?? ""
            }));
        }
        if (!foodCourtQrExists && args.type === QRTableType.FOOD_COURT) {
            yield put(createQRRequest({
                name: args?.name ?? "", type: QRTableType.FOOD_COURT, description: args.tableNumber ?? "",
                restaurantId: args?.restaurantId ?? ""
            }));
        }
        yield put(createTableSuccess(response));
        yield put(fetchCanCreateTableRequest(args?.restaurantId ?? ""))
        toast.success("Table created successfully!");
    } catch (error) {
        const errorMessage = handleApiError(error);
        toast.error(errorMessage);
        yield put(createTableFailure(errorMessage));
    }
}

function* updateTableSaga({ payload: args }: PayloadAction<UpdateTableRequest>): Generator<CallEffect | PutEffect, void, Table> {
    try {
        const response = yield call(TablesAPI.updateTable, args);
        yield put(updateTableSuccess(response));
        toast.success("Table updated successfully!");
    } catch (error) {
        const errorMessage = handleApiError(error);
        toast.error(errorMessage);
        yield put(updateTableFailure(errorMessage));
    }
}

function* updateTableStatusSaga({ payload: args }: PayloadAction<UpdateTableStatusRequest>): Generator<CallEffect | PutEffect, void, Table> {
    try {
        const response = yield call(TablesAPI.updateTableStatus, args);
        yield put(updateTableSuccess(response));
        toast.success("Table status updated successfully!");
    } catch (error) {
        const errorMessage = handleApiError(error);
        toast.error(errorMessage);
        yield put(updateTableFailure(errorMessage));
    }
}

function* deleteTableSaga({ payload: args }: PayloadAction<DeleteTableRequest>): Generator<CallEffect | PutEffect | SelectEffect, void, any> {
    try {
        yield call(TablesAPI.deleteTable, args);
        yield put(deleteTableSuccess(args.tableId));
        const tableList: Table[] = yield select((state: RootState) => state.tables.data);

        if (tableList.length === 0) {
            yield put(deleteQRRequest(args.qrId));
        }
        toast.success("Table deleted successfully!");
    } catch (error) {
        const errorMessage = handleApiError(error);
        toast.error(errorMessage);
        yield put(deleteTableFailure(errorMessage));
    }
}

export function* watchTablesSaga() {
    yield takeLatest(fetchTablesRequest.type, fetchTablesSaga);
    yield takeLatest(createTableRequest.type, createTableSaga);
    yield takeLatest(updateTableRequest.type, updateTableSaga);
    yield takeLatest(deleteTableRequest.type, deleteTableSaga);
    yield takeLatest(updateTableStatusRequest.type, updateTableStatusSaga);
}
