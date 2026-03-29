import { useMemo } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { addBudgetAsync, duplicateBudgetsAsync } from "@/store/slices/financeSlice";
import { selectBudgetProgress } from "@/store/selectors/financeSelectors";
import { formatCurrency } from "@/utils/format";
import { setToastMessage } from "@/store/slices/uiSlice";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BudgetForm {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

export const BudgetsPage = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.finance.categories.filter((c) => c.type === "expense"));
  const budgetProgress = useAppSelector(selectBudgetProgress);
  const budgets = useAppSelector((state) => state.finance.budgets);
  const userId = useAppSelector((state) => state.auth.user?.id ?? "u1");
  const { register, handleSubmit, reset, watch } = useForm<BudgetForm>({
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    }
  });

  const month = watch("month");
  const year = watch("year");

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);

  const totals = useMemo(() => {
    const planned = budgetProgress.reduce((acc, item) => acc + item.amount, 0);
    const spent = budgetProgress.reduce((acc, item) => acc + item.spent, 0);
    return { planned, spent, remaining: planned - spent };
  }, [budgetProgress]);

  const onSubmit = async (values: BudgetForm) => {
    await dispatch(
      addBudgetAsync({
        userId,
        categoryId: values.categoryId,
        amount: Number(values.amount),
        month: Number(values.month),
        year: Number(values.year),
        alertThresholdPercent: 80
      })
    ).unwrap();
    dispatch(setToastMessage("Budget created."));
    reset({ month: values.month, year: values.year });
  };

  const duplicateLastMonth = async () => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const previous = budgets.filter((b) => b.month === prevMonth && b.year === prevYear);
    await dispatch(duplicateBudgetsAsync({ userId, month, year })).unwrap();
    dispatch(setToastMessage(previous.length ? "Last month budgets duplicated." : "No previous month budgets found."));
  };

  return (
    <section className="space-y-6" data-testid="budgets-page">
      <PageHeader
        title="Budgets"
        subtitle="Set clear monthly limits and stay confidently in control."
        action={
          <Button type="button" variant="secondary" onClick={duplicateLastMonth}>
            <ArrowPathIcon width={14} className="mr-1.5" /> Duplicate Last Month
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-4">
          <h3 className="text-base font-semibold">Budget Overview</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Planned</span><strong>{formatCurrency(totals.planned)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Spent</span><strong>{formatCurrency(totals.spent)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Remaining</span><strong className={totals.remaining < 0 ? "text-rose-500" : "text-emerald-600"}>{formatCurrency(totals.remaining)}</strong></div>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-8">
          <h3 className="mb-3 text-base font-semibold">Set Category Budget</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
            <label className="form-field">
              Category
              <select className="select" {...register("categoryId", { required: true })} data-testid="budget-category">
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Amount
              <input className="input" type="number" min="1" step="0.01" {...register("amount", { required: true, valueAsNumber: true })} data-testid="budget-amount" />
            </label>
            <label className="form-field">
              Month
              <input className="input" type="number" min="1" max="12" {...register("month", { required: true, valueAsNumber: true })} />
            </label>
            <label className="form-field">
              Year
              <input className="input" type="number" min="2000" max="2100" {...register("year", { required: true, valueAsNumber: true })} />
            </label>
            <Button type="submit" data-testid="save-budget-button">Set Budget</Button>
          </form>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {budgetProgress.map((budget, index) => {
          const overBudget = budget.usedPercent > 100;
          return (
            <motion.div key={budget.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="col-span-12 sm:col-span-6 xl:col-span-4">
              <Card className={overBudget ? "ring-rose-300/70" : ""}>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">{categoryMap.get(budget.categoryId) ?? "Unknown"}</h4>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${overBudget ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}>{budget.usedPercent}%</span>
                </div>
                <p className="mb-2 text-sm text-slate-500">{formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}</p>
                <div className="progress">
                  <span style={{ width: `${Math.min(100, budget.usedPercent)}%`, background: overBudget ? "#ef4444" : undefined }} />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
