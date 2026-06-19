import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import createSagaMiddleware from "redux-saga";
import rootSaga from "./rootSaga";

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
    reducer: rootReducer,
    middleware(getDefaultMiddleware) {
        return getDefaultMiddleware({
            thunk: false
        }).concat(sagaMiddleware)
    },
    devTools: true
});

store.subscribe(() => {
    const { cartItem } = store.getState().cart;
    sessionStorage.setItem('cartItem', JSON.stringify(cartItem));
})

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch;

export default store;