namespace PFT.Backend.Domain.Entities;

public class Budget
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid CategoryId { get; set; }
    public DateTime MonthStartUtc { get; set; }
    public decimal LimitAmount { get; set; }
    public decimal AlertThresholdPercent { get; set; } = 80;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
