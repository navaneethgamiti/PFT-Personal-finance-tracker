using System.ComponentModel.DataAnnotations;

namespace PFT.Backend.Application.DTOs.Goals;

public record CreateGoalRequest(
    [Required, MaxLength(120)] string Name,
    [Range(1, 999999999)] decimal TargetAmount,
    DateTime? TargetDateUtc);

public record UpdateGoalRequest(
    [Required, MaxLength(120)] string Name,
    [Range(1, 999999999)] decimal TargetAmount,
    DateTime? TargetDateUtc);

public record GoalContributionRequest([Range(0.01, 999999999)] decimal Amount);

public record GoalDto(Guid Id, string Name, decimal TargetAmount, decimal CurrentAmount, decimal ProgressPercent, DateTime? TargetDateUtc);

