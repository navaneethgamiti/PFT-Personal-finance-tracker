using System.ComponentModel.DataAnnotations;

namespace PFT.Backend.Application.DTOs.Accounts;

public record CreateAccountRequest(
    [Required, MaxLength(120)] string Name,
    [Required, MaxLength(50)] string Type,
    [Required, StringLength(3, MinimumLength = 3)] string Currency,
    [Range(0, 999999999)] decimal InitialBalance);

public record TransferFundsRequest(
    [Required] Guid FromAccountId,
    [Required] Guid ToAccountId,
    [Range(0.01, 999999999)] decimal Amount,
    [MaxLength(500)] string? Note);

public record AccountBalanceDto(Guid Id, string Name, string Currency, decimal Balance, string Type);

