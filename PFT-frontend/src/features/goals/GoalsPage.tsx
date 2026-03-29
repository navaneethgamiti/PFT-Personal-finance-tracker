import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { addGoalAsync, contributeToGoalAsync, withdrawFromGoalAsync } from "@/store/slices/financeSlice";
import { formatCurrency, percentOf } from "@/utils/format";
import { setToastMessage } from "@/store/slices/uiSlice";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GoalForm {
  name: string;
  targetAmount: number;
  targetDate: string;
}

export const GoalsPage = () => {
  const goals = useAppSelector((state) => state.finance.goals);
  const userId = useAppSelector((state) => state.auth.user?.id ?? "u1");
  const dispatch = useAppDispatch();
  const { register, handleSubmit, reset } = useForm<GoalForm>();

  const onCreate = async (values: GoalForm) => {
    await dispatch(
      addGoalAsync({
        userId,
        name: values.name,
        targetAmount: Number(values.targetAmount),
        targetDate: values.targetDate,
        icon: "FlagIcon",
        color: "#0ea5e9"
      })
    ).unwrap();
    dispatch(setToastMessage("Goal created."));
    reset();
  };

  return (
    <section className="space-y-6" data-testid="goals-page">
      <PageHeader title="Savings Goals" subtitle="Create aspirational goals and move toward them with consistent micro-contributions." />

      <Card>
        <h3 className="mb-3 text-base font-semibold">Create Goal</h3>
        <form onSubmit={handleSubmit(onCreate)} className="form-grid">
          <label className="form-field">
            Goal Name
            <input className="input" {...register("name", { required: true })} data-testid="goal-name" />
          </label>
          <label className="form-field">
            Target Amount
            <input className="input" type="number" min="1" {...register("targetAmount", { required: true, valueAsNumber: true })} data-testid="goal-target" />
          </label>
          <label className="form-field">
            Target Date
            <input className="input" type="date" {...register("targetDate", { required: true })} data-testid="goal-date" />
          </label>
          <Button type="submit" data-testid="save-goal-button">Add Goal</Button>
        </form>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {goals.map((goal, index) => {
          const progress = percentOf(goal.currentAmount, goal.targetAmount);
          return (
            <motion.article key={goal.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="col-span-12 md:col-span-6 xl:col-span-4">
              <Card className="h-full bg-gradient-to-br from-indigo-500/8 to-white">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{goal.name}</h4>
                    <p className="text-xs text-slate-500">Target by {goal.targetDate ?? "Any time"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${goal.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>{goal.status}</span>
                </div>

                <p className="mb-2 text-sm text-slate-500">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</p>
                <div className="progress mb-3">
                  <span style={{ width: `${Math.min(100, progress)}%` }} />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                    onClick={async () => {
                      await dispatch(contributeToGoalAsync({ goalId: goal.id, amount: 500, userId })).unwrap();
                      dispatch(setToastMessage("Added contribution of INR 500."));
                    }}
                    data-testid={`goal-contribute-${goal.id}`}
                  >
                    <ArrowUpTrayIcon width={14} className="mr-1" /> + INR 500 Contribution
                  </Button>
                    <Button
                      type="button"
                      variant="secondary"
                    onClick={async () => {
                      await dispatch(withdrawFromGoalAsync({ goalId: goal.id, amount: 300, userId })).unwrap();
                      dispatch(setToastMessage("Withdrew INR 300 from goal."));
                    }}
                  >
                    <ArrowDownTrayIcon width={14} className="mr-1" /> -300
                  </Button>
                </div>
              </Card>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};
