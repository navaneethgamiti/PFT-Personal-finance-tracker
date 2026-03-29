namespace PFT.Backend.Domain.Entities;

public class Rule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string MerchantContains { get; set; } = string.Empty;
    public Guid? CategoryId { get; set; }
    public string? AddTag { get; set; }
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 1;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
