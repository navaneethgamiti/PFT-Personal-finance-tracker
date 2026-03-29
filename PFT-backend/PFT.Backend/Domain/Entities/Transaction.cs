namespace PFT.Backend.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }
    public Guid? CategoryId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public string? Merchant { get; set; }
    public string? TagsCsv { get; set; }
    public string? Note { get; set; }
    public DateTime TransactionDateUtc { get; set; }
    public Guid? RelatedTransferId { get; set; }
    public Guid? SourceRecurringId { get; set; }
    public DateTime? SourceRunAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
