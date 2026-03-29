import type { FinanceState, User } from "@/types/domain";

const now = new Date().toISOString();
const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

export const defaultUser: User = {
  id: "u1",
  email: "demo@pft.local",
  displayName: "Demo User"
};

export const seedFinanceState: FinanceState = {
  accounts: [
    {
      id: "a1",
      userId: "u1",
      name: "Primary Bank",
      type: "bank",
      openingBalance: 5000,
      currentBalance: 7328,
      institutionName: "Contoso Bank",
      lastUpdatedAt: now
    },
    {
      id: "a2",
      userId: "u1",
      name: "Credit Card",
      type: "credit_card",
      openingBalance: 0,
      currentBalance: -420,
      institutionName: "Northwind Card",
      lastUpdatedAt: now
    }
  ],
  categories: [
    { id: "c1", userId: "u1", name: "Salary", type: "income", color: "#0284c7", icon: "BanknotesIcon", isArchived: false },
    { id: "c2", userId: "u1", name: "Food", type: "expense", color: "#ef4444", icon: "CakeIcon", isArchived: false },
    { id: "c3", userId: "u1", name: "Transport", type: "expense", color: "#f59e0b", icon: "TruckIcon", isArchived: false },
    { id: "c4", userId: "u1", name: "Rent", type: "expense", color: "#7c3aed", icon: "HomeIcon", isArchived: false },
    { id: "c5", userId: "u1", name: "Freelance", type: "income", color: "#16a34a", icon: "BriefcaseIcon", isArchived: false }
  ],
  transactions: [
    {
      id: "t1",
      userId: "u1",
      accountId: "a1",
      type: "income",
      amount: 2400,
      date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`,
      categoryId: "c1",
      merchant: "Employer Inc",
      note: "Monthly salary",
      tags: ["salary"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "t2",
      userId: "u1",
      accountId: "a1",
      type: "expense",
      amount: 85,
      date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-03`,
      categoryId: "c2",
      merchant: "Grocery Mart",
      note: "Weekly groceries",
      tags: ["family"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "t3",
      userId: "u1",
      accountId: "a2",
      type: "expense",
      amount: 22,
      date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-04`,
      categoryId: "c3",
      merchant: "Uber",
      note: "Airport ride",
      tags: ["travel"],
      createdAt: now,
      updatedAt: now
    }
  ],
  budgets: [
    { id: "b1", userId: "u1", categoryId: "c2", month: currentMonth, year: currentYear, amount: 600, alertThresholdPercent: 80 },
    { id: "b2", userId: "u1", categoryId: "c3", month: currentMonth, year: currentYear, amount: 300, alertThresholdPercent: 80 }
  ],
  goals: [
    {
      id: "g1",
      userId: "u1",
      name: "Emergency Fund",
      targetAmount: 10000,
      currentAmount: 3800,
      targetDate: `${currentYear}-12-31`,
      icon: "ShieldCheckIcon",
      color: "#0ea5e9",
      status: "active"
    }
  ],
  recurring: [
    {
      id: "r1",
      userId: "u1",
      title: "Netflix",
      type: "expense",
      amount: 15,
      categoryId: "c2",
      accountId: "a2",
      frequency: "monthly",
      startDate: `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`,
      nextRunDate: `${currentYear}-${String(currentMonth).padStart(2, "0")}-25`,
      autoCreateTransaction: true,
      isPaused: false
    }
  ]
};

export const emptyFinanceState: FinanceState = {
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  goals: [],
  recurring: []
};
