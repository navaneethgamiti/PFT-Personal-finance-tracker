using System.ComponentModel.DataAnnotations;

namespace PFT.Backend.Application.DTOs.Shared;

public record AddAccountMemberRequest([Required] Guid AccountId, [Required] Guid MemberUserId, [Required, RegularExpression("^(Owner|Editor|Viewer)$")] string Role);

public record UpdateAccountMemberRoleRequest([Required, RegularExpression("^(Owner|Editor|Viewer)$")] string Role);

public record AccountMemberDto(Guid Id, Guid AccountId, Guid MemberUserId, string Role, DateTime CreatedAtUtc);

