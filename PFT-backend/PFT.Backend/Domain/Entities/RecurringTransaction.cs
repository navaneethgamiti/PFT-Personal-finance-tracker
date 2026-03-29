namespace PFT.Backend.Domain.Entities;

public class RecurringTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }
    public Guid? CategoryId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public RecurringFrequency Frequency { get; set; }
    public DateTime NextRunAtUtc { get; set; }
    public DateTime? LastRunAtUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
