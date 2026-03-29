import type { RootState } from "@/store/store";
import { percentOf } from "@/utils/format";

export const selectCurrentMonthTransactions = (state: RootState) => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return state.finance.transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
};

export const selectDashboardSummary = (state: RootState) => {
  const monthTransactions = selectCurrentMonthTransactions(state);

  const income = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expense,
    netBalance: income - expense
  };
};

export const selectBudgetProgress = (state: RootState) => {
  return state.finance.budgets.map((budget) => {
    const spent = state.finance.transactions
      .filter((t) => {
        if (t.type !== "expense") {
          return false;
        }
        const date = new Date(t.date);
        return (
          t.categoryId === budget.categoryId &&
          date.getMonth() + 1 === budget.month &&
          date.getFullYear() === budget.year
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...budget,
      spent,
      usedPercent: percentOf(spent, budget.amount)
    };
  });
};

export const selectCategorySpendData = (state: RootState) => {
  const categoryMap = new Map<string, number>();

  state.finance.transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const key = transaction.categoryId ?? "uncategorized";
      categoryMap.set(key, (categoryMap.get(key) ?? 0) + transaction.amount);
    });

  return [...categoryMap.entries()].map(([categoryId, total]) => {
    const category = state.finance.categories.find((item) => item.id === categoryId);
    return {
      name: category?.name ?? "Uncategorized",
      value: total
    };
  });
};

export const selectTopSpendingCategories = (state: RootState, limit = 3) =>
  selectCategorySpendData(state)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);