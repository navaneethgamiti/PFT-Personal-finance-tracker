import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { backendApi } from "@/services/backendApi";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { formatCurrency } from "@/utils/format";

export const InsightsPage = () => {
  const { data: health } = useQuery({ queryKey: ["health-score"], queryFn: () => backendApi.getHealthScore() });
  const { data: forecast } = useQuery({ queryKey: ["cashflow-forecast"], queryFn: () => backendApi.getCashflowForecast(30) });
  const { data: savingsTrend = [] } = useQuery({ queryKey: ["savings-rate-trend"], queryFn: () => backendApi.getSavingsRateTrend(6) });

  return (
    <section className="space-y-6" data-testid="insights-page">
      <PageHeader title="Insights" subtitle="Forecast cash flow, track financial health, and plan safely." />

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 md:col-span-3">
          <p className="text-sm text-slate-500">Health Score</p>
          <p className="mt-2 text-4xl font-extrabold text-indigo-700">{health?.score ?? "-"}</p>
        </Card>
        <Card className="col-span-12 md:col-span-3">
          <p className="text-sm text-slate-500">Savings Rate</p>
          <p className="mt-2 text-2xl font-bold">{health ? `${health.savingsRatePercent.toFixed(1)}%` : "-"}</p>
        </Card>
        <Card className="col-span-12 md:col-span-3">
          <p className="text-sm text-slate-500">Forecast End Balance</p>
          <p className="mt-2 text-2xl font-bold">{forecast ? formatCurrency(forecast.forecastedEndBalance) : "-"}</p>
        </Card>
        <Card className="col-span-12 md:col-span-3">
          <p className="text-sm text-slate-500">Safe To Spend</p>
          <p className="mt-2 text-2xl font-bold">{forecast ? formatCurrency(forecast.safeToSpend) : "-"}</p>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Daily Projected Balance</CardTitle></CardHeader>
        <div className="h-[320px]">
          <ResponsiveContainer>
            <LineChart data={(forecast?.trend ?? []).map((p) => ({ date: new Date(p.dateUtc).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), balance: p.projectedBalance }))}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {forecast?.riskWarnings?.length ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            {forecast.riskWarnings.join(" ")}
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHeader><CardTitle>Savings Rate Trend</CardTitle></CardHeader>
        <div className="h-[280px]">
          <ResponsiveContainer>
            <LineChart data={savingsTrend.map((p) => ({ month: new Date(p.monthStartUtc).toLocaleDateString("en-IN", { month: "short" }), savingsRate: p.savingsRatePercent }))}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: number) => `${Number(value).toFixed(1)}%`} />
              <Line type="monotone" dataKey="savingsRate" stroke="#06b6d4" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
};
