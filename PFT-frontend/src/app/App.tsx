import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { TransactionsPage } from "@/features/transactions/TransactionsPage";
import { BudgetsPage } from "@/features/budgets/BudgetsPage";
import { GoalsPage } from "@/features/goals/GoalsPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { RecurringPage } from "@/features/recurring/RecurringPage";
import { AccountsPage } from "@/features/accounts/AccountsPage";
import { RulesPage } from "@/features/accounts/RulesPage";
import { FamilyModePage } from "@/features/accounts/FamilyModePage";
import { SettingsPage } from "@/features/auth/SettingsPage";
import { InsightsPage } from "@/features/reports/InsightsPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { SignUpPage } from "@/features/auth/SignUpPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { AddTransactionModal } from "@/features/transactions/AddTransactionModal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setToastMessage } from "@/store/slices/uiSlice";
import { addAccountAsync, addCategoryAsync, loadFinanceAsync, setFinanceState } from "@/store/slices/financeSlice";
import { emptyFinanceState } from "@/utils/seedData";

export const App = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const toastMessage = useAppSelector((state) => state.ui.toastMessage);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timeout = setTimeout(() => dispatch(setToastMessage(undefined)), 2200);
    return () => clearTimeout(timeout);
  }, [dispatch, toastMessage]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      dispatch(setFinanceState(emptyFinanceState));
      return;
    }

    void (async () => {
      dispatch(setFinanceState(emptyFinanceState));
      const snapshot = await dispatch(loadFinanceAsync(user.id)).unwrap();

      if (!snapshot.accounts.length) {
        await dispatch(
          addAccountAsync({
            userId: user.id,
            name: "Primary Bank",
            type: "bank",
            openingBalance: 0,
            institutionName: "My Bank"
          })
        ).unwrap();
      }

      if (!snapshot.categories.length) {
        const starterCategories: Array<{ name: string; type: "income" | "expense"; color: string; icon: string }> = [
          { name: "Salary", type: "income", color: "#16a34a", icon: "BanknotesIcon" },
          { name: "Groceries", type: "expense", color: "#ef4444", icon: "ShoppingBagIcon" },
          { name: "Transport", type: "expense", color: "#f59e0b", icon: "TruckIcon" },
          { name: "Rent", type: "expense", color: "#7c3aed", icon: "HomeIcon" }
        ];

        for (const item of starterCategories) {
          await dispatch(addCategoryAsync({ userId: user.id, ...item })).unwrap();
        }
      }
    })();
  }, [dispatch, isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/recurring" element={<RecurringPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/family" element={<FamilyModePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
      <AddTransactionModal />
      {toastMessage ? (
        <div className="toast" role="status" data-testid="toast-message">
          {toastMessage}
        </div>
      ) : null}
    </>
  );
};
