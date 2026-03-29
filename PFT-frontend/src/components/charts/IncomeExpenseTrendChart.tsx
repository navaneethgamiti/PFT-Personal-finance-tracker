import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";

interface IncomeExpenseTrendChartProps {
  data: Array<{ name: string; income: number; expense: number }>;
}

export const IncomeExpenseTrendChart = ({ data }: IncomeExpenseTrendChartProps) => (
  <Card className="xl:col-span-2" data-testid="income-expense-trend-chart">
    <CardHeader>
      <CardTitle>Income vs Expense Trend</CardTitle>
    </CardHeader>
    <div className="h-[320px] w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 14, border: "1px solid #dbe2ff", boxShadow: "0 12px 30px -14px rgba(79,70,229,.45)" }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fill="url(#incomeFill)" />
          <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fill="url(#expenseFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </Card>
);