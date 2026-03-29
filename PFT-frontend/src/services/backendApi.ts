import { apiClient } from "@/services/apiClient";
import type { Account, Budget, Category, Goal, RecurringTransaction, Transaction, User } from "@/types/domain";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: unknown };
  traceId: string;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
}

interface BackendAccount {
  id: string;
  name: string;
  currency: string;
  balance: number;
  type: string;
}

interface BackendCategory {
  id: string;
  name: string;
  type: "Income" | "Expense";
  isDefault: boolean;
  isArchived: boolean;
}

interface BackendTransaction {
  id: string;
  accountId: string;
  categoryId?: string;
  type: "Income" | "Expense" | "TransferOut" | "TransferIn";
  amount: number;
  merchant?: string;
  note?: string;
  tagsCsv?: string;
  transactionDateUtc: string;
}

interface BackendBudget {
  id: string;
  categoryId: string;
  monthStartUtc: string;
  limitAmount: number;
  alertThresholdPercent: number;
}

interface BackendGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDateUtc?: string;
  progressPercent: number;
}

interface BackendRecurring {
  id: string;
  accountId: string;
  categoryId?: string;
  type: "Income" | "Expense";
  amount: number;
  frequency: "Daily" | "Weekly" | "Monthly";
  nextRunAtUtc: string;
  isActive: boolean;
  note?: string;
}

interface HealthScoreDto {
  score: number;
  savingsRatePercent: number;
  budgetAdherencePercent: number;
  cashBufferMonths: number;
  expenseStabilityPercent: number;
}

interface ForecastPointDto {
  dateUtc: string;
  projectedBalance: number;
}

interface CashFlowForecastDto {
  currentBalance: number;
  forecastedEndBalance: number;
  safeToSpend: number;
  hasRisk: boolean;
  riskWarnings: string[];
  trend: ForecastPointDto[];
}

interface RuleDto {
  id: string;
  name: string;
  merchantContains: string;
  categoryId?: string;
  addTag?: string;
  isActive: boolean;
  priority: number;
}

interface AccountMemberDto {
  id: string;
  accountId: string;
  memberUserId: string;
  role: "Owner" | "Editor" | "Viewer";
  createdAtUtc: string;
}

const unwrap = <T>(response: { data: ApiEnvelope<T> }): T => {
  if (!response.data.success) {
    throw new Error(response.data.error?.message ?? "Request failed");
  }
  return response.data.data;
};

const toFrontendAccountType = (type: string): Account["type"] => {
  const t = type.toLowerCase();
  if (t.includes("credit")) return "credit_card";
  if (t.includes("wallet")) return "cash_wallet";
  if (t.includes("saving")) return "savings";
  return "bank";
};

const toBackendAccountType = (type: Account["type"]): string => {
  if (type === "credit_card") return "CreditCard";
  if (type === "cash_wallet") return "Cash";
  if (type === "savings") return "Savings";
  return "Bank";
};

const toBackendTxType = (type: Transaction["type"]): "Income" | "Expense" => (type === "income" ? "Income" : "Expense");

const toFrontendTxType = (type: BackendTransaction["type"]): Transaction["type"] => {
  if (type === "Income") return "income";
  if (type === "Expense") return "expense";
  return "transfer";
};

const parseTokenPart = (token: string): Record<string, unknown> | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const decodeUserFromToken = (token: string): User | null => {
  const payload = parseTokenPart(token);
  if (!payload) return null;

  const userId = typeof payload.userId === "string" ? payload.userId : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  if (!userId || !email) return null;

  return {
    id: userId,
    email,
    displayName: email.split("@")[0]
  };
};

