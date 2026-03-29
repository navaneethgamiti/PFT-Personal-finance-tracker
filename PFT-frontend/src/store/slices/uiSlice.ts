import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  addTransactionModalOpen: boolean;
  transactionSearchTerm: string;
  selectedDateRange: "month" | "quarter" | "year";
  toastMessage?: string;
}

const initialState: UiState = {
  addTransactionModalOpen: false,
  transactionSearchTerm: "",
  selectedDateRange: "month"
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setAddTransactionModalOpen(state, action: PayloadAction<boolean>) {
      state.addTransactionModalOpen = action.payload;
    },
    setTransactionSearchTerm(state, action: PayloadAction<string>) {
      state.transactionSearchTerm = action.payload;
    },
    setSelectedDateRange(state, action: PayloadAction<UiState["selectedDateRange"]>) {
      state.selectedDateRange = action.payload;
    },
    setToastMessage(state, action: PayloadAction<string | undefined>) {
      state.toastMessage = action.payload;
    }
  }
});

export const {
  setAddTransactionModalOpen,
  setSelectedDateRange,
  setToastMessage,
  setTransactionSearchTerm
} = uiSlice.actions;

export default uiSlice.reducer;