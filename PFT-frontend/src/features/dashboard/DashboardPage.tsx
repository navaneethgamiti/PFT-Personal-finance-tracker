import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppSelector } from "@/hooks/redux";
import {
  selectBudgetProgress,
  selectCategorySpendData,
  selectCurrentMonthTransactions,
  selectDashboardSummary
} from "@/store/selectors/financeSelectors";
import { formatCurrency, formatDate } from "@/utils/format";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchPremiumInsight } from "@/services/mockInsights";
import { useAppDispatch } from "@/hooks/redux";
import { setAddTransactionModalOpen } from "@/store/slices/uiSlice";

const categoryColors = ["#312e81", "#4f46e5", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6"];

export const DashboardPage = () => {
  const summary = useAppSelector(selectDashboardSummary);
  const budgetProgress = useAppSelector(selectBudgetProgress);
  const categorySpendData = useAppSelector(selectCategorySpendData);
  const transactions = useAppSelector(selectCurrentMonthTransactions).slice(0, 5);
  const recurring = useAppSelector((state) => state.finance.recurring).slice(0, 5);
  const categories = useAppSelector((state) => state.finance.categories);
  const goals = useAppSelector((state) => state.finance.goals);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const { data: insight } = useQuery({ queryKey: ["premium-insight"], queryFn: fetchPremiumInsight });

  const trendData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();

    transactions.forEach((transaction) => {
      const day = new Date(transaction.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const entry = map.get(day) ?? { income: 0, expense: 0 };
      if (transaction.type === "income") entry.income += transaction.amount;
      if (transaction.type === "expense") entry.expense += transaction.amount;
      map.set(day, entry);
    });

    return [...map.entries()].map(([name, value]) => ({ name, ...value }));
  }, [transactions]);

  const goalContribution = goals.reduce((sum, item) => sum + item.currentAmount, 0);

  const metricCards = [
    { title: "Net Balance", value: formatCurrency(summary.netBalance) },
    { title: "Total Income", value: formatCurrency(summary.income) },
    { title: "Total Expenses", value: formatCurrency(summary.expense) },
    {
      title: "Savings Progress",
      value: `${summary.income ? Math.round((goalContribution / summary.income) * 100) : 0}% saved`
    }
  ];

  return (
    <section data-testid="dashboard-page" className="mx-auto w-full max-w-[1180px] rounded-[22px] border border-black/80 bg-[#f4f6fb] p-3 shadow-[0_26px_55px_-30px_rgba(15,23,42,0.75)]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[16px] bg-gradient-to-r from-indigo-950 via-indigo-700 to-cyan-500 p-4 shadow-[0_18px_30px_-20px_rgba(37,99,235,.65)]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Good evening, {user?.displayName ?? "Navneeth"}</h1>
            <p className="mt-1 text-sm text-indigo-100">{insight?.message ?? "Here is how your money is moving this month."}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" data-testid="global-add-transaction" className="h-9 rounded-xl bg-indigo-600 px-3 text-xs hover:bg-indigo-500" onClick={() => dispatch(setAddTransactionModalOpen(true))}>Add Transaction</Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          {metricCards.map((item) => (
            <div key={item.title} className="col-span-12 sm:col-span-6 xl:col-span-3 rounded-2xl bg-white p-4 text-slate-900 shadow-[0_12px_28px_-18px_rgba(15,23,42,.55)]">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{item.title}</span>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mt-3 grid grid-cols-12 gap-3">
        <Card className="col-span-12 lg:col-span-6">
          <CardHeader><CardTitle>Spending by Category</CardTitle></CardHeader>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_170px]">
            <div className="h-[260px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categorySpendData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} paddingAngle={2}>
                    {categorySpendData.map((entry, index) => (
                      <Cell key={entry.name} fill={categoryColors[index % categoryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 pt-2 text-sm">
              {categorySpendData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColors[index % categoryColors.length] }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-6">
          <CardHeader><CardTitle>Income vs Expenses Trend</CardTitle></CardHeader>
          <div className="h-[260px] w-full">
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="dashboardIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="dashboardExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="income" stroke="#06b6d4" strokeWidth={3} fill="url(#dashboardIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#4f46e5" strokeWidth={3} fill="url(#dashboardExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-12 gap-3">
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader><CardTitle>Budget Progress</CardTitle></CardHeader>
          <div className="space-y-3">
            {budgetProgress.slice(0, 3).map((item) => (
              <div key={item.id}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{categories.find((c) => c.id === item.categoryId)?.name ?? "Category"}</span>
                  <span className="font-semibold text-slate-800">{item.usedPercent}%</span>
                </div>
                <div className="progress"><span style={{ width: `${Math.min(item.usedPercent, 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader><CardTitle>Upcoming Recurring Payments</CardTitle></CardHeader>
          <div className="space-y-2.5">
            {recurring.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(item.nextRunDate)}</p>
                </div>
                <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <div className="space-y-2.5" data-testid="recent-transactions-table">
            {transactions.slice(0, 3).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{transaction.merchant ?? "Merchant"}</p>
                  <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                </div>
                <span className={`text-sm font-bold ${transaction.type === "expense" ? "text-rose-600" : "text-emerald-600"}`}>
                  {transaction.type === "expense" ? "-" : "+"}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
};
