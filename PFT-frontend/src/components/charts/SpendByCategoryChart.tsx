import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";

interface SpendByCategoryChartProps {
  data: Array<{ name: string; value: number }>;
}

const colors = ["#4f46e5", "#0ea5e9", "#ef4444", "#f59e0b", "#06b6d4", "#7c3aed"];

export const SpendByCategoryChart = ({ data }: SpendByCategoryChartProps) => (
  <Card data-testid="spend-by-category-chart" className="xl:col-span-2">
    <CardHeader>
      <CardTitle>Spending by Category</CardTitle>
    </CardHeader>
    <div className="h-[320px] w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            cornerRadius={10}
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 14, border: "1px solid #dbe2ff", boxShadow: "0 12px 30px -14px rgba(79,70,229,.45)" }}
            formatter={(value: number) => formatCurrency(value)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </Card>
);