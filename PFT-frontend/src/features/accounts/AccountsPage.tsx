import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { addAccountAsync, addCategoryAsync } from "@/store/slices/financeSlice";
import { formatCurrency, formatDate } from "@/utils/format";
import { setToastMessage } from "@/store/slices/uiSlice";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AccountForm {
  name: string;
  type: "bank" | "credit_card" | "cash_wallet" | "savings";
  openingBalance: number;
  institutionName: string;
}

interface CategoryForm {
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
}

export const AccountsPage = () => {
  const accounts = useAppSelector((state) => state.finance.accounts);
  const categories = useAppSelector((state) => state.finance.categories);
  const userId = useAppSelector((state) => state.auth.user?.id ?? "u1");
  const dispatch = useAppDispatch();

  const accountForm = useForm<AccountForm>({ defaultValues: { type: "bank", openingBalance: 0, institutionName: "" } });
  const categoryForm = useForm<CategoryForm>({ defaultValues: { type: "expense", color: "#0ea5e9", icon: "Tag" } });

  const totalBalance = useMemo(() => accounts.reduce((sum, account) => sum + account.currentBalance, 0), [accounts]);

  const addAccountHandler = async (values: AccountForm) => {
    await dispatch(
      addAccountAsync({
        userId,
        name: values.name,
        type: values.type,
        openingBalance: Number(values.openingBalance),
        institutionName: values.institutionName
      })
    ).unwrap();
    dispatch(setToastMessage("Account added."));
    accountForm.reset({ type: "bank", openingBalance: 0, institutionName: "" });
  };

  const addCategoryHandler = async (values: CategoryForm) => {
    await dispatch(addCategoryAsync({ userId, name: values.name, type: values.type, color: values.color, icon: values.icon })).unwrap();
    dispatch(setToastMessage("Category added."));
    categoryForm.reset({ type: "expense", color: "#0ea5e9", icon: "Tag" });
  };

  const addStarterData = async () => {
    if (!accounts.length) {
      await dispatch(
        addAccountAsync({
          userId,
          name: "Primary Bank",
          type: "bank",
          openingBalance: 0,
          institutionName: "My Bank"
        })
      ).unwrap();
    }

    const existingCategoryNames = new Set(categories.map((c) => c.name.toLowerCase()));
    const starterCategories: Array<{ name: string; type: "income" | "expense"; color: string; icon: string }> = [
      { name: "Salary", type: "income", color: "#16a34a", icon: "BanknotesIcon" },
      { name: "Groceries", type: "expense", color: "#ef4444", icon: "ShoppingBagIcon" },
      { name: "Transport", type: "expense", color: "#f59e0b", icon: "TruckIcon" },
      { name: "Rent", type: "expense", color: "#7c3aed", icon: "HomeIcon" }
    ];

    for (const item of starterCategories) {
      if (!existingCategoryNames.has(item.name.toLowerCase())) {
        await dispatch(addCategoryAsync({ userId, ...item })).unwrap();
      }
    }

    dispatch(setToastMessage("Starter account and categories added."));
  };

  return (
    <section className="space-y-6" data-testid="accounts-page">
      <PageHeader
        title="Accounts"
        subtitle="Keep all wallets and bank accounts in one trustworthy command center."
        action={
          <Button type="button" variant="secondary" onClick={() => dispatch(setToastMessage("Transfer flow UI entry point clicked."))}>
            <ArrowsRightLeftIcon width={14} className="mr-1.5" /> Transfer Funds
          </Button>
        }
      />

      <Card className="bg-gradient-to-br from-indigo-500/10 to-white">
        <p className="text-sm text-slate-500">Total Across Accounts</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatCurrency(totalBalance)}</p>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {!accounts.length ? (
          <Card className="col-span-12 border-dashed">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">No accounts yet</h3>
                <p className="text-sm text-slate-500">Add your first account manually, or use starter data.</p>
              </div>
              <Button type="button" onClick={addStarterData}>Add Starter Data</Button>
            </div>
          </Card>
        ) : null}
        {accounts.map((account) => (
          <Card key={account.id} className="col-span-12 sm:col-span-6 xl:col-span-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">{account.type.replace("_", " ")}</p>
            <p className="mt-1 text-lg font-semibold">{account.name}</p>
            <p className="mt-3 text-2xl font-extrabold">{formatCurrency(account.currentBalance)}</p>
            <p className="mt-1 text-xs text-slate-500">Updated {formatDate(account.lastUpdatedAt)}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-6">
          <h3 className="mb-3 text-base font-semibold">Add Account</h3>
          <form className="form-grid" onSubmit={accountForm.handleSubmit(addAccountHandler)}>
            <label className="form-field">Name<input className="input" {...accountForm.register("name", { required: true })} /></label>
            <label className="form-field">Type
              <select className="select" {...accountForm.register("type")}>
                <option value="bank">Bank</option><option value="credit_card">Credit Card</option><option value="cash_wallet">Cash Wallet</option><option value="savings">Savings</option>
              </select>
            </label>
            <label className="form-field">Opening Balance<input className="input" type="number" step="0.01" {...accountForm.register("openingBalance", { valueAsNumber: true })} /></label>
            <label className="form-field">Institution<input className="input" {...accountForm.register("institutionName")} /></label>
            <Button className="w-fit" type="submit">Add Account</Button>
          </form>
        </Card>

        <Card className="col-span-12 lg:col-span-6">
          <h3 className="mb-3 text-base font-semibold">Categories</h3>
          <form className="form-grid" onSubmit={categoryForm.handleSubmit(addCategoryHandler)}>
            <label className="form-field">Name<input className="input" {...categoryForm.register("name", { required: true })} /></label>
            <label className="form-field">Type
              <select className="select" {...categoryForm.register("type")}>
                <option value="expense">Expense</option><option value="income">Income</option>
              </select>
            </label>
            <label className="form-field">Color<input className="input" {...categoryForm.register("color")} /></label>
            <label className="form-field">Icon<input className="input" {...categoryForm.register("icon")} /></label>
            <Button className="w-fit" type="submit">Add Category</Button>
          </form>

          <div className="mt-4 max-h-[220px] overflow-auto rounded-xl border border-slate-200">
            <table className="table">
              <thead><tr><th>Name</th><th>Type</th><th>Color</th></tr></thead>
              <tbody>
                {categories.length ? (
                  categories.map((category) => (<tr key={category.id}><td>{category.name}</td><td>{category.type}</td><td>{category.color}</td></tr>))
                ) : (
                  <tr><td colSpan={3} className="text-center text-slate-500">No categories yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
};
