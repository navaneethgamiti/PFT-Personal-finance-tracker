using System.ComponentModel.DataAnnotations;
using PFT.Backend.Domain.Entities;

namespace PFT.Backend.Application.DTOs.Transactions;

public record CreateTransactionRequest(
    [Required] Guid AccountId,
    Guid? CategoryId,
    [Required] TransactionType Type,
    [Range(0.01, 999999999)] decimal Amount,
    [MaxLength(120)] string? Merchant,
    [MaxLength(500)] string? Note,
    [MaxLength(400)] string? TagsCsv,
    [Required] DateTime TransactionDateUtc);

public record UpdateTransactionRequest(
    Guid? CategoryId,
    [Range(0.01, 999999999)] decimal Amount,
    [MaxLength(120)] string? Merchant,
    [MaxLength(500)] string? Note,
    [MaxLength(400)] string? TagsCsv,
    [Required] DateTime TransactionDateUtc);

public record TransactionListQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? AccountId = null,
    Guid? CategoryId = null,
    TransactionType? Type = null,
    DateTime? StartDateUtc = null,
    DateTime? EndDateUtc = null,
    string? Search = null);

public record TransactionDto(Guid Id, Guid AccountId, Guid? CategoryId, TransactionType Type, decimal Amount, string? Merchant, string? Note, string? TagsCsv, DateTime TransactionDateUtc);

