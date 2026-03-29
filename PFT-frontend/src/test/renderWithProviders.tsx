import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import authReducer from "@/store/slices/authSlice";
import financeReducer from "@/store/slices/financeSlice";
import uiReducer from "@/store/slices/uiSlice";

export const renderWithProviders = (ui: ReactElement) => {
  const testStore = configureStore({
    reducer: {
      auth: authReducer,
      finance: financeReducer,
      ui: uiReducer
    }
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <Provider store={testStore}>
          <BrowserRouter>{ui}</BrowserRouter>
        </Provider>
      </QueryClientProvider>
    ),
    store: testStore
  };
};
