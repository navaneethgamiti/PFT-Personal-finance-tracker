import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppSelector } from "@/hooks/redux";
import { selectCategorySpendData, selectTopSpendingCategories } from "@/store/selectors/financeSelectors";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { fetchPremiumInsight } from "@/services/mockInsights";

export const ReportsPage = () => {
  const categoryData = useAppSelector(selectCategorySpendData);
  const topCategories = useAppSelector((state) => selectTopSpendingCategories(state, 5));
  const monthlyTrend = useAppSelector((state) => state.finance.transactions);
  const { data: insight } = useQuery({ queryKey: ["report-insight"], queryFn: fetchPremiumInsight });

  const trendData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    monthlyTrend.forEach((transaction) => {
      const key = new Date(transaction.date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const current = map.get(key) ?? { income: 0, expense: 0 };
      if (transaction.type === "income") current.income += transaction.amount;
      if (transaction.type === "expense") current.expense += transaction.amount;
      map.set(key, current);
    });
    return [...map.entries()].map(([name, value]) => ({ name, ...value }));
  }, [monthlyTrend]);

  return (
    <motion.section className="space-y-6" data-testid="reports-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="Reports"
        subtitle="Actionable visual intelligence for where your money flows."
        action={<Button type="button" variant="secondary"><ArrowDownTrayIcon width={14} className="mr-1.5" />Export CSV</Button>}
      />

      <Card>
        <div className="flex flex-wrap gap-2">
          <select className="select"><option>This Month</option><option>Last 30 Days</option><option>This Quarter</option></select>
          <select className="select"><option>All Accounts</option></select>
          <select className="select"><option>All Types</option><option>Income</option><option>Expense</option></select>
        </div>
      </Card>

      {insight ? <Card className="bg-gradient-to-br from-indigo-500/10 to-white"><p className="text-sm font-semibold text-indigo-700">{insight.headline}</p><p className="mt-1 text-sm text-slate-600">{insight.message}</p></Card> : null}

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader><CardTitle>Category Spend</CardTitle></CardHeader>
          <div className="h-[330px] w-full">
            <ResponsiveContainer>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #dbe2ff", boxShadow: "0 12px 30px -14px rgba(79,70,229,.45)" }} formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#4f46e5" radius={[10, 10, 0, 0]} maxBarSize={46} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-12 xl:col-span-4">
          <CardHeader><CardTitle>Top Categories</CardTitle></CardHeader>
          <ul className="space-y-2 text-sm">
            {topCategories.map((item, index) => (
              <li key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="font-medium text-slate-700">{index + 1}. {item.name}</span>
                <span className="font-semibold text-slate-900">{formatCurrency(item.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Income vs Expense</CardTitle></CardHeader>
        <div className="h-[340px] w-full">
          <ResponsiveContainer>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #dbe2ff", boxShadow: "0 12px 30px -14px rgba(79,70,229,.45)" }} formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={42} />
              <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.section>
  );
};
