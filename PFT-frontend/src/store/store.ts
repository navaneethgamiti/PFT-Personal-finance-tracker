import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import financeReducer from "./slices/financeSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    finance: financeReducer,
    ui: uiReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;