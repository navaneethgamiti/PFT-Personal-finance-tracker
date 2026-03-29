import { useAppDispatch } from "@/hooks/redux";
import { resetToSeedState } from "@/store/slices/financeSlice";
import { setToastMessage } from "@/store/slices/uiSlice";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const SettingsPage = () => {
  const dispatch = useAppDispatch();

  return (
    <section className="space-y-6" data-testid="settings-page">
      <PageHeader title="Settings" subtitle="Control profile, preferences, and environment options." />

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-6">
          <h3 className="text-base font-semibold">Preferences</h3>
          <div className="mt-3 space-y-3 text-sm">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
              <span>Email alerts for budget thresholds</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-indigo-600" />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
              <span>Goal completion notifications</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-indigo-600" />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
              <span>Recurring due reminders</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-indigo-600" />
            </label>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-6">
          <h3 className="text-base font-semibold">Environment</h3>
          <p className="mt-1 text-sm text-slate-500">Use this for demo resets while presenting to judges.</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => {
              dispatch(resetToSeedState());
              dispatch(setToastMessage("Demo data reset."));
            }}
          >
            Reset Demo Data
          </Button>
        </Card>
      </div>
    </section>
  );
};