export const backendApi = {
  async register(payload: { fullName: string; email: string; password: string }) {
    const response = await apiClient.post<ApiEnvelope<AuthPayload>>("/auth/register", payload);
    return unwrap({ data: response.data });
  },

  async login(payload: { email: string; password: string }) {
    const response = await apiClient.post<ApiEnvelope<AuthPayload>>("/auth/login", payload);
    return unwrap({ data: response.data });
  },

  async forgotPassword(payload: { email: string }) {
    const response = await apiClient.post<ApiEnvelope<{ token: string }>>("/auth/forgot-password", payload);
    return unwrap({ data: response.data });
  },

  async getFinanceSnapshot(userId: string) {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const [accountsRes, categoriesRes] = await Promise.all([
      apiClient.get<ApiEnvelope<BackendAccount[]>>("/accounts/balances"),
      apiClient.get<ApiEnvelope<BackendCategory[]>>("/categories"),
    ]);

    const [txResult, budgetsResult, goalsResult, recurringResult] = await Promise.allSettled([
      apiClient.get<ApiEnvelope<PagedResult<BackendTransaction>>>("/transactions", { params: { page: 1, pageSize: 100 } }),
      apiClient.get<ApiEnvelope<BackendBudget[]>>("/budgets", { params: { monthStartUtc: monthStart } }),
      apiClient.get<ApiEnvelope<BackendGoal[]>>("/goals"),
      apiClient.get<ApiEnvelope<BackendRecurring[]>>("/recurring")
    ]);

    const accounts = unwrap({ data: accountsRes.data }).map<Account>((a) => ({
      id: a.id,
      userId,
      name: a.name,
      type: toFrontendAccountType(a.type),
      openingBalance: a.balance,
      currentBalance: a.balance,
      institutionName: a.currency,
      lastUpdatedAt: new Date().toISOString()
    }));

    const categories = unwrap({ data: categoriesRes.data }).map<Category>((c) => ({
      id: c.id,
      userId,
      name: c.name,
      type: c.type === "Income" ? "income" : "expense",
      color: c.type === "Income" ? "#16a34a" : "#0ea5e9",
      icon: "Tag",
      isArchived: c.isArchived
    }));

    const transactionsData = txResult.status === "fulfilled" ? unwrap({ data: txResult.value.data }).items : [];
    const budgetsData = budgetsResult.status === "fulfilled" ? unwrap({ data: budgetsResult.value.data }) : [];
    const goalsData = goalsResult.status === "fulfilled" ? unwrap({ data: goalsResult.value.data }) : [];
    const recurringData = recurringResult.status === "fulfilled" ? unwrap({ data: recurringResult.value.data }) : [];

    const transactions = transactionsData.map<Transaction>((t) => ({
      id: t.id,
      userId,
      accountId: t.accountId,
      type: toFrontendTxType(t.type),
      amount: t.amount,
      date: t.transactionDateUtc,
      categoryId: t.categoryId,
      merchant: t.merchant,
      note: t.note,
      tags: t.tagsCsv?.split(",").map((x) => x.trim()).filter(Boolean) ?? [],
      createdAt: t.transactionDateUtc,
      updatedAt: t.transactionDateUtc
    }));

    const budgets = budgetsData.map<Budget>((b) => {
      const monthDate = new Date(b.monthStartUtc);
      return {
        id: b.id,
        userId,
        categoryId: b.categoryId,
        month: monthDate.getUTCMonth() + 1,
        year: monthDate.getUTCFullYear(),
        amount: b.limitAmount,
        alertThresholdPercent: b.alertThresholdPercent
      };
    });

    const goals = goalsData.map<Goal>((g) => ({
      id: g.id,
      userId,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDateUtc,
      linkedAccountId: undefined,
      icon: "FlagIcon",
      color: "#0ea5e9",
      status: g.progressPercent >= 100 ? "completed" : "active"
    }));

    const recurring = recurringData.map<RecurringTransaction>((r) => ({
      id: r.id,
      userId,
      title: r.note ?? "Recurring",
      type: r.type === "Income" ? "income" : "expense",
      amount: r.amount,
      categoryId: r.categoryId,
      accountId: r.accountId,
      frequency: r.frequency.toLowerCase() as RecurringTransaction["frequency"],
      startDate: r.nextRunAtUtc,
      nextRunDate: r.nextRunAtUtc,
      autoCreateTransaction: true,
      isPaused: !r.isActive
    }));

    return { accounts, categories, transactions, budgets, goals, recurring };
  },

  async createAccount(payload: { name: string; type: Account["type"]; openingBalance: number }) {
    await apiClient.post("/accounts", {
      name: payload.name,
      type: toBackendAccountType(payload.type),
      currency: "USD",
      initialBalance: payload.openingBalance
    });
  },

  async createCategory(payload: { name: string; type: Category["type"] }) {
    await apiClient.post("/categories", {
      name: payload.name,
      type: payload.type === "income" ? "Income" : "Expense"
    });
  },

  async createTransaction(payload: {
    accountId: string;
    categoryId?: string;
    type: Transaction["type"];
    amount: number;
    date: string;
    merchant?: string;
    note?: string;
    tags?: string[];
    destinationAccountId?: string;
  }) {
    if (payload.type === "transfer") {
      if (!payload.destinationAccountId) {
        throw new Error("Destination account is required for transfer.");
      }
      await apiClient.post("/accounts/transfer", {
        fromAccountId: payload.accountId,
        toAccountId: payload.destinationAccountId,
        amount: payload.amount,
        note: payload.note
      });
      return;
    }

    await apiClient.post("/transactions", {
      accountId: payload.accountId,
      categoryId: payload.categoryId,
      type: toBackendTxType(payload.type),
      amount: payload.amount,
      merchant: payload.merchant,
      note: payload.note,
      tagsCsv: payload.tags?.join(","),
      transactionDateUtc: new Date(payload.date).toISOString()
    });
  },

  async deleteTransaction(id: string) {
    await apiClient.delete(`/transactions/${id}`);
  },

  async upsertBudget(payload: { categoryId: string; amount: number; month: number; year: number; alertThresholdPercent: number }) {
    await apiClient.post("/budgets", {
      categoryId: payload.categoryId,
      limitAmount: payload.amount,
      monthStartUtc: new Date(Date.UTC(payload.year, payload.month - 1, 1)).toISOString(),
      alertThresholdPercent: payload.alertThresholdPercent
    });
  },

  async duplicateBudgets(payload: { month: number; year: number }) {
    await apiClient.post("/budgets/duplicate-previous", null, {
      params: {
        monthStartUtc: new Date(Date.UTC(payload.year, payload.month - 1, 1)).toISOString()
      }
    });
  },

  async createGoal(payload: { name: string; targetAmount: number; targetDate?: string }) {
    await apiClient.post("/goals", {
      name: payload.name,
      targetAmount: payload.targetAmount,
      targetDateUtc: payload.targetDate ? new Date(payload.targetDate).toISOString() : null
    });
  },

  async contributeGoal(goalId: string, amount: number) {
    await apiClient.post(`/goals/${goalId}/contribute`, { amount });
  },

  async withdrawGoal(goalId: string, amount: number) {
    await apiClient.post(`/goals/${goalId}/withdraw`, { amount });
  },

  async createRecurring(payload: { accountId: string; categoryId?: string; amount: number; frequency: RecurringTransaction["frequency"]; note: string }) {
    const frequency = payload.frequency === "daily" ? "Daily" : payload.frequency === "weekly" ? "Weekly" : "Monthly";
    await apiClient.post("/recurring", {
      accountId: payload.accountId,
      categoryId: payload.categoryId,
      type: "Expense",
      amount: payload.amount,
      frequency,
      firstRunAtUtc: new Date().toISOString(),
      note: payload.note
    });
  },

  async toggleRecurring(id: string, currentIsPaused: boolean, amount: number, frequency: RecurringTransaction["frequency"], nextRunDate: string, note: string) {
    const frequencyValue = frequency === "daily" ? "Daily" : frequency === "weekly" ? "Weekly" : "Monthly";
    await apiClient.put(`/recurring/${id}`, {
      amount,
      frequency: frequencyValue,
      nextRunAtUtc: new Date(nextRunDate).toISOString(),
      isActive: currentIsPaused,
      note
    });
  },

  async getHealthScore() {
    const response = await apiClient.get<ApiEnvelope<HealthScoreDto>>("/insights/health-score");
    return unwrap({ data: response.data });
  },

  async getCashflowForecast(days = 30) {
    const response = await apiClient.get<ApiEnvelope<CashFlowForecastDto>>("/insights/cashflow-forecast", { params: { days } });
    return unwrap({ data: response.data });
  },

  async getSavingsRateTrend(months = 6) {
    const response = await apiClient.get<ApiEnvelope<Array<{ monthStartUtc: string; savingsRatePercent: number }>>>("/insights/savings-rate-trend", { params: { months } });
    return unwrap({ data: response.data });
  },

  async getNetWorthTrend(months = 6) {
    const response = await apiClient.get<ApiEnvelope<Array<{ monthStartUtc: string; netWorth: number }>>>("/insights/net-worth-trend", { params: { months } });
    return unwrap({ data: response.data });
  },

  async getRules() {
    const response = await apiClient.get<ApiEnvelope<RuleDto[]>>("/rules");
    return unwrap({ data: response.data });
  },

  async createRule(payload: { name: string; merchantContains: string; categoryId?: string; addTag?: string; isActive?: boolean; priority?: number }) {
    const response = await apiClient.post<ApiEnvelope<RuleDto>>("/rules", payload);
    return unwrap({ data: response.data });
  },

  async updateRule(id: string, payload: { name: string; merchantContains: string; categoryId?: string; addTag?: string; isActive: boolean; priority: number }) {
    const response = await apiClient.put<ApiEnvelope<RuleDto>>(`/rules/${id}`, payload);
    return unwrap({ data: response.data });
  },

  async deleteRule(id: string) {
    await apiClient.delete(`/rules/${id}`);
  },

  async getSharedMembers(accountId: string) {
    const response = await apiClient.get<ApiEnvelope<AccountMemberDto[]>>(`/sharedaccounts/${accountId}/members`);
    return unwrap({ data: response.data });
  },

  async addSharedMember(payload: { accountId: string; memberUserId: string; role: "Owner" | "Editor" | "Viewer" }) {
    const response = await apiClient.post<ApiEnvelope<AccountMemberDto>>("/sharedaccounts/members", payload);
    return unwrap({ data: response.data });
  },

  async updateSharedRole(memberId: string, role: "Owner" | "Editor" | "Viewer") {
    const response = await apiClient.put<ApiEnvelope<AccountMemberDto>>(`/sharedaccounts/members/${memberId}/role`, { role });
    return unwrap({ data: response.data });
  },

  async removeSharedMember(memberId: string) {
    await apiClient.delete(`/sharedaccounts/members/${memberId}`);
  }
};
