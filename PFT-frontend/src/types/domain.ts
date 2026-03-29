export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export type AccountType = "bank" | "credit_card" | "cash_wallet" | "savings";
export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  currentBalance: number;
  institutionName?: string;
  lastUpdatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  isArchived: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  date: string;
  categoryId?: string;
  merchant?: string;
  note?: string;
  paymentMethod?: string;
  recurringTransactionId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  destinationAccountId?: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: number;
  year: number;
  amount: number;
  alertThresholdPercent: number;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  linkedAccountId?: string;
  icon: string;
  color: string;
  status: "active" | "completed";
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  title: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  accountId: string;
  frequency: Frequency;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  autoCreateTransaction: boolean;
  isPaused: boolean;
}

export interface FinanceState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  recurring: RecurringTransaction[];
}