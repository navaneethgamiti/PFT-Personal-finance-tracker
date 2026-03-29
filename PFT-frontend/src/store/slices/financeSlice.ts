import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Account, Budget, Category, FinanceState, Goal, RecurringTransaction, Transaction } from "@/types/domain";
import { emptyFinanceState, seedFinanceState } from "@/utils/seedData";
import { backendApi } from "@/services/backendApi";

const STORAGE_KEY = "pft-finance-state";

const loadState = (): FinanceState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyFinanceState;

  try {
    return JSON.parse(raw) as FinanceState;
  } catch {
    return emptyFinanceState;
  }
};

const saveState = (state: FinanceState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadFinanceAsync = createAsyncThunk("finance/loadFinanceAsync", async (userId: string) => {
  const snapshot = await backendApi.getFinanceSnapshot(userId);
  return snapshot as FinanceState;
});

export const addAccountAsync = createAsyncThunk(
  "finance/addAccountAsync",
  async (payload: Omit<Account, "id" | "lastUpdatedAt" | "currentBalance">, thunkApi) => {
    await backendApi.createAccount({
      name: payload.name,
      type: payload.type,
      openingBalance: payload.openingBalance
    });
    await thunkApi.dispatch(loadFinanceAsync(payload.userId));
  }
);

export const addCategoryAsync = createAsyncThunk(
  "finance/addCategoryAsync",
  async (payload: Omit<Category, "id" | "isArchived">, thunkApi) => {
    await backendApi.createCategory({
      name: payload.name,
      type: payload.type
    });
    await thunkApi.dispatch(loadFinanceAsync(payload.userId));
  }
);

export const addTransactionAsync = createAsyncThunk(
  "finance/addTransactionAsync",
  async (payload: Omit<Transaction, "id" | "createdAt" | "updatedAt">, thunkApi) => {
    await backendApi.createTransaction({
      accountId: payload.accountId,
      categoryId: payload.categoryId,
      type: payload.type,
      amount: payload.amount,
      date: payload.date,
      merchant: payload.merchant,
      note: payload.note,
      tags: payload.tags,
      destinationAccountId: payload.destinationAccountId
    });
    await thunkApi.dispatch(loadFinanceAsync(payload.userId));
  }
);

export const deleteTransactionAsync = createAsyncThunk(
  "finance/deleteTransactionAsync",
  async (payload: { id: string; userId: string }, thunkApi) => {
    await backendApi.deleteTransaction(payload.id);
    await thunkApi.dispatch(loadFinanceAsync(payload.userId));
  }
);

export const addBudgetAsync = createAsyncThunk("finance/addBudgetAsync", async (payload: Omit<Budget, "id">, thunkApi) => {
  await backendApi.upsertBudget({
    categoryId: payload.categoryId,
    amount: payload.amount,
    month: payload.month,
    year: payload.year,
    alertThresholdPercent: payload.alertThresholdPercent
  });
  await thunkApi.dispatch(loadFinanceAsync(payload.userId));
});

export const duplicateBudgetsAsync = createAsyncThunk(
  "finance/duplicateBudgetsAsync",
  async (payload: { userId: string; month: number; year: number }, thunkApi) => {
    await backendApi.duplicateBudgets({ month: payload.month, year: payload.year });
    await thunkApi.dispatch(loadFinanceAsync(payload.userId));
  }
);

export const addGoalAsync = createAsyncThunk(
  "finance/addGoalAsync",
  async (payload: Omit<Goal, "id" | "currentAmount" | "status">, thunkApi) => {
    await backendApi.createGoal({ name: payload.name, targetAmount: payload.targetAmount, targetDate: payload.targetDate });
    await thunkApi.dispatch(loadFinanceAsync(payload.userId));
  }
);

export const contributeToGoalAsync = createAsyncThunk(
  "finance/contributeToGoalAsync",
  async (payload: { goalId: string; amount: number; userId: string }, thunkApi) => {
    await backendApi.contributeGoal(payload.goalId, payload.amount);
    await thunkApi.dispatch(loadFinanceAsync(payload.userId));
  }
);

export const withdrawFromGoalAsync = createAsyncThunk(
  "finance/withdrawFromGoalAsync",
  async (payload: { goalId: string; amount: number; userId: string }, thunkApi) => {
    await backendApi.withdrawGoal(payload.goalId, payload.amount);
    await thunkApi.dispatch(loadFinanceAsync(payload.userId));
  }
);

export const addRecurringAsync = createAsyncThunk(
  "finance/addRecurringAsync",
  async (payload: Omit<RecurringTransaction, "id" | "isPaused">, thunkApi) => {
    await backendApi.createRecurring({
      accountId: payload.accountId,
      categoryId: payload.categoryId,
      amount: payload.amount,
      frequency: payload.frequency,
      note: payload.title
    });
    await thunkApi.dispatch(loadFinanceAsync(payload.userId));
  }
);

export const toggleRecurringPausedAsync = createAsyncThunk(
  "finance/toggleRecurringPausedAsync",
  async (payload: { id: string; userId: string; isPaused: boolean; amount: number; frequency: RecurringTransaction["frequency"]; nextRunDate: string; title: string }, thunkApi) => {
    await backendApi.toggleRecurring(payload.id, payload.isPaused, payload.amount, payload.frequency, payload.nextRunDate, payload.title);
    await thunkApi.dispatch(loadFinanceAsync(payload.userId));
  }
);

const financeSlice = createSlice({
  name: "finance",
  initialState: loadState(),
  reducers: {
    resetToSeedState() {
      saveState(seedFinanceState);
      return seedFinanceState;
    },
    setFinanceState(_state, action: PayloadAction<FinanceState>) {
      saveState(action.payload);
      return action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadFinanceAsync.fulfilled, (_state, action) => {
      saveState(action.payload);
      return action.payload;
    });
  }
});

export const { resetToSeedState, setFinanceState } = financeSlice.actions;
export default financeSlice.reducer;
