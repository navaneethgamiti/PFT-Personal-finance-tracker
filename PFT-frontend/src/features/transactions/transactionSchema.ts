import { z } from "zod";

export const transactionSchema = z
  .object({
    accountId: z.string().min(1, "Account is required"),
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    date: z.string().min(1, "Date is required"),
    categoryId: z.string().optional(),
    destinationAccountId: z.string().optional(),
    merchant: z.string().max(200).optional(),
    note: z.string().max(500).optional(),
    tags: z.string().optional()
  })
  .refine((value) => (value.type === "transfer" ? Boolean(value.destinationAccountId) : true), {
    message: "Destination account is required for transfer",
    path: ["destinationAccountId"]
  })
  .refine((value) => (value.type === "transfer" ? value.accountId !== value.destinationAccountId : true), {
    message: "Source and destination accounts must differ",
    path: ["destinationAccountId"]
  })
  .refine((value) => (value.type === "transfer" ? true : Boolean(value.categoryId)), {
    message: "Category is required for income/expense",
    path: ["categoryId"]
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;