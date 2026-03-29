import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { addRecurringAsync, toggleRecurringPausedAsync } from "@/store/slices/financeSlice";
import { setToastMessage } from "@/store/slices/uiSlice";
import { formatCurrency, formatDate } from "@/utils/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RecurringForm {
  title: string;
  amount: number;
  accountId: string;
  categoryId: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  nextRunDate: string;
}

export const RecurringPage = () => {
  const recurring = useAppSelector((state) => state.finance.recurring);
  const accounts = useAppSelector((state) => state.finance.accounts);
  const expenseCategories = useAppSelector((state) => state.finance.categories.filter((c) => c.type === "expense"));
  const userId = useAppSelector((state) => state.auth.user?.id ?? "u1");
  const dispatch = useAppDispatch();
  const { register, handleSubmit, reset } = useForm<RecurringForm>({
    defaultValues: {
      frequency: "monthly",
      nextRunDate: new Date().toISOString().slice(0, 10)
    }
  });

  const upcoming = useMemo(
    () => [...recurring].sort((a, b) => new Date(a.nextRunDate).getTime() - new Date(b.nextRunDate).getTime()),
    [recurring]
  );

  const onSubmit = async (values: RecurringForm) => {
    await dispatch(
      addRecurringAsync({
        userId,
        title: values.title,
        type: "expense",
        amount: Number(values.amount),
        categoryId: values.categoryId,
        accountId: values.accountId,
        frequency: values.frequency,
        startDate: new Date().toISOString().slice(0, 10),
        nextRunDate: values.nextRunDate,
        autoCreateTransaction: true
      })
    ).unwrap();
    dispatch(setToastMessage("Recurring item created."));
    reset({ frequency: "monthly", nextRunDate: values.nextRunDate });
  };

  return (
    <section className="space-y-6" data-testid="recurring-page">
      <PageHeader title="Recurring Payments" subtitle="Manage subscriptions and recurring inflows with timeline visibility." />

      <Card>
        <h3 className="mb-3 text-base font-semibold">New Recurring Item</h3>
        <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
          <label className="form-field">
            Title
            <input className="input" {...register("title", { required: true })} />
          </label>
          <label className="form-field">
            Amount
            <input className="input" type="number" min="1" {...register("amount", { required: true, valueAsNumber: true })} />
          </label>
          <label className="form-field">
            Account
            <select className="select" {...register("accountId", { required: true })}>
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Category
            <select className="select" {...register("categoryId", { required: true })}>
              <option value="">Select category</option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Frequency
            <select className="select" {...register("frequency")}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <label className="form-field">
            Next Run Date
            <input className="input" type="date" {...register("nextRunDate", { required: true })} />
          </label>
          <Button type="submit">Save Recurring</Button>
        </form>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-5">
          <h3 className="mb-2 text-base font-semibold">Next Due Timeline</h3>
          <div className="space-y-3">
            {upcoming.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                <div className="mt-0.5 rounded-xl bg-indigo-100 p-2 text-indigo-700"><ClockIcon width={14} /></div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(item.nextRunDate)} · {item.frequency}</p>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <h3 className="mb-2 text-base font-semibold">Recurring Manager</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recurring.map((item, index) => (
                <motion.tr key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  <td>{item.title}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{item.frequency}</td>
                  <td>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.autoCreateTransaction ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {item.isPaused ? "Paused" : item.autoCreateTransaction ? "Auto Create" : "Manual"}
                    </span>
                  </td>
                  <td>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={async () =>
                        dispatch(
                          toggleRecurringPausedAsync({
                            id: item.id,
                            userId,
                            isPaused: item.isPaused,
                            amount: item.amount,
                            frequency: item.frequency,
                            nextRunDate: item.nextRunDate,
                            title: item.title
                          })
                        ).unwrap()
                      }
                    >
                      {item.isPaused ? "Resume" : "Pause"}
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </section>
  );
};
