namespace PFT.Backend.Domain.Entities;

public class AccountMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AccountId { get; set; }
    public Guid MemberUserId { get; set; }
    public string Role { get; set; } = "Viewer";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
