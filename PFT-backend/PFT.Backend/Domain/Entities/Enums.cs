namespace PFT.Backend.Domain.Entities;

public enum TransactionType
{
    Expense = 1,
    Income = 2,
    TransferOut = 3,
    TransferIn = 4
}

public enum RecurringFrequency
{
    Daily = 1,
    Weekly = 2,
    Monthly = 3
}
