using System.ComponentModel.DataAnnotations;

namespace PFT.Backend.Application.DTOs.Rules;

public record CreateRuleRequest(
    [Required, MaxLength(120)] string Name,
    [Required, MaxLength(120)] string MerchantContains,
    Guid? CategoryId,
    [MaxLength(100)] string? AddTag,
    bool IsActive = true,
    int Priority = 1);

public record UpdateRuleRequest(
    [Required, MaxLength(120)] string Name,
    [Required, MaxLength(120)] string MerchantContains,
    Guid? CategoryId,
    [MaxLength(100)] string? AddTag,
    bool IsActive,
    int Priority);

public record RuleDto(Guid Id, string Name, string MerchantContains, Guid? CategoryId, string? AddTag, bool IsActive, int Priority);

