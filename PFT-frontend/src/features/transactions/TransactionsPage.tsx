import { useMemo } from "react";
import { FunnelIcon, MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { deleteTransactionAsync } from "@/store/slices/financeSlice";
import { setAddTransactionModalOpen, setToastMessage, setTransactionSearchTerm } from "@/store/slices/uiSlice";
import { formatCurrency, formatDate } from "@/utils/format";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const TransactionsPage = () => {
  const transactions = useAppSelector((state) => state.finance.transactions);
  const categories = useAppSelector((state) => state.finance.categories);
  const accounts = useAppSelector((state) => state.finance.accounts);
  const userId = useAppSelector((state) => state.auth.user?.id ?? "u1");
  const searchTerm = useAppSelector((state) => state.ui.transactionSearchTerm);
  const dispatch = useAppDispatch();

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      return transactions;
    }
    return transactions.filter((transaction) => (transaction.merchant ?? "").toLowerCase().includes(term) || (transaction.note ?? "").toLowerCase().includes(term));
  }, [transactions, searchTerm]);

  return (
    <section data-testid="transactions-page" className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Track every inflow and outflow with rich context and fast controls."
        action={
          <Button type="button" onClick={() => dispatch(setAddTransactionModalOpen(true))} data-testid="add-transaction-button">
            Add Transaction
          </Button>
        }
      />

      <Card className="sticky top-24 z-10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <MagnifyingGlassIcon width={16} className="text-slate-400" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              value={searchTerm}
              onChange={(event) => dispatch(setTransactionSearchTerm(event.target.value))}
              placeholder="Search merchant or note"
              aria-label="Search transactions"
              data-testid="transactions-search"
            />
          </div>
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
            <FunnelIcon width={14} />
            Filters Active
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No transactions yet" description="Add your first transaction to start visualizing your cash flow." ctaLabel="Add Transaction" onCtaClick={() => dispatch(setAddTransactionModalOpen(true))} />
      ) : (
        <Card>
          <div className="hidden md:block">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((transaction) => {
                  const category = categories.find((item) => item.id === transaction.categoryId);
                  const account = accounts.find((item) => item.id === transaction.accountId);
                  return (
                    <tr key={transaction.id} data-testid="transaction-row">
                      <td>{formatDate(transaction.date)}</td>
                      <td>{transaction.merchant ?? "-"}</td>
                      <td>{category?.name ?? "-"}</td>
                      <td>{account?.name ?? "-"}</td>
                      <td>
                        <span className={`badge ${transaction.type === "income" ? "income" : "expense"}`}>{transaction.type}</span>
                      </td>
                      <td className="font-semibold">{formatCurrency(transaction.amount)}</td>
                      <td>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await dispatch(deleteTransactionAsync({ id: transaction.id, userId })).unwrap();
                            dispatch(setToastMessage("Transaction deleted."));
                          }}
                          data-testid={`delete-transaction-${transaction.id}`}
                        >
                          <TrashIcon width={14} className="mr-1" /> Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((transaction) => {
              const category = categories.find((item) => item.id === transaction.categoryId);
              const account = accounts.find((item) => item.id === transaction.accountId);
              return (
                <motion.div key={transaction.id} data-testid="transaction-row" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{transaction.merchant ?? "Unknown Merchant"}</p>
                      <p className="text-xs text-slate-500">{formatDate(transaction.date)}</p>
                    </div>
                    <p className="text-base font-bold">{formatCurrency(transaction.amount)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{category?.name ?? "No Category"}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{account?.name ?? "No Account"}</span>
                    <span className={`badge ${transaction.type === "income" ? "income" : "expense"}`}>{transaction.type}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}
    </section>
  );
};
