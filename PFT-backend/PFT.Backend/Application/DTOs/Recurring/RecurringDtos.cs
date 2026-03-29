using System.ComponentModel.DataAnnotations;
using PFT.Backend.Domain.Entities;

namespace PFT.Backend.Application.DTOs.Recurring;

public record CreateRecurringRequest(
    [Required] Guid AccountId,
    Guid? CategoryId,
    [Required] TransactionType Type,
    [Range(0.01, 999999999)] decimal Amount,
    [Required] RecurringFrequency Frequency,
    [Required] DateTime FirstRunAtUtc,
    [MaxLength(500)] string? Note);

public record UpdateRecurringRequest(
    [Range(0.01, 999999999)] decimal Amount,
    [Required] RecurringFrequency Frequency,
    [Required] DateTime NextRunAtUtc,
    bool IsActive,
    [MaxLength(500)] string? Note);

public record RecurringDto(Guid Id, Guid AccountId, Guid? CategoryId, TransactionType Type, decimal Amount, RecurringFrequency Frequency, DateTime NextRunAtUtc, bool IsActive, string? Note);

