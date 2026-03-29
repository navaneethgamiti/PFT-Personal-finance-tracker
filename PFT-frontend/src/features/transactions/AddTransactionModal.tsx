import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { addTransactionAsync } from "@/store/slices/financeSlice";
import { setAddTransactionModalOpen, setToastMessage } from "@/store/slices/uiSlice";
import { transactionSchema, type TransactionFormValues } from "@/features/transactions/transactionSchema";
import { Button } from "@/components/ui/button";

export const AddTransactionModal = () => {
  const isOpen = useAppSelector((state) => state.ui.addTransactionModalOpen);
  const categories = useAppSelector((state) => state.finance.categories);
  const accounts = useAppSelector((state) => state.finance.accounts);
  const userId = useAppSelector((state) => state.auth.user?.id ?? "u1");
  const dispatch = useAppDispatch();

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      date: new Date().toISOString().slice(0, 10)
    }
  });

  const selectedType = watch("type");

  const typeCategories = useMemo(
    () => categories.filter((category) => category.type === (selectedType === "income" ? "income" : "expense")),
    [categories, selectedType]
  );

  const closeModal = () => {
    dispatch(setAddTransactionModalOpen(false));
    reset();
  };

  const onSubmit = async (values: TransactionFormValues) => {
    await dispatch(
      addTransactionAsync({
        userId,
        accountId: values.accountId,
        type: values.type,
        amount: values.amount,
        date: values.date,
        categoryId: values.categoryId,
        merchant: values.merchant,
        note: values.note,
        tags: values.tags ? values.tags.split(",").map((item) => item.trim()).filter(Boolean) : [],
        destinationAccountId: values.destinationAccountId
      })
    ).unwrap();
    dispatch(setToastMessage("Transaction saved."));
    closeModal();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0" onClick={closeModal} />
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 14 }} transition={{ duration: 0.2 }} className="modal relative" data-testid="add-transaction-modal">
            <h2 className="mb-4 text-2xl font-bold tracking-tight">Add Transaction</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-grid">
                <label className="form-field">
                  Type
                  <select className="select" {...register("type")} data-testid="transaction-type">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </label>

                <label className="form-field">
                  Amount
                  <input className="input" type="number" min="0.01" step="0.01" {...register("amount")} data-testid="transaction-amount" />
                  <small className="text-xs text-rose-500">{errors.amount?.message}</small>
                </label>

                <label className="form-field">
                  Date
                  <input className="input" type="date" {...register("date")} data-testid="transaction-date" />
                  <small className="text-xs text-rose-500">{errors.date?.message}</small>
                </label>

                <label className="form-field">
                  Account
                  <select className="select" {...register("accountId")} data-testid="transaction-account">
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  <small className="text-xs text-rose-500">{errors.accountId?.message}</small>
                </label>

                {selectedType !== "transfer" ? (
                  <label className="form-field">
                    Category
                    <select className="select" {...register("categoryId")} data-testid="transaction-category">
                      <option value="">Select category</option>
                      {typeCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <small className="text-xs text-rose-500">{errors.categoryId?.message}</small>
                  </label>
                ) : (
                  <label className="form-field">
                    Destination Account
                    <select className="select" {...register("destinationAccountId")} data-testid="transaction-destination-account">
                      <option value="">Select account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                    <small className="text-xs text-rose-500">{errors.destinationAccountId?.message}</small>
                  </label>
                )}

                <label className="form-field">
                  Merchant
                  <input className="input" {...register("merchant")} data-testid="transaction-merchant" />
                </label>

                <label className="form-field">
                  Note
                  <input className="input" {...register("note")} data-testid="transaction-note" />
                </label>

                <label className="form-field md:col-span-2">
                  Tags
                  <input className="input" {...register("tags")} placeholder="food, family" data-testid="transaction-tags" />
                </label>
              </div>

              <div className="controls mt-4 justify-end">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="save-transaction-button">
                  Save
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};
