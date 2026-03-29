using System.ComponentModel.DataAnnotations;

namespace PFT.Backend.Application.DTOs.Budgets;

public record UpsertBudgetRequest(
    [Required] Guid CategoryId,
    [Required] DateTime MonthStartUtc,
    [Range(1, 999999999)] decimal LimitAmount,
    [Range(1, 100)] decimal AlertThresholdPercent);

public record BudgetDto(Guid Id, Guid CategoryId, DateTime MonthStartUtc, decimal LimitAmount, decimal AlertThresholdPercent, decimal CurrentSpend, bool IsThresholdCrossed);

